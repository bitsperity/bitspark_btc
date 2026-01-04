/**
 * Social Types
 * 
 * Types for likes, comments, follows, and feed.
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';
import type { NostrEntity } from './nostr';

/**
 * Comment on any BitSpark event
 */
export interface Comment extends NostrEntity {
    content: string;
    replyToEventId: string;     // Event being commented on
    replyToCommentId?: string;  // Parent comment (for threads)
}

/**
 * Feed item - can be Idea, Job, or Comment
 */
export interface FeedItem {
    type: 'idea' | 'job' | 'comment';
    event: NDKEvent;
    createdAt: number;
    author: string;
}

/**
 * Like/Reaction on an event
 */
export interface Reaction {
    id: string;
    eventId: string;    // Event being liked
    pubkey: string;     // Who liked it
    createdAt: number;
}

/**
 * Follow relationship
 */
export interface FollowList {
    pubkey: string;
    following: string[];  // List of pubkeys being followed
}
