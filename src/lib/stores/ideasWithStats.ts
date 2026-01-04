/**
 * Ideas with Stats Store
 * 
 * Combines Ideas with Job stats for enriched display.
 */

import { derived, writable, type Readable } from 'svelte/store';
import { ideaService } from '$lib/services/ideas';
import { jobService } from '$lib/services/jobs';
import type { Idea } from '$lib/types/idea';
import type { Job } from '$lib/types/job';

/**
 * Idea enriched with job statistics
 */
export interface IdeaWithStats extends Idea {
    openJobCount: number;
    totalJobCount: number;
    totalBounty: number;
    lastActivity: Date;
    isHot: boolean;
}

/**
 * Filter/sort options for ideas
 */
export interface IdeaFilterOptions {
    search: string;
    category: string | null;
    status: 'all' | 'active' | 'completed';
    sortBy: 'newest' | 'mostJobs' | 'highestBounty';
}

/**
 * Default filter options
 */
export const defaultFilters: IdeaFilterOptions = {
    search: '',
    category: null,
    status: 'all',
    sortBy: 'newest'
};

// Helper to get timestamp from createdAt
function getTimestamp(createdAt: Date | number): number {
    if (typeof createdAt === 'number') {
        return createdAt * 1000; // Unix timestamp to ms
    }
    return createdAt.getTime();
}

/**
 * Create the ideas with stats store
 */
export function createIdeasWithStatsStore() {
    // Filter state
    const filters = writable<IdeaFilterOptions>(defaultFilters);

    // Parsed data stores
    const ideas = writable<Idea[]>([]);
    const jobs = writable<Job[]>([]);

    // Loading state
    const isLoading = writable(true);

    // Track if started
    let isStarted = false;
    let ideasUnsubscribe: (() => void) | null = null;
    let jobsUnsubscribe: (() => void) | null = null;

    /**
     * Start subscriptions
     */
    function start() {
        if (isStarted) return;
        isStarted = true;
        isLoading.set(true);

        // Subscribe to ideas
        const ideasStore = ideaService.subscribeToIdeas();
        ideasUnsubscribe = ideasStore.subscribe((events: any[]) => {
            ideas.set(events.map((e: any) => ideaService.parseIdeaEvent(e)));
            isLoading.set(false);
        });

        // Subscribe to all jobs
        const jobsStore = jobService.subscribeToJobs();
        jobsUnsubscribe = jobsStore.subscribe((events: any[]) => {
            jobs.set(events.map((e: any) => jobService.parseJobEvent(e)));
        });
    }

    /**
     * Stop subscriptions
     */
    function stop() {
        if (ideasUnsubscribe) ideasUnsubscribe();
        if (jobsUnsubscribe) jobsUnsubscribe();
        isStarted = false;
    }

    /**
     * Enriched ideas with stats
     */
    const ideasWithStats: Readable<IdeaWithStats[]> = derived(
        [ideas, jobs, filters],
        ([$ideas, $jobs, $filters]) => {
            const now = Date.now();
            const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

            // Enrich each idea
            let enriched = $ideas.map(idea => {
                const ideaJobs = $jobs.filter(j => j.ideaId === idea.id);
                const openJobs = ideaJobs.filter(j => j.status === 'open');

                // Calculate total bounty from job amount tags
                const totalBounty = ideaJobs.reduce((sum, j) => {
                    const amountTag = j.event?.tags.find((t: string[]) => t[0] === 'amount');
                    return sum + (amountTag ? parseInt(amountTag[1]) || 0 : 0);
                }, 0);

                // Last activity
                const ideaTime = getTimestamp(idea.createdAt);
                const jobTimes = ideaJobs.map(j => getTimestamp(j.createdAt));
                const lastActivity = new Date(Math.max(ideaTime, ...jobTimes));

                // Hot = 3+ open jobs OR activity in last week
                const isHot = openJobs.length >= 3 || lastActivity.getTime() > oneWeekAgo;

                return {
                    ...idea,
                    openJobCount: openJobs.length,
                    totalJobCount: ideaJobs.length,
                    totalBounty,
                    lastActivity,
                    isHot
                };
            });

            // Apply filters
            if ($filters.search) {
                const searchLower = $filters.search.toLowerCase();
                enriched = enriched.filter(i =>
                    i.title.toLowerCase().includes(searchLower) ||
                    i.summary.toLowerCase().includes(searchLower)
                );
            }

            if ($filters.category) {
                enriched = enriched.filter(i => i.categories.includes($filters.category!));
            }

            // Sort
            switch ($filters.sortBy) {
                case 'newest':
                    enriched.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
                    break;
                case 'mostJobs':
                    enriched.sort((a, b) => b.openJobCount - a.openJobCount);
                    break;
                case 'highestBounty':
                    enriched.sort((a, b) => b.totalBounty - a.totalBounty);
                    break;
            }

            return enriched;
        }
    );

    return {
        subscribe: ideasWithStats.subscribe,
        filters,
        isLoading: { subscribe: isLoading.subscribe },
        start,
        stop,
        setFilter: (key: keyof IdeaFilterOptions, value: any) => {
            filters.update(f => ({ ...f, [key]: value }));
        },
        resetFilters: () => filters.set(defaultFilters)
    };
}

// Singleton instance
export const ideasWithStatsStore = createIdeasWithStatsStore();
