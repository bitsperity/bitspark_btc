/**
 * Activity Feed Store
 * 
 * Unified subscription for activity from followed users.
 * - Time-windowed (7 days)
 * - Limited (100 events initial)
 * - Live updates via subscription
 * - Supports load more
 */

import { writable, derived, get, type Readable } from 'svelte/store';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS } from '$lib/nostr/config';
import { socialService } from '$lib/services';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

// Constants
const INITIAL_LIMIT = 50;
const LOAD_MORE_LIMIT = 30;
const TIME_WINDOW_DAYS = 7;
const MAX_ACTIVITIES = 200;

// Activity types
export type ActivityType = 'idea' | 'job' | 'comment' | 'like' | 'unknown';

export interface Activity {
    event: NDKEvent;
    type: ActivityType;
    createdAt: number;
}

// Store state
const activities = writable<Activity[]>([]);
const isLoading = writable(false);
const hasMore = writable(true);
let oldestTimestamp: number | null = null;
let liveSubscription: any = null;
let followingUnsubscribe: (() => void) | null = null;

/**
 * Get activity type from event kind
 */
function getActivityType(kind: number): ActivityType {
    switch (kind) {
        case NOSTR_KINDS.IDEA: return 'idea';
        case NOSTR_KINDS.JOB: return 'job';
        case 1: return 'comment';
        case 7: return 'like';
        default: return 'unknown';
    }
}

/**
 * Parse event to activity
 */
function parseActivity(event: NDKEvent): Activity {
    return {
        event,
        type: getActivityType(event.kind ?? 0),
        createdAt: event.created_at ?? 0
    };
}

/**
 * Add activity to store (with dedup and limit)
 */
function addActivity(activity: Activity): void {
    activities.update(existing => {
        // Check if already exists
        if (existing.find(a => a.event.id === activity.event.id)) {
            return existing;
        }

        // Add and sort
        const updated = [activity, ...existing];
        updated.sort((a, b) => b.createdAt - a.createdAt);

        // Limit max size
        if (updated.length > MAX_ACTIVITIES) {
            return updated.slice(0, MAX_ACTIVITIES);
        }

        return updated;
    });
}

/**
 * Start live subscription and load initial data
 */
export function startActivityFeed(): void {
    console.log('[ActivityFeed] Starting...');

    // Watch for following list changes
    if (followingUnsubscribe) {
        followingUnsubscribe();
    }

    const followingStore = socialService.subscribeFollowing();
    followingUnsubscribe = followingStore.subscribe(following => {
        console.log('[ActivityFeed] Following list updated:', following.length);

        if (following.length > 0) {
            loadActivities(following);
            startLiveSubscription(following);
        } else {
            activities.set([]);
            stopLiveSubscription();
        }
    });
}

/**
 * Stop the feed
 */
export function stopActivityFeed(): void {
    if (followingUnsubscribe) {
        followingUnsubscribe();
        followingUnsubscribe = null;
    }
    stopLiveSubscription();
}

/**
 * Load initial activities
 */
async function loadActivities(following: string[]): Promise<void> {
    if (get(isLoading)) return;

    isLoading.set(true);

    const since = Math.floor(Date.now() / 1000) - (TIME_WINDOW_DAYS * 24 * 60 * 60);

    const filter: NDKFilter = {
        kinds: [1, 7, NOSTR_KINDS.IDEA as number, NOSTR_KINDS.JOB as number],
        authors: following,
        since,
        limit: INITIAL_LIMIT
    };

    try {
        const events = await ndk.fetchEvents(filter);
        const parsed = Array.from(events)
            .map(parseActivity)
            .filter(a => a.type !== 'unknown')
            .sort((a, b) => b.createdAt - a.createdAt);

        activities.set(parsed);

        if (parsed.length > 0) {
            oldestTimestamp = parsed[parsed.length - 1].createdAt;
        }

        hasMore.set(parsed.length >= INITIAL_LIMIT);

        console.log('[ActivityFeed] Loaded', parsed.length, 'activities');
    } catch (error) {
        console.error('[ActivityFeed] Failed to load:', error);
    } finally {
        isLoading.set(false);
    }
}

/**
 * Start live subscription for new events
 */
function startLiveSubscription(following: string[]): void {
    stopLiveSubscription();

    const filter: NDKFilter = {
        kinds: [1, 7, NOSTR_KINDS.IDEA as number, NOSTR_KINDS.JOB as number],
        authors: following,
        since: Math.floor(Date.now() / 1000) // Only new events from now
    };

    console.log('[ActivityFeed] Starting live subscription...');

    liveSubscription = ndk.subscribe(filter, { closeOnEose: false });

    liveSubscription.on('event', (event: NDKEvent) => {
        const activity = parseActivity(event);
        if (activity.type !== 'unknown') {
            console.log('[ActivityFeed] New activity:', activity.type);
            addActivity(activity);
        }
    });
}

/**
 * Stop live subscription
 */
function stopLiveSubscription(): void {
    if (liveSubscription) {
        liveSubscription.stop();
        liveSubscription = null;
    }
}

/**
 * Load more activities (pagination)
 */
export async function loadMore(): Promise<void> {
    if (!oldestTimestamp || get(isLoading)) return;

    const following = get(socialService.subscribeFollowing());
    if (following.length === 0) return;

    isLoading.set(true);

    const filter: NDKFilter = {
        kinds: [1, 7, NOSTR_KINDS.IDEA as number, NOSTR_KINDS.JOB as number],
        authors: following,
        until: oldestTimestamp,
        limit: LOAD_MORE_LIMIT
    };

    try {
        const events = await ndk.fetchEvents(filter);
        const parsed = Array.from(events)
            .map(parseActivity)
            .filter(a => a.type !== 'unknown')
            .sort((a, b) => b.createdAt - a.createdAt);

        activities.update(existing => {
            const combined = [...existing, ...parsed];
            const unique = Array.from(new Map(combined.map(a => [a.event.id, a])).values());
            return unique.sort((a, b) => b.createdAt - a.createdAt);
        });

        if (parsed.length > 0) {
            oldestTimestamp = parsed[parsed.length - 1].createdAt;
        }

        hasMore.set(parsed.length >= LOAD_MORE_LIMIT);

        console.log('[ActivityFeed] Loaded', parsed.length, 'more activities');
    } catch (error) {
        console.error('[ActivityFeed] Failed to load more:', error);
    } finally {
        isLoading.set(false);
    }
}

/**
 * Reset the store
 */
export function reset(): void {
    activities.set([]);
    isLoading.set(false);
    hasMore.set(true);
    oldestTimestamp = null;
    stopActivityFeed();
}

// Filtered stores
export const allActivities: Readable<Activity[]> = activities;

export const ideaActivities: Readable<Activity[]> = derived(activities, $a =>
    $a.filter(a => a.type === 'idea')
);

export const jobActivities: Readable<Activity[]> = derived(activities, $a =>
    $a.filter(a => a.type === 'job')
);

export const commentActivities: Readable<Activity[]> = derived(activities, $a =>
    $a.filter(a => a.type === 'comment')
);

export const likeActivities: Readable<Activity[]> = derived(activities, $a =>
    $a.filter(a => a.type === 'like')
);

export const activityFeedLoading: Readable<boolean> = isLoading;
export const activityFeedHasMore: Readable<boolean> = hasMore;
