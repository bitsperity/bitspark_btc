/**
 * Nostr Base Types
 * 
 * Shared interfaces for all Nostr entities (Idea, Job, Offer, etc.)
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';

/**
 * Base interface for all BitSpark entities
 */
export interface NostrEntity {
    id: string;
    pubkey: string;
    createdAt: number;
    event: NDKEvent;
}

/**
 * Author info (can be attached to any entity)
 */
export interface EntityAuthor {
    pubkey: string;
    npub?: string;
    name?: string;
    picture?: string;
}

/**
 * Status for entities that have lifecycle
 */
export type EntityStatus = 'active' | 'completed' | 'archived' | 'cancelled';
