/**
 * DM Service - NIP-17 Private Direct Messages
 * 
 * Provides:
 * - Conversation management (group by participants)
 * - Send DM via gift wrap
 * - Unread tracking
 */

import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { giftWrapService, dmEvents } from './giftwrap';
import { profileService } from './profiles';
import { writable, derived, get, type Readable } from 'svelte/store';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

// DM Kind (NIP-17)
const DM_KIND = 14;

// Types
export interface DMMessage {
    id: string;
    content: string;
    senderPubkey: string;
    createdAt: number;
    isMe: boolean;
}

export interface Conversation {
    participantPubkey: string;
    participantProfile?: NDKUserProfile;
    messages: DMMessage[];
    lastMessage?: DMMessage;
    unreadCount: number;
}

// Stores
const conversationsCache = writable<Map<string, Conversation>>(new Map());
const readTimestamps = writable<Map<string, number>>(new Map()); // pubkey -> last read timestamp

// Derived: sorted conversations list
export const conversations: Readable<Conversation[]> = derived(
    conversationsCache,
    $cache => {
        return Array.from($cache.values())
            .filter(c => c.messages.length > 0)
            .sort((a, b) => {
                const aTime = a.lastMessage?.createdAt ?? 0;
                const bTime = b.lastMessage?.createdAt ?? 0;
                return bTime - aTime; // newest first
            });
    }
);

// Derived: total unread count
export const totalUnread: Readable<number> = derived(
    conversations,
    $convos => $convos.reduce((sum, c) => sum + c.unreadCount, 0)
);

class DMService {
    private initialized = false;

    /**
     * Initialize DM service - call after login
     */
    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        // Load read timestamps from localStorage
        this.loadReadTimestamps();

        // Subscribe to dmEvents from giftWrapService
        dmEvents.subscribe(events => {
            console.log('[DM] dmEvents updated, count:', events.length);
            this.processEvents(events);
        });

        console.log('[DM] Service initialized');
    }

    /**
     * Process DM events into conversations
     */
    private processEvents(events: NDKEvent[]): void {
        const user = ndk.activeUser;
        if (!user) return;

        const myPubkey = user.pubkey;
        const cache = get(conversationsCache);
        const timestamps = get(readTimestamps);

        for (const event of events) {
            // Get the other participant
            const pTags = event.tags.filter(t => t[0] === 'p');
            const senderPubkey = event.pubkey;

            // Find the other party (not me)
            let otherPubkey: string | undefined;

            if (senderPubkey === myPubkey) {
                // I sent this - other party is in p tag
                otherPubkey = pTags.find(t => t[1] !== myPubkey)?.[1];
            } else {
                // Someone sent to me
                otherPubkey = senderPubkey;
            }

            if (!otherPubkey) continue;

            // Create message object
            const message: DMMessage = {
                id: event.id,
                content: event.content,
                senderPubkey: senderPubkey,
                createdAt: event.created_at ?? 0,
                isMe: senderPubkey === myPubkey
            };

            // Get or create conversation
            let convo = cache.get(otherPubkey);
            if (!convo) {
                convo = {
                    participantPubkey: otherPubkey,
                    messages: [],
                    unreadCount: 0
                };
                cache.set(otherPubkey, convo);

                // Load profile async
                this.loadParticipantProfile(otherPubkey);
            }

            // Add message if not duplicate
            if (!convo.messages.find(m => m.id === message.id)) {
                convo.messages.push(message);
                convo.messages.sort((a, b) => a.createdAt - b.createdAt);
                convo.lastMessage = convo.messages[convo.messages.length - 1];

                // Calculate unread (messages from other after last read)
                const lastRead = timestamps.get(otherPubkey) ?? 0;
                convo.unreadCount = convo.messages.filter(
                    m => !m.isMe && m.createdAt > lastRead
                ).length;
            }
        }

        conversationsCache.set(cache);
    }

    /**
     * Load participant profile
     */
    private async loadParticipantProfile(pubkey: string): Promise<void> {
        const profile = await profileService.getProfile(pubkey);
        if (profile) {
            conversationsCache.update(cache => {
                const convo = cache.get(pubkey);
                if (convo) {
                    convo.participantProfile = profile;
                }
                return cache;
            });
        }
    }

    /**
     * Send a DM to a user
     */
    async sendDM(recipientPubkey: string, content: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        const now = Math.floor(Date.now() / 1000);
        const tempId = `temp-${now}-${Math.random().toString(36).slice(2)}`;

        // Create message object for optimistic update
        const message: DMMessage = {
            id: tempId,
            content: content,
            senderPubkey: user.pubkey,
            createdAt: now,
            isMe: true
        };

        // Optimistic update - show message immediately
        conversationsCache.update(cache => {
            let convo = cache.get(recipientPubkey);
            if (!convo) {
                convo = {
                    participantPubkey: recipientPubkey,
                    messages: [],
                    unreadCount: 0
                };
                cache.set(recipientPubkey, convo);
                // Load profile async
                this.loadParticipantProfile(recipientPubkey);
            }
            convo.messages.push(message);
            convo.lastMessage = message;
            return cache;
        });

        // Create Kind 14 rumor (unsigned)
        const rumor = new NDKEvent(ndk);
        rumor.kind = DM_KIND;
        rumor.content = content;
        rumor.tags = [['p', recipientPubkey]];
        rumor.pubkey = user.pubkey;
        rumor.created_at = now;

        // Send via gift wrap (to recipient + self)
        await giftWrapService.sendGiftWrap(rumor, recipientPubkey, true, false);

        console.log('[DM] Sent message to', recipientPubkey.slice(0, 8));
    }

    /**
     * Mark conversation as read
     */
    markAsRead(participantPubkey: string): void {
        const now = Math.floor(Date.now() / 1000);

        readTimestamps.update(timestamps => {
            timestamps.set(participantPubkey, now);
            return timestamps;
        });

        conversationsCache.update(cache => {
            const convo = cache.get(participantPubkey);
            if (convo) {
                convo.unreadCount = 0;
            }
            return cache;
        });

        this.saveReadTimestamps();
    }

    /**
     * Get conversation by participant pubkey
     */
    getConversation(participantPubkey: string): Conversation | undefined {
        return get(conversationsCache).get(participantPubkey);
    }

    /**
     * Load read timestamps from localStorage
     */
    private loadReadTimestamps(): void {
        try {
            const stored = localStorage.getItem('bitspark_dm_read');
            if (stored) {
                const data = JSON.parse(stored);
                readTimestamps.set(new Map(Object.entries(data)));
            }
        } catch (e) {
            console.warn('[DM] Failed to load read timestamps');
        }
    }

    /**
     * Save read timestamps to localStorage
     */
    private saveReadTimestamps(): void {
        try {
            const timestamps = get(readTimestamps);
            const data = Object.fromEntries(timestamps);
            localStorage.setItem('bitspark_dm_read', JSON.stringify(data));
        } catch (e) {
            console.warn('[DM] Failed to save read timestamps');
        }
    }
}

export const dmService = new DMService();
