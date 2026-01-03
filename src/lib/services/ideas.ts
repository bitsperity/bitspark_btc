/**
 * IdeaService - Manages Idea events (Kind 30100)
 * 
 * Handles creation, fetching, and subscriptions for Ideas.
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS, APP_TAG } from '$lib/nostr/config';
import type { Idea, CreateIdeaInput } from '$lib/types/idea';
import { createTagAccessors, parseBaseEvent } from '$lib/utils';

class IdeaService {
    /**
     * Subscribe to all BitSpark ideas (reactive)
     */
    subscribeToIdeas(category?: string) {
        const filter: NDKFilter = {
            kinds: [NOSTR_KINDS.IDEA as number],
            '#s': ['bitspark']
        };

        if (category) {
            filter['#c'] = [category];
        }

        return ndk.storeSubscribe(filter);
    }

    /**
     * Subscribe to a user's ideas
     */
    subscribeToUserIdeas(pubkey: string) {
        return ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.IDEA as number],
            authors: [pubkey],
            '#s': ['bitspark']
        } as NDKFilter);
    }

    /**
     * Fetch a single idea by event ID
     */
    async getIdea(eventId: string): Promise<Idea | null> {
        const event = await ndk.fetchEvent(eventId);
        if (!event) return null;
        return this.parseIdeaEvent(event as unknown as NDKEvent);
    }

    /**
     * Create a new idea
     */
    async createIdea(input: CreateIdeaInput): Promise<NDKEvent> {
        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.IDEA;
        event.content = input.content;

        // Generate unique d-tag using timestamp + random
        const dTag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        event.tags = [
            ['d', dTag],
            ['title', input.title],
            ['summary', input.summary],
            APP_TAG  // Using centralized constant
        ];

        // Optional tags
        if (input.bannerUrl) {
            event.tags.push(['image', input.bannerUrl]);
        }
        if (input.githubRepo) {
            event.tags.push(['github', input.githubRepo]);
        }
        if (input.lnAddress) {
            event.tags.push(['lnaddress', input.lnAddress]);
        }

        // Categories
        for (const cat of input.categories) {
            event.tags.push(['c', cat]);
        }

        await event.publish();

        return event;
    }

    /**
     * Parse NDKEvent to Idea interface
     * Uses shared EventParser utility
     */
    parseIdeaEvent(event: NDKEvent): Idea {
        const { getTag, getTags } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        return {
            ...base,
            title: getTag('title') ?? 'Untitled',
            summary: getTag('summary') ?? '',
            content: event.content,
            bannerUrl: getTag('image'),
            githubRepo: getTag('github'),
            lnAddress: getTag('lnaddress'),
            categories: getTags('c'),
            event
        };
    }
}

export const ideaService = new IdeaService();
