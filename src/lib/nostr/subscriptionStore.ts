/**
 * Subscription Store - Enhanced subscription with timeout and state management
 * 
 * Wraps NDK's storeSubscribe with:
 * - Timeout detection (shows error after N seconds of no data)
 * - State tracking (loading/loaded/timeout/error)
 * - Automatic cleanup
 */

import { writable, derived, get, type Readable, type Writable } from 'svelte/store';
import { ndk } from './ndk';
import type { NDKFilter, NDKEvent, NDKSubscription } from '@nostr-dev-kit/ndk';

export type SubscriptionState = 'loading' | 'loaded' | 'timeout' | 'error';

export interface SubscriptionOptions {
    /** Timeout in ms before showing timeout state (default: 10000) */
    timeout?: number;
    /** Callback when timeout occurs */
    onTimeout?: () => void;
    /** Close subscription after receiving first batch of events */
    closeOnEose?: boolean;
}

export interface ManagedSubscription<T> {
    /** The reactive store containing events */
    store: Readable<T[]>;
    /** Current state of the subscription */
    state: Readable<SubscriptionState>;
    /** Number of events received */
    count: Readable<number>;
    /** Retry the subscription */
    retry: () => void;
    /** Cleanup subscription */
    unsubscribe: () => void;
}

/**
 * Create a managed subscription with timeout handling
 */
export function createSubscription<T = NDKEvent>(
    filter: NDKFilter | NDKFilter[],
    options: SubscriptionOptions = {},
    parser?: (event: NDKEvent) => T
): ManagedSubscription<T> {
    const { timeout = 10000, onTimeout, closeOnEose = false } = options;

    const state = writable<SubscriptionState>('loading');
    const events = writable<T[]>([]);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let ndkStore: ReturnType<typeof ndk.storeSubscribe> | null = null;
    let storeUnsubscribe: (() => void) | null = null;

    function startSubscription() {
        // Reset state
        state.set('loading');
        events.set([]);

        // Clear any existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set timeout
        timeoutId = setTimeout(() => {
            if (get(events).length === 0) {
                state.set('timeout');
                onTimeout?.();
            }
        }, timeout);

        // Create NDK subscription
        ndkStore = ndk.storeSubscribe(filter, { closeOnEose });

        // Subscribe to updates
        storeUnsubscribe = ndkStore.subscribe((ndkEvents: NDKEvent[]) => {
            if (ndkEvents.length > 0) {
                // Clear timeout on first data
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // Parse events if parser provided
                const parsed = parser
                    ? ndkEvents.map(e => parser(e))
                    : ndkEvents as unknown as T[];

                events.set(parsed);
                state.set('loaded');
            }
        });
    }

    function retry() {
        cleanup();
        startSubscription();
    }

    function cleanup() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (storeUnsubscribe) {
            storeUnsubscribe();
            storeUnsubscribe = null;
        }
        if (ndkStore) {
            ndkStore.unsubscribe();
            ndkStore = null;
        }
    }

    // Start immediately
    startSubscription();

    return {
        store: { subscribe: events.subscribe },
        state: { subscribe: state.subscribe },
        count: derived(events, $e => $e.length),
        retry,
        unsubscribe: cleanup
    };
}

/**
 * Simple wrapper that returns loading/data/timeout states
 * For use in components with straightforward needs
 */
export function useSubscription<T = NDKEvent>(
    filter: NDKFilter | NDKFilter[],
    parser?: (event: NDKEvent) => T
) {
    return createSubscription(filter, { timeout: 8000 }, parser);
}
