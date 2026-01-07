/**
 * GiftWrapService - Central NIP-59 Gift Wrap Handler
 * 
 * This service provides a single point for all Gift Wrap operations:
 * - Global subscription to Kind 1059 events addressed to current user
 * - Decryption and caching of unwrapped events
 * - Distribution to typed stores based on event kind
 * 
 * Usage:
 *   giftWrapService.start()  // Call after login
 *   giftWrapService.stop()   // Call on logout
 *   giftWrapService.getDecryptedEvent(id)  // Get cached event by rumor ID
 */

import { NDKEvent, type NDKFilter, giftUnwrap, NDKKind } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS, APP_TAG } from '$lib/nostr/config';
import { writable, derived, type Readable } from 'svelte/store';

// NIP-59 Gift Wrap kind
const GIFT_WRAP_KIND = NDKKind.GiftWrap; // 1059

// Store for all decrypted BitSpark events
const allDecryptedEvents = writable<NDKEvent[]>([]);

// Central cache by rumor ID
const eventCache = new Map<string, NDKEvent>();

// Running state
let isRunning = false;
let subscription: { stop: () => void } | null = null;

/**
 * Derived stores for specific event kinds
 */
export const offerEvents: Readable<NDKEvent[]> = derived(
    allDecryptedEvents,
    $events => $events.filter(e => e.kind === NOSTR_KINDS.OFFER)
);

export const dmEvents: Readable<NDKEvent[]> = derived(
    allDecryptedEvents,
    $events => $events.filter(e => e.kind === NDKKind.PrivateDirectMessage)
);

export const contractEvents: Readable<NDKEvent[]> = derived(
    allDecryptedEvents,
    $events => $events.filter(e => e.kind === NOSTR_KINDS.CONTRACT)
);

class GiftWrapService {
    /**
     * Start the global Gift Wrap subscription
     * Call this after user logs in
     */
    start(): void {
        if (isRunning) return;

        const user = ndk.activeUser;
        if (!user) {
            console.warn('[GiftWrapService] No active user, cannot start');
        }

        // Subscribe to all Gift Wraps addressed to me
        const filter: NDKFilter = {
            kinds: [GIFT_WRAP_KIND as number],
            '#p': [user.pubkey],
            limit: 500
        };

        const sub = ndk.subscribe(filter, { closeOnEose: false }) as any;
        subscription = sub;
        isRunning = true;

        sub.on('event', async (event: NDKEvent) => {
            await this.processGiftWrap(event);
        });
    }

    /**
     * Stop the subscription
     * Call this on logout
     */
    stop(): void {
        if (subscription) {
            subscription.stop();
            subscription = null;
        }
        isRunning = false;
        eventCache.clear();
        allDecryptedEvents.set([]);
    }

    /**
     * Process a single Gift Wrap event
     */
    private async processGiftWrap(event: NDKEvent): Promise<void> {
        try {
            const signer = ndk.signer;
            if (!signer) return;

            // Unwrap the gift
            const unwrapped = await giftUnwrap(event, undefined, signer as any);

            // Kind 14/15 are NIP-17 DMs - allow without APP_TAG
            const isDM = unwrapped.kind === 14 || unwrapped.kind === 15;

            // For non-DMs, check if it's a BitSpark event
            if (!isDM) {
                const appTag = unwrapped.tags.find(t => t[0] === 's' && t[1] === 'bitspark');
                if (!appTag) return;
            }

            // Get event ID (rumor ID)
            const rumorId = unwrapped.id;
            if (!rumorId) return;

            // Skip if already cached by rumor ID
            if (eventCache.has(rumorId)) return;

            // Additional deduplication: check for matching content (same rumor from different gift wraps)
            const isDuplicate = Array.from(eventCache.values()).some(cached =>
                cached.pubkey === unwrapped.pubkey &&
                cached.kind === unwrapped.kind &&
                cached.created_at === unwrapped.created_at &&
                cached.content === unwrapped.content
            );
            if (isDuplicate) {
                console.debug('[GiftWrapService] Skipping duplicate rumor');
                return;
            }

            // Cache it
            eventCache.set(rumorId, unwrapped);

            // Add to store (with extra duplicate check)
            allDecryptedEvents.update(events => {
                // Avoid duplicates by content match
                const exists = events.some(e =>
                    e.pubkey === unwrapped.pubkey &&
                    e.kind === unwrapped.kind &&
                    e.created_at === unwrapped.created_at &&
                    e.content === unwrapped.content
                );
                if (exists) return events;
                return [...events, unwrapped];
            });
        } catch (error) {
            // Silently ignore - could be a gift wrap for another app
        }
    }

    /**
     * Get a decrypted event by its rumor ID
     */
    getDecryptedEvent(id: string): NDKEvent | null {
        return eventCache.get(id) ?? null;
    }

    /**
     * Check if the service is running
     */
    get running(): boolean {
        return isRunning;
    }

    /**
     * Get cache size for debugging
     */
    get cacheSize(): number {
        return eventCache.size;
    }

    /**
     * Send a gift-wrapped event to a recipient (and optionally self)
     * @param rumor The event to wrap
     * @param recipientPubkey Recipient's public key
     * @param sendCopyToSelf Whether to send a copy to yourself
     * @param signRumor Whether to sign the inner event (for proofs). Default true for BitSpark.
     */
    async sendGiftWrap(
        rumor: NDKEvent,
        recipientPubkey: string,
        sendCopyToSelf = true,
        signRumor = true  // Sign by default for proof capability
    ): Promise<{ toRecipient: NDKEvent; toSelf?: NDKEvent }> {
        const { giftWrap } = await import('@nostr-dev-kit/ndk');

        const signer = ndk.signer;
        if (!signer) throw new Error('No signer available');

        const user = await signer.user();

        // Ensure rumor has required fields
        if (!rumor.pubkey) rumor.pubkey = user.pubkey;
        if (!rumor.created_at) rumor.created_at = Math.floor(Date.now() / 1000);

        // Sign the rumor and store signature in a custom tag for contract proofs
        // NIP-59 rumors are unsigned by design, but we need cryptographic proofs
        // So we sign it, capture the signature, and store it in a tag
        if (signRumor) {
            await rumor.sign(signer as any);
            if (rumor.sig) {
                rumor.tags.push(['orig_sig', rumor.sig]);
            }
        }

        // Wrap for recipient
        const recipient = ndk.getUser({ pubkey: recipientPubkey });
        const wrappedForRecipient = await giftWrap(rumor, recipient as any, signer as any);
        await wrappedForRecipient.publish();

        let wrappedForSelf: NDKEvent | undefined;

        if (sendCopyToSelf) {
            // Wrap for self
            const selfUser = ndk.getUser({ pubkey: user.pubkey });
            wrappedForSelf = await giftWrap(rumor, selfUser as any, signer as any);
            await wrappedForSelf.publish();
        }

        return { toRecipient: wrappedForRecipient, toSelf: wrappedForSelf };
    }
}

export const giftWrapService = new GiftWrapService();
