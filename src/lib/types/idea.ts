/**
 * Idea Types
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';

/**
 * Parsed Idea from NDK Event
 */
export interface Idea {
    id: string;
    pubkey: string;
    title: string;
    summary: string;
    content: string;  // Markdown
    bannerUrl?: string;
    githubRepo?: string;
    lnAddress?: string;
    categories: string[];
    createdAt: number;
    event: NDKEvent;  // Original event for actions
}

/**
 * Input for creating a new idea
 */
export interface CreateIdeaInput {
    title: string;
    summary: string;
    content: string;
    bannerUrl?: string;
    githubRepo?: string;
    lnAddress?: string;
    categories: string[];
}

/**
 * Available categories
 */
export const IDEA_CATEGORIES = [
    'defi',
    'gaming',
    'social',
    'tools',
    'infrastructure',
    'other'
] as const;

export type IdeaCategory = typeof IDEA_CATEGORIES[number];
