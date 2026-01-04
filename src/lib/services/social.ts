/**
 * Social Service
 * 
 * Handles likes (reactions) and follows.
 * Event-agnostic: works on any event ID.
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk, createEvent } from '$lib/nostr';
import { writable, derived, get, type Readable } from 'svelte/store';

// Nostr Kinds for social features
const KIND_FOLLOW_LIST = 3;
const KIND_REACTION = 7;

// Cache for reactions and follows
const reactionsCache = writable<Map<string, Set<string>>>(new Map()); // eventId -> Set of pubkeys
const myReactions = writable<Set<string>>(new Set()); // eventIds I've liked
const followingList = writable<Set<string>>(new Set()); // pubkeys I'm following
const followersCache = writable<Map<string, Set<string>>>(new Map()); // pubkey -> Set of followers

// Track subscriptions
let reactionsSubscription: any = null;
let followsSubscription: any = null;

class SocialService {
    // ═══════════════════════════════════════════════════════════════
    // LIKES / REACTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Like an event (Kind 7 reaction)
     */
    async likeEvent(eventId: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Check if already liked
        if (get(myReactions).has(eventId)) {
            console.log('[Social] Already liked this event');
            return;
        }

        const event = createEvent();
        event.kind = KIND_REACTION;
        event.content = '+'; // Standard "like" reaction
        event.tags = [
            ['e', eventId],
            ['p', user.pubkey] // Tag yourself (convention)
        ];

        await event.publish();

        // Optimistic update
        myReactions.update(set => {
            set.add(eventId);
            return new Set(set);
        });
        reactionsCache.update(cache => {
            const existing = cache.get(eventId) || new Set();
            existing.add(user.pubkey);
            cache.set(eventId, existing);
            return new Map(cache);
        });

        console.log('[Social] Liked event:', eventId);
    }

    /**
     * Unlike an event (publish delete event)
     * Note: Some relays may not honor deletes
     */
    async unlikeEvent(eventId: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Find the reaction event to delete
        const reactions = await ndk.fetchEvents({
            kinds: [KIND_REACTION],
            authors: [user.pubkey],
            '#e': [eventId]
        } as NDKFilter);

        for (const reaction of reactions) {
            // Publish delete event (Kind 5)
            const deleteEvent = createEvent();
            deleteEvent.kind = 5;
            deleteEvent.tags = [['e', reaction.id]];
            await deleteEvent.publish();
        }

        // Optimistic update
        myReactions.update(set => {
            set.delete(eventId);
            return new Set(set);
        });
        reactionsCache.update(cache => {
            const existing = cache.get(eventId);
            if (existing && user) {
                existing.delete(user.pubkey);
                cache.set(eventId, existing);
            }
            return new Map(cache);
        });

        console.log('[Social] Unliked event:', eventId);
    }

    /**
     * Get reactive like count for an event
     */
    subscribeLikeCount(eventId: string): Readable<number> {
        // Start subscription if not yet active
        this.ensureReactionsSubscription();

        return derived(reactionsCache, $cache => {
            return $cache.get(eventId)?.size || 0;
        });
    }

    /**
     * Get reactive "is liked by me" status
     */
    subscribeIsLiked(eventId: string): Readable<boolean> {
        return derived(myReactions, $my => $my.has(eventId));
    }

    /**
     * Start global reactions subscription
     */
    private ensureReactionsSubscription(): void {
        if (reactionsSubscription) return;

        // Subscribe to all BitSpark reactions
        const filter: NDKFilter = {
            kinds: [KIND_REACTION],
            limit: 1000
        };

        reactionsSubscription = ndk.subscribe(filter, { closeOnEose: false });

        reactionsSubscription.on('event', (event: NDKEvent) => {
            const eventId = event.tags.find(t => t[0] === 'e')?.[1];
            if (!eventId) return;

            reactionsCache.update(cache => {
                const existing = cache.get(eventId) || new Set();
                existing.add(event.pubkey);
                cache.set(eventId, existing);
                return new Map(cache);
            });

            // Track if it's my reaction
            if (event.pubkey === ndk.activeUser?.pubkey) {
                myReactions.update(set => {
                    set.add(eventId);
                    return new Set(set);
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // FOLLOWS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Follow a user
     */
    async followUser(pubkey: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Get current follow list
        const currentFollowing = get(followingList);
        if (currentFollowing.has(pubkey)) {
            console.log('[Social] Already following');
            return;
        }

        // Add to list
        const newFollowing = new Set(currentFollowing);
        newFollowing.add(pubkey);

        // Publish new follow list (Kind 3)
        await this.publishFollowList(Array.from(newFollowing));

        // Optimistic update
        followingList.set(newFollowing);
        console.log('[Social] Followed:', pubkey);
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(pubkey: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        const currentFollowing = get(followingList);
        if (!currentFollowing.has(pubkey)) {
            console.log('[Social] Not following');
            return;
        }

        // Remove from list
        const newFollowing = new Set(currentFollowing);
        newFollowing.delete(pubkey);

        // Publish new follow list
        await this.publishFollowList(Array.from(newFollowing));

        // Optimistic update
        followingList.set(newFollowing);
        console.log('[Social] Unfollowed:', pubkey);
    }

    /**
     * Publish Kind 3 follow list
     */
    private async publishFollowList(pubkeys: string[]): Promise<void> {
        const event = createEvent();
        event.kind = KIND_FOLLOW_LIST;
        event.content = '';
        event.tags = pubkeys.map(pk => ['p', pk]);
        await event.publish();
    }

    /**
     * Get reactive "am I following" status
     */
    subscribeIsFollowing(pubkey: string): Readable<boolean> {
        this.ensureFollowsSubscription();
        return derived(followingList, $list => $list.has(pubkey));
    }

    /**
     * Get my following list
     */
    subscribeFollowing(): Readable<string[]> {
        this.ensureFollowsSubscription();
        return derived(followingList, $list => Array.from($list));
    }

    /**
     * Get followers of a user
     */
    subscribeFollowers(pubkey: string): Readable<string[]> {
        this.ensureFollowsSubscription();
        return derived(followersCache, $cache => {
            return Array.from($cache.get(pubkey) || []);
        });
    }

    /**
     * Start follows subscription
     */
    private ensureFollowsSubscription(): void {
        if (followsSubscription) return;

        const user = ndk.activeUser;
        if (!user) {
            // No user yet - will be called again when needed
            return;
        }

        this.fetchMyFollowList();

        // Subscribe to follow lists to track followers
        const filter: NDKFilter = {
            kinds: [KIND_FOLLOW_LIST],
            limit: 500
        };

        followsSubscription = ndk.subscribe(filter, { closeOnEose: false });

        followsSubscription.on('event', (event: NDKEvent) => {
            const following = event.tags
                .filter(t => t[0] === 'p')
                .map(t => t[1]);

            // If this is MY follow list, update my following
            if (event.pubkey === ndk.activeUser?.pubkey) {
                followingList.set(new Set(following));
                console.log('[Social] Updated my follow list:', following.length, 'follows');
            }

            // Update followers cache - this user follows these pubkeys
            for (const pk of following) {
                followersCache.update(cache => {
                    const existing = cache.get(pk) || new Set();
                    existing.add(event.pubkey);
                    cache.set(pk, existing);
                    return new Map(cache);
                });
            }
        });
    }

    /**
     * Fetch my follow list (call after login)
     */
    async fetchMyFollowList(): Promise<void> {
        const user = ndk.activeUser;
        if (!user) return;

        console.log('[Social] Fetching my follow list...');

        const event = await ndk.fetchEvent({
            kinds: [KIND_FOLLOW_LIST],
            authors: [user.pubkey]
        } as NDKFilter);

        if (event) {
            const following = event.tags
                .filter(t => t[0] === 'p')
                .map(t => t[1]);
            followingList.set(new Set(following));
            console.log('[Social] Loaded follow list:', following.length, 'follows');
        } else {
            followingList.set(new Set());
            console.log('[Social] No follow list found');
        }
    }

    /**
     * Reset state on logout
     */
    reset(): void {
        followsSubscription = null;
        followingList.set(new Set());
        myReactions.set(new Set());
        console.log('[Social] Reset');
    }

    /**
     * Initialize service (call on app start or login)
     */
    init(): void {
        this.ensureReactionsSubscription();
        this.ensureFollowsSubscription();
    }
}

export const socialService = new SocialService();
