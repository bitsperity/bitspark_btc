/**
 * Nostr Event Parser Utility
 * 
 * Shared utilities for parsing NDK events.
 * Used by all entity services (Idea, Job, Offer, etc.)
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';

/**
 * Create tag accessor helpers for an event
 */
export function createTagAccessors(event: NDKEvent) {
    return {
        /**
         * Get first matching tag value
         */
        getTag: (name: string): string | undefined =>
            event.tags.find(t => t[0] === name)?.[1],

        /**
         * Get all matching tag values
         */
        getTags: (name: string): string[] =>
            event.tags.filter(t => t[0] === name).map(t => t[1]),

        /**
         * Check if tag exists
         */
        hasTag: (name: string): boolean =>
            event.tags.some(t => t[0] === name),

        /**
         * Get tag with default value
         */
        getTagOrDefault: (name: string, defaultValue: string): string =>
            event.tags.find(t => t[0] === name)?.[1] ?? defaultValue
    };
}

/**
 * Common fields extracted from any BitSpark event
 */
export interface ParsedEventBase {
    id: string;
    pubkey: string;
    createdAt: number;
}

/**
 * Extract common fields from an NDK event
 */
export function parseBaseEvent(event: NDKEvent): ParsedEventBase {
    return {
        id: event.id,
        pubkey: event.pubkey,
        createdAt: event.created_at ?? 0
    };
}
