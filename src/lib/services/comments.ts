/**
 * Comment Service
 * 
 * Handles comments on any BitSpark event.
 * Uses Kind 1 notes with [s, bitspark] tag.
 * 
 * Supports lazy-loading: fetch replies on-demand.
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk, createEvent } from '$lib/nostr';
import { APP_TAG } from '$lib/nostr/config';
import { writable, derived, get, type Readable } from 'svelte/store';
import type { Comment } from '$lib/types/social';
import { createTagAccessors, parseBaseEvent } from '$lib/utils';

const KIND_NOTE = 1;

// Cache: eventId/commentId -> comments (children)
const commentsCache = writable<Map<string, Comment[]>>(new Map());

// Track active subscriptions
const activeSubscriptions = new Map<string, any>();

// Track which comments have loaded their replies
const loadedReplies = writable<Set<string>>(new Set());

class CommentService {
    /**
     * Create a comment on any event
     */
    async createComment(eventId: string, content: string, replyToCommentId?: string): Promise<NDKEvent> {
        const user = ndk.activeUser;
        if (!user) throw new Error('Not logged in');

        const event = createEvent();
        event.kind = KIND_NOTE;
        event.content = content;
        event.tags = [
            ['e', eventId, '', 'root'],  // Always tag the root event
            APP_TAG
        ];

        // If replying to a comment, add that reference too
        if (replyToCommentId) {
            event.tags.push(['e', replyToCommentId, '', 'reply']);
        }

        await event.publish();

        // Update cache optimistically
        const comment = this.parseComment(event);
        const cacheKey = replyToCommentId || eventId;
        commentsCache.update(cache => {
            const existing = cache.get(cacheKey) || [];
            cache.set(cacheKey, [...existing, comment]);
            return new Map(cache);
        });

        console.log('[Comments] Created comment on:', cacheKey);
        return event;
    }

    /**
     * Delete a comment (request deletion)
     */
    async deleteComment(commentId: string): Promise<void> {
        const deleteEvent = createEvent();
        deleteEvent.kind = 5;
        deleteEvent.tags = [['e', commentId]];
        await deleteEvent.publish();
        console.log('[Comments] Deleted comment:', commentId);
    }

    /**
     * Subscribe to top-level comments for an event (no replyToCommentId)
     */
    subscribeTopLevelComments(eventId: string): Readable<Comment[]> {
        // Start subscription if not active
        if (!activeSubscriptions.has(eventId)) {
            this.startTopLevelSubscription(eventId);
        }

        return derived(commentsCache, $cache => {
            const comments = $cache.get(eventId) || [];
            // Sort by date, oldest first
            return [...comments].sort((a, b) => {
                const aTime = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.getTime();
                const bTime = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.getTime();
                return aTime - bTime;
            });
        });
    }

    /**
     * Subscribe to replies for a specific comment (lazy-loaded)
     */
    subscribeReplies(commentId: string): Readable<Comment[]> {
        return derived(commentsCache, $cache => {
            const replies = $cache.get(commentId) || [];
            return [...replies].sort((a, b) => {
                const aTime = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.getTime();
                const bTime = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.getTime();
                return aTime - bTime;
            });
        });
    }

    /**
     * Check if replies for a comment have been loaded
     */
    hasLoadedReplies(commentId: string): Readable<boolean> {
        return derived(loadedReplies, $loaded => $loaded.has(commentId));
    }

    /**
     * Fetch replies for a specific comment (on-demand)
     */
    async fetchReplies(commentId: string): Promise<void> {
        // Check if already loaded
        if (get(loadedReplies).has(commentId)) {
            return;
        }

        const filter: NDKFilter = {
            kinds: [KIND_NOTE],
            '#e': [commentId],
            '#s': ['bitspark']
        };

        const events = await ndk.fetchEvents(filter);
        const replies: Comment[] = [];

        for (const event of events) {
            const comment = this.parseComment(event);
            // Only include direct replies to this comment
            if (comment.replyToCommentId === commentId) {
                replies.push(comment);
            }
        }

        // Update cache
        commentsCache.update(cache => {
            cache.set(commentId, replies);
            return new Map(cache);
        });

        // Mark as loaded
        loadedReplies.update(set => {
            set.add(commentId);
            return new Set(set);
        });

        console.log(`[Comments] Loaded ${replies.length} replies for:`, commentId);
    }

    /**
     * Get total comment count for an event (top-level only for display)
     */
    subscribeCommentCount(eventId: string): Readable<number> {
        if (!activeSubscriptions.has(eventId)) {
            this.startTopLevelSubscription(eventId);
        }

        return derived(commentsCache, $cache => {
            return ($cache.get(eventId) || []).length;
        });
    }

    // Legacy method for backwards compatibility
    subscribeComments(eventId: string): Readable<Comment[]> {
        return this.subscribeTopLevelComments(eventId);
    }

    /**
     * Start subscription for top-level comments on an event
     */
    private startTopLevelSubscription(eventId: string): void {
        const filter: NDKFilter = {
            kinds: [KIND_NOTE],
            '#e': [eventId],
            '#s': ['bitspark']
        };

        const sub = ndk.subscribe(filter, { closeOnEose: false });

        sub.on('event', (event: NDKEvent) => {
            const comment = this.parseComment(event);

            // Only add top-level comments to the main event cache
            // (comments with no replyToCommentId or where replyToCommentId is the event itself)
            if (!comment.replyToCommentId) {
                commentsCache.update(cache => {
                    const existing = cache.get(eventId) || [];
                    if (!existing.find(c => c.id === comment.id)) {
                        cache.set(eventId, [...existing, comment]);
                    }
                    return new Map(cache);
                });
            } else {
                // It's a reply - add to parent comment's cache if loaded
                const parentId = comment.replyToCommentId;
                if (get(loadedReplies).has(parentId)) {
                    commentsCache.update(cache => {
                        const existing = cache.get(parentId) || [];
                        if (!existing.find(c => c.id === comment.id)) {
                            cache.set(parentId, [...existing, comment]);
                        }
                        return new Map(cache);
                    });
                }
            }
        });

        activeSubscriptions.set(eventId, sub);
    }

    /**
     * Parse NDKEvent to Comment
     */
    private parseComment(event: NDKEvent): Comment {
        const { getTag } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        // Parse e tags to find root and reply
        const eTags = event.tags.filter(t => t[0] === 'e');
        let rootEventId = '';
        let replyToCommentId: string | undefined;

        for (const tag of eTags) {
            const marker = tag[3];
            if (marker === 'root') {
                rootEventId = tag[1];
            } else if (marker === 'reply') {
                replyToCommentId = tag[1];
            }
        }

        // Fallback: if no markers, first e tag is root
        if (!rootEventId && eTags.length > 0) {
            rootEventId = eTags[0][1];
        }

        return {
            ...base,
            content: event.content,
            replyToEventId: rootEventId,
            replyToCommentId
        };
    }

    /**
     * Stop subscription for an event
     */
    unsubscribe(eventId: string): void {
        const sub = activeSubscriptions.get(eventId);
        if (sub) {
            sub.stop();
            activeSubscriptions.delete(eventId);
        }
    }
}

export const commentService = new CommentService();
