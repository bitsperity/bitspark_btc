/**
 * JobService - Manages Job events (Kind 30101)
 * 
 * Jobs are parameterized replaceable - status updates replace previous version.
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS, APP_TAG } from '$lib/nostr/config';
import type { Job, CreateJobInput, JobStatus } from '$lib/types/job';
import { createTagAccessors, parseBaseEvent } from '$lib/utils';

class JobService {
    /**
     * Subscribe to jobs (reactive)
     * Using limit for scalability. Status filtering via #status tag works on most public relays.
     */
    subscribeToJobs(language?: string) {
        const filter: NDKFilter = {
            kinds: [NOSTR_KINDS.JOB as number],
            '#s': ['bitspark'],
            limit: 50  // Pagination would be needed for more
        };

        if (language) {
            filter['#l'] = [language];
        }

        return ndk.storeSubscribe(filter);
    }

    /**
     * Subscribe to jobs for a specific idea
     */
    subscribeToIdeaJobs(ideaId: string) {
        return ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.JOB as number],
            '#e': [ideaId],
            '#s': ['bitspark']
        } as NDKFilter);
    }

    /**
     * Subscribe to a user's jobs (created by them)
     */
    subscribeToUserJobs(pubkey: string) {
        return ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.JOB as number],
            authors: [pubkey],
            '#s': ['bitspark']
        } as NDKFilter);
    }

    /**
     * Fetch a single job by event ID
     */
    async getJob(eventId: string): Promise<Job | null> {
        const event = await ndk.fetchEvent(eventId);
        if (!event) return null;
        return this.parseJobEvent(event as unknown as NDKEvent);
    }

    /**
     * Create a new job for an idea
     */
    async createJob(input: CreateJobInput): Promise<NDKEvent> {
        // Assert: Only Idea owner can create Jobs
        const idea = await ndk.fetchEvent(input.ideaId);
        if (!idea) {
            throw new Error('Idea not found');
        }

        const user = ndk.activeUser;
        if (!user || idea.pubkey !== user.pubkey) {
            throw new Error('Only the Idea owner can create Jobs for this Idea');
        }

        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.JOB;
        event.content = input.content;

        // Generate unique d-tag
        const dTag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        event.tags = [
            ['d', dTag],
            ['title', input.title],
            ['requirements', input.requirements],
            ['status', 'open'],
            ['e', input.ideaId],  // Reference to parent idea
            APP_TAG
        ];

        // Optional tags
        if (input.bannerUrl) {
            event.tags.push(['image', input.bannerUrl]);
        }

        // Languages
        for (const lang of input.languages) {
            event.tags.push(['l', lang]);
        }

        // Categories
        for (const cat of input.categories) {
            event.tags.push(['c', cat]);
        }

        await event.publish();
        console.log('[JobService] Created job:', event.id);

        return event;
    }

    /**
     * Update job status (publishes new replaceable event)
     */
    async updateJobStatus(job: Job, newStatus: JobStatus): Promise<NDKEvent> {
        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.JOB;
        event.content = job.content;

        // Use same d-tag to replace
        const dTag = job.event.tags.find(t => t[0] === 'd')?.[1];
        if (!dTag) throw new Error('Job has no d-tag');

        // Copy all tags but update status
        event.tags = job.event.tags.map(t =>
            t[0] === 'status' ? ['status', newStatus] : t
        );

        await event.publish();
        console.log('[JobService] Updated job status:', job.id, '→', newStatus);

        return event;
    }

    /**
     * Parse NDKEvent to Job interface
     */
    parseJobEvent(event: NDKEvent): Job {
        const { getTag, getTags } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        return {
            ...base,
            title: getTag('title') ?? 'Untitled Job',
            requirements: getTag('requirements') ?? '',
            content: event.content,
            bannerUrl: getTag('image'),
            languages: getTags('l'),
            categories: getTags('c'),
            ideaId: getTags('e')[0] ?? '',  // First e-tag is idea
            previousJobId: getTags('e')[1],  // Second e-tag is prev job (if exists)
            status: (getTag('status') as JobStatus) ?? 'open',
            event
        };
    }
}

export const jobService = new JobService();
