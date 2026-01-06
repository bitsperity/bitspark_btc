/**
 * List Service
 * 
 * NIP-51 Bookmark Sets implementation for BitSpark.
 * Kind 30003 = Bookmark Sets (multiple per user, replaceable by d-tag)
 * 
 * Features:
 * - Create/delete named lists
 * - Add/remove Ideas, Jobs, Comments to lists
 * - Subscribe to list changes
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk, createEvent } from '$lib/nostr';
import { APP_TAG, NOSTR_KINDS } from '$lib/nostr/config';
import { writable, derived, get, type Readable } from 'svelte/store';

const KIND_BOOKMARK_SET = 30003; // NIP-51 Bookmark Sets

export interface ListItem {
    eventId: string;
    type: 'idea' | 'job' | 'comment';
}

export interface List {
    id: string;           // d-tag identifier
    eventId: string;      // NDK event id (for deletion)
    title: string;
    description?: string;
    image?: string;
    items: ListItem[];
    createdAt: number;
}

// Local cache of lists
const listsCache = writable<List[]>([]);
const isLoading = writable(false);

// Track IDs added via optimistic update to avoid duplicate from subscription
const pendingOptimisticIds = new Set<string>();

// Active subscription
let subscription: any = null;

class ListService {
    /**
     * Initialize list subscription for current user
     */
    async init(): Promise<void> {
        const user = ndk.activeUser;
        if (!user) {
            console.log('[Lists] No user logged in');
            return;
        }

        await this.loadLists(user.pubkey);
        this.subscribeToChanges(user.pubkey);
    }

    /**
     * Load lists from relays
     */
    async loadLists(pubkey: string): Promise<List[]> {
        isLoading.set(true);

        try {
            // Fetch list events
            const listFilter: NDKFilter = {
                kinds: [KIND_BOOKMARK_SET],
                authors: [pubkey],
                '#s': ['bitspark']
            };
            const events = await ndk.fetchEvents(listFilter);
            const allLists = Array.from(events).map(e => this.parseListEvent(e));

            // Fetch Kind 5 delete events to filter out deleted lists
            const deleteFilter: NDKFilter = {
                kinds: [5],
                authors: [pubkey]
            };
            const deleteEvents = await ndk.fetchEvents(deleteFilter);
            const deletedEventIds = new Set<string>();
            for (const delEvent of deleteEvents) {
                for (const tag of delEvent.tags) {
                    if (tag[0] === 'e') {
                        deletedEventIds.add(tag[1]);
                    }
                }
            }

            // Filter out invalid lists and deleted lists
            const lists = allLists.filter(l =>
                l.title !== 'Untitled List' &&
                l.id &&
                !deletedEventIds.has(l.eventId)
            );

            // Only cache if loading own lists
            const user = ndk.activeUser;
            if (user && user.pubkey === pubkey) {
                listsCache.set(lists);
            }

            console.log('[Lists] Loaded', lists.length, 'lists (filtered', deletedEventIds.size, 'deleted)');
            return lists;
        } catch (error) {
            console.error('[Lists] Failed to load:', error);
            return [];
        } finally {
            isLoading.set(false);
        }
    }

    /**
     * Subscribe to list changes for current user
     */
    private subscribeToChanges(pubkey: string): void {
        if (subscription) {
            subscription.stop();
        }

        const filter: NDKFilter = {
            kinds: [KIND_BOOKMARK_SET],
            authors: [pubkey],
            '#s': ['bitspark']
        };

        subscription = ndk.subscribe(filter, { closeOnEose: false });

        subscription.on('event', (event: NDKEvent) => {
            const newList = this.parseListEvent(event);

            // Skip lists without proper title (old/broken events)
            if (newList.title === 'Untitled List' || !newList.id) {
                console.log('[Lists] Skipped invalid list (no title or d-tag):', event.id);
                return;
            }

            // Skip deleted lists
            if (event.tags.some(t => t[0] === 'deleted')) {
                const current = get(listsCache);
                listsCache.set(current.filter(l => l.id !== newList.id));
                pendingOptimisticIds.delete(newList.id);
                return;
            }

            // Skip if this ID was added via optimistic update (avoid duplicate)
            if (pendingOptimisticIds.has(newList.id)) {
                pendingOptimisticIds.delete(newList.id);
                console.log('[Lists] Skipped optimistic duplicate:', newList.title);
                return;
            }

            const current = get(listsCache);
            const existingIndex = current.findIndex(l => l.id === newList.id);

            if (existingIndex >= 0) {
                if (newList.createdAt >= current[existingIndex].createdAt) {
                    const updated = [...current];
                    updated[existingIndex] = newList;
                    listsCache.set(updated);
                    console.log('[Lists] Updated via subscription:', newList.title);
                }
            } else {
                listsCache.set([...current, newList]);
                console.log('[Lists] Added via subscription:', newList.title);
            }
        });
    }

    /**
     * Parse list event into List object
     */
    private parseListEvent(event: NDKEvent): List {
        const items: ListItem[] = [];
        let title = 'Untitled List';
        let description: string | undefined;
        let image: string | undefined;
        let dTag = '';

        for (const tag of event.tags) {
            if (tag[0] === 'd') {
                dTag = tag[1];
            } else if (tag[0] === 'title') {
                title = tag[1];
            } else if (tag[0] === 'description') {
                description = tag[1];
            } else if (tag[0] === 'image') {
                image = tag[1];
            } else if (tag[0] === 'e') {
                const eventId = tag[1];
                const type = tag[3] as 'idea' | 'job' | 'comment' | undefined;
                if (type) {
                    items.push({ eventId, type });
                }
            }
        }

        return {
            id: dTag,
            eventId: event.id,
            title,
            description,
            image,
            items,
            createdAt: event.created_at ?? 0
        };
    }

    /**
     * Create a new list
     */
    async createList(title: string, description?: string): Promise<List> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Generate unique d-tag
        const dTag = `list-${Date.now()}`;

        // Mark as pending BEFORE publish (subscription might receive before optimistic update)
        pendingOptimisticIds.add(dTag);

        const event = createEvent();
        event.kind = KIND_BOOKMARK_SET;
        event.content = '';
        event.tags = [
            APP_TAG,
            ['d', dTag],
            ['title', title]
        ];

        if (description) {
            event.tags.push(['description', description]);
        }

        await event.publish();

        const newList: List = {
            id: dTag,
            eventId: event.id,
            title,
            description,
            items: [],
            createdAt: Math.floor(Date.now() / 1000)
        };

        // Optimistic update
        const current = get(listsCache);
        listsCache.set([...current, newList]);

        console.log('[Lists] Created list:', title);
        return newList;
    }

    /**
     * Delete a list using NIP-09 (Kind 5)
     */
    async deleteList(listId: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        // Find the list to get its eventId
        const list = get(listsCache).find(l => l.id === listId);
        if (!list?.eventId) {
            console.error('[Lists] Cannot delete - list not found or no eventId');
            return;
        }

        // Publish Kind 5 delete event (NIP-09)
        const deleteEvent = createEvent();
        deleteEvent.kind = 5;
        deleteEvent.tags = [['e', list.eventId]];
        await deleteEvent.publish();

        // Optimistic update
        const current = get(listsCache);
        listsCache.set(current.filter(l => l.id !== listId));

        console.log('[Lists] Deleted list via Kind 5:', listId);
    }

    /**
     * Update list metadata
     */
    async updateList(listId: string, updates: { title?: string; description?: string; image?: string }): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        const current = get(listsCache);
        const list = current.find(l => l.id === listId);
        if (!list) throw new Error('List not found');

        // Merge updates
        const updatedList = { ...list, ...updates };

        // Publish updated list
        await this.publishList(updatedList);

        // Optimistic update
        const updatedCache = current.map(l => l.id === listId ? updatedList : l);
        listsCache.set(updatedCache);
    }

    /**
     * Add item to list
     */
    async addToList(listId: string, eventId: string, type: 'idea' | 'job' | 'comment'): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        const current = get(listsCache);
        const list = current.find(l => l.id === listId);
        if (!list) throw new Error('List not found');

        // Check if already in list
        if (list.items.some(item => item.eventId === eventId)) {
            console.log('[Lists] Item already in list');
            return;
        }

        // Add item
        const updatedList = {
            ...list,
            items: [...list.items, { eventId, type }]
        };

        // Publish updated list
        await this.publishList(updatedList);

        // Optimistic update
        const updatedCache = current.map(l => l.id === listId ? updatedList : l);
        listsCache.set(updatedCache);

        console.log('[Lists] Added item to list:', list.title);
    }

    /**
     * Remove item from list
     */
    async removeFromList(listId: string, eventId: string): Promise<void> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        const current = get(listsCache);
        const list = current.find(l => l.id === listId);
        if (!list) throw new Error('List not found');

        // Remove item
        const updatedList = {
            ...list,
            items: list.items.filter(item => item.eventId !== eventId)
        };

        // Publish updated list
        await this.publishList(updatedList);

        // Optimistic update
        const updatedCache = current.map(l => l.id === listId ? updatedList : l);
        listsCache.set(updatedCache);

        console.log('[Lists] Removed item from list:', list.title);
    }

    /**
     * Publish a list event
     */
    private async publishList(list: List): Promise<void> {
        const event = createEvent();
        event.kind = KIND_BOOKMARK_SET;
        event.content = '';
        event.tags = [
            APP_TAG,
            ['d', list.id],
            ['title', list.title]
        ];

        if (list.description) {
            event.tags.push(['description', list.description]);
        }
        if (list.image) {
            event.tags.push(['image', list.image]);
        }

        // Add items
        for (const item of list.items) {
            event.tags.push(['e', item.eventId, '', item.type]);
        }

        await event.publish();
    }

    /**
     * Check if item is in any list
     */
    getListsContainingItem(eventId: string): Readable<List[]> {
        return derived(listsCache, $lists =>
            $lists.filter(list => list.items.some(item => item.eventId === eventId))
        );
    }

    /**
     * Check if item is in specific list
     */
    isInList(listId: string, eventId: string): Readable<boolean> {
        return derived(listsCache, $lists => {
            const list = $lists.find(l => l.id === listId);
            return list?.items.some(item => item.eventId === eventId) ?? false;
        });
    }

    /**
     * Subscribe to all lists
     */
    subscribeLists(): Readable<List[]> {
        return derived(listsCache, $lists =>
            $lists.filter(l => !l.items.some(i => i.type === 'deleted' as any))
        );
    }

    /**
     * Subscribe to loading state
     */
    subscribeLoading(): Readable<boolean> {
        return { subscribe: isLoading.subscribe };
    }

    /**
     * Get list by ID
     */
    getList(listId: string): List | undefined {
        return get(listsCache).find(l => l.id === listId);
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

export const listService = new ListService();
