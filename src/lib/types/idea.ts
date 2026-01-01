/**
 * Idea Types
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';
import type { NostrEntity } from './nostr';

/**
 * Parsed Idea from NDK Event
 */
export interface Idea extends NostrEntity {
    title: string;
    summary: string;
    content: string;  // Markdown
    bannerUrl?: string;
    githubRepo?: string;
    lnAddress?: string;
    categories: string[];
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

/**
 * Category display labels with emojis
 */
export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
    defi: '💰 DeFi',
    gaming: '🎮 Gaming',
    social: '💬 Social',
    tools: '🔧 Tools',
    infrastructure: '🏗️ Infrastructure',
    other: '📦 Other'
};
