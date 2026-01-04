/**
 * Comment Service
 * 
 * Handles comments on any BitSpark event.
 * Uses Kind 1 notes with [s, bitspark] tag.
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk, createEvent } from '$lib/nostr';
import { APP_TAG } from '$lib/nostr/config';
import { writable, derived, type Readable } from 'svelte/store';
import type { Comment } from '$lib/types/social';
import { createTagAccessors, parseBaseEvent } from '$lib/utils';

const KIND_NOTE = 1;

// Cache: eventId -> comments
const commentsCache = writable<Map<string, Comment[]>>(new Map());

// Track active subscriptions
const activeSubscriptions = new Map<string, any>();

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
            ['e', eventId, '', replyToCommentId ? 'root' : 'reply'],
            APP_TAG
        ];

        // If replying to a comment, add that reference too
        if (replyToCommentId) {
            event.tags.push(['e', replyToCommentId, '', 'reply']);
        }

        await event.publish();

        // Update cache optimistically
        const comment = this.parseComment(event);
        commentsCache.update(cache => {
            const existing = cache.get(eventId) || [];
            cache.set(eventId, [...existing, comment]);
            return new Map(cache);
        });

        console.log('[Comments] Created comment on:', eventId);
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
     * Subscribe to comments for an event
     */
    subscribeComments(eventId: string): Readable<Comment[]> {
        // Start subscription if not active
        if (!activeSubscriptions.has(eventId)) {
            this.startCommentsSubscription(eventId);
        }

        return derived(commentsCache, $cache => {
            const comments = $cache.get(eventId) || [];
            // Sort by date, newest last
            return [...comments].sort((a, b) => {
                const aTime = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.getTime();
                const bTime = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.getTime();
                return aTime - bTime;
            });
        });
    }

    /**
     * Get comment count for an event
     */
    subscribeCommentCount(eventId: string): Readable<number> {
        if (!activeSubscriptions.has(eventId)) {
            this.startCommentsSubscription(eventId);
        }

        return derived(commentsCache, $cache => {
            return ($cache.get(eventId) || []).length;
        });
    }

    /**
     * Start subscription for comments on an event
     */
    private startCommentsSubscription(eventId: string): void {
        const filter: NDKFilter = {
            kinds: [KIND_NOTE],
            '#e': [eventId],
            '#s': ['bitspark']
        };

        const sub = ndk.subscribe(filter, { closeOnEose: false });

        sub.on('event', (event: NDKEvent) => {
            const comment = this.parseComment(event);

            commentsCache.update(cache => {
                const existing = cache.get(eventId) || [];
                // Avoid duplicates
                if (!existing.find(c => c.id === comment.id)) {
                    cache.set(eventId, [...existing, comment]);
                }
                return new Map(cache);
            });
        });

        activeSubscriptions.set(eventId, sub);
    }

    /**
     * Parse NDKEvent to Comment
     */
    private parseComment(event: NDKEvent): Comment {
        const { getTag } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        // Get the root event (what this is commenting on)
        const eTags = event.tags.filter(t => t[0] === 'e');
        const rootTag = eTags.find(t => t[3] === 'root' || t[3] === 'reply') || eTags[0];
        const replyTag = eTags.find(t => t[3] === 'reply' && t !== rootTag);

        return {
            ...base,
            content: event.content,
            replyToEventId: rootTag?.[1] || '',
            replyToCommentId: replyTag?.[1]
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
