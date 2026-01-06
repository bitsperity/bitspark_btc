/**
 * Bookmark Service
 * 
 * NIP-51 Lists implementation for BitSpark.
 * Kind 10003 = Global Bookmarks (replaceable, one per user)
 * 
 * Features:
 * - Add/remove Ideas and Jobs from bookmarks
 * - Subscribe to bookmark changes
 * - Check if event is bookmarked
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk, createEvent } from '$lib/nostr';
import { APP_TAG, NOSTR_KINDS } from '$lib/nostr/config';
import { writable, derived, get, type Readable } from 'svelte/store';

const KIND_BOOKMARKS = 10003; // NIP-51 Bookmarks

interface BookmarkedItem {
    eventId: string;
    type: 'idea' | 'job' | 'unknown';
    addedAt?: number;
}

// Local cache of bookmarks
const bookmarksCache = writable<BookmarkedItem[]>([]);
const isLoading = writable(false);
const lastEvent = writable<NDKEvent | null>(null);

// Active subscription
let subscription: any = null;

class BookmarkService {
    /**
     * Initialize bookmark subscription for current user
     */
    async init(): Promise<void> {
        const user = ndk.activeUser;
        if (!user) {
            console.log('[Bookmarks] No user logged in');
            return;
        }

        await this.loadBookmarks(user.pubkey);
        this.subscribeToChanges(user.pubkey);
    }

    /**
     * Load bookmarks from relays
     */
    private async loadBookmarks(pubkey: string): Promise<void> {
        isLoading.set(true);

        try {
            const filter: NDKFilter = {
                kinds: [KIND_BOOKMARKS],
                authors: [pubkey],
                limit: 1
            };

            const events = await ndk.fetchEvents(filter);
            const event = Array.from(events)[0];

            if (event) {
                lastEvent.set(event);
                const items = this.parseBookmarkEvent(event);
                bookmarksCache.set(items);
                console.log('[Bookmarks] Loaded', items.length, 'bookmarks');
            } else {
                bookmarksCache.set([]);
                console.log('[Bookmarks] No bookmark list found');
            }
        } catch (error) {
            console.error('[Bookmarks] Failed to load:', error);
        } finally {
            isLoading.set(false);
        }
    }

    /**
     * Subscribe to bookmark changes
     */
    private subscribeToChanges(pubkey: string): void {
        if (subscription) {
            subscription.stop();
        }

        const filter: NDKFilter = {
            kinds: [KIND_BOOKMARKS],
            authors: [pubkey]
        };

        subscription = ndk.subscribe(filter, { closeOnEose: false });

        subscription.on('event', (event: NDKEvent) => {
            const currentEvent = get(lastEvent);
            // Only update if newer
            if (!currentEvent || (event.created_at && currentEvent.created_at && event.created_at > currentEvent.created_at)) {
                lastEvent.set(event);
                const items = this.parseBookmarkEvent(event);
                bookmarksCache.set(items);
                console.log('[Bookmarks] Updated via subscription');
            }
        });
    }

    /**
     * Parse bookmark event into items
     */
    private parseBookmarkEvent(event: NDKEvent): BookmarkedItem[] {
        const items: BookmarkedItem[] = [];

        for (const tag of event.tags) {
            if (tag[0] === 'e') {
                const eventId = tag[1];
                const type = tag[3] as 'idea' | 'job' | undefined;
                items.push({
                    eventId,
                    type: type || 'unknown'
                });
            }
        }

        return items;
    }

    /**
     * Add event to bookmarks
     */
    async addBookmark(eventId: string, type: 'idea' | 'job'): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Get current bookmarks
        const current = get(bookmarksCache);

        // Check if already bookmarked
        if (current.some(b => b.eventId === eventId)) {
            console.log('[Bookmarks] Already bookmarked');
            return;
        }

        // Create new bookmark list with added item
        const newItem: BookmarkedItem = { eventId, type };
        const updated = [...current, newItem];

        // Publish updated list
        await this.publishBookmarks(updated);

        // Optimistic update
        bookmarksCache.set(updated);
    }

    /**
     * Remove event from bookmarks
     */
    async removeBookmark(eventId: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Get current bookmarks
        const current = get(bookmarksCache);

        // Remove from list
        const updated = current.filter(b => b.eventId !== eventId);

        // Publish updated list
        await this.publishBookmarks(updated);

        // Optimistic update
        bookmarksCache.set(updated);
    }

    /**
     * Toggle bookmark state
     */
    async toggleBookmark(eventId: string, type: 'idea' | 'job'): Promise<boolean> {
        const isMarked = this.isBookmarkedSync(eventId);

        if (isMarked) {
            await this.removeBookmark(eventId);
            return false;
        } else {
            await this.addBookmark(eventId, type);
            return true;
        }
    }

    /**
     * Publish updated bookmark list
     */
    private async publishBookmarks(items: BookmarkedItem[]): Promise<void> {
        const event = createEvent();
        event.kind = KIND_BOOKMARKS;
        event.content = '';
        event.tags = [
            APP_TAG,
            ...items.map(item => ['e', item.eventId, '', item.type])
        ];

        await event.publish();
        lastEvent.set(event);
        console.log('[Bookmarks] Published updated list with', items.length, 'items');
    }

    /**
     * Check if event is bookmarked (sync)
     */
    isBookmarkedSync(eventId: string): boolean {
        return get(bookmarksCache).some(b => b.eventId === eventId);
    }

    /**
     * Subscribe to bookmark status for specific event
     */
    isBookmarked(eventId: string): Readable<boolean> {
        return derived(bookmarksCache, $cache =>
            $cache.some(b => b.eventId === eventId)
        );
    }

    /**
     * Subscribe to all bookmarks
     */
    subscribeBookmarks(): Readable<BookmarkedItem[]> {
        return { subscribe: bookmarksCache.subscribe };
    }

    /**
     * Subscribe to loading state
     */
    subscribeLoading(): Readable<boolean> {
        return { subscribe: isLoading.subscribe };
    }

    /**
     * Get bookmarks of specific type
     */
    getBookmarksByType(type: 'idea' | 'job'): Readable<BookmarkedItem[]> {
        return derived(bookmarksCache, $cache =>
            $cache.filter(b => b.type === type)
        );
    }

    /**
     * Cleanup subscription
     */
    destroy(): void {
        if (subscription) {
            subscription.stop();
            subscription = null;
        }
    }
}

export const bookmarkService = new BookmarkService();
