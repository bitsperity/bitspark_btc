/**
 * Subscription Store - Enhanced subscription with auto-retry
 * 
 * Features:
 * - Auto-retry on timeout (3 attempts with backoff)
 * - Auto-reconnect before retry
 * - State tracking: loading/loaded/retrying/failed
 * - Manual retry only as last resort
 */

import { writable, derived, get, type Readable } from 'svelte/store';
import { ndk, reconnect } from './ndk';
import type { NDKFilter, NDKEvent } from '@nostr-dev-kit/ndk';

export type SubscriptionState = 'loading' | 'loaded' | 'retrying' | 'failed';

export interface SubscriptionOptions {
    /** Timeout in ms before retry (default: 8000) */
    timeout?: number;
    /** Max auto-retry attempts (default: 3) */
    maxRetries?: number;
    /** Close subscription after receiving first batch */
    closeOnEose?: boolean;
}

export interface ManagedSubscription<T> {
    store: Readable<T[]>;
    state: Readable<SubscriptionState>;
    retryCount: Readable<number>;
    retry: () => Promise<void>;
    unsubscribe: () => void;
}

/**
 * Create a managed subscription with auto-retry
 */
export function createSubscription<T = NDKEvent>(
    filter: NDKFilter | NDKFilter[],
    options: SubscriptionOptions = {},
    parser?: (event: NDKEvent) => T
): ManagedSubscription<T> {
    const { timeout = 4000, maxRetries = 3, closeOnEose = false } = options;

    const state = writable<SubscriptionState>('loading');
    const events = writable<T[]>([]);
    const retryCount = writable(0);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let ndkStore: ReturnType<typeof ndk.storeSubscribe> | null = null;
    let storeUnsubscribe: (() => void) | null = null;
    let currentRetries = 0;

    async function startSubscription() {
        state.set(currentRetries > 0 ? 'retrying' : 'loading');
        events.set([]);

        if (timeoutId) clearTimeout(timeoutId);

        // Set timeout with auto-retry
        timeoutId = setTimeout(async () => {
            if (get(events).length === 0) {
                currentRetries++;
                retryCount.set(currentRetries);

                if (currentRetries < maxRetries) {
                    console.log(`[Subscription] Auto-retry ${currentRetries}/${maxRetries}`);
                    cleanup();

                    // Backoff: 1s, 2s, 4s
                    await new Promise(r => setTimeout(r, Math.pow(2, currentRetries - 1) * 1000));

                    try {
                        await reconnect();
                    } catch (e) {
                        console.warn('[Subscription] Reconnect failed');
                    }
                    startSubscription();
                } else {
                    console.log('[Subscription] All retries exhausted');
                    state.set('failed');
                }
            }
        }, timeout);

        // Create subscription
        ndkStore = ndk.storeSubscribe(filter, { closeOnEose });

        storeUnsubscribe = ndkStore.subscribe((ndkEvents: NDKEvent[]) => {
            if (ndkEvents.length > 0) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                const parsed = parser
                    ? ndkEvents.map(e => parser(e))
                    : ndkEvents as unknown as T[];

                events.set(parsed);
                state.set('loaded');
                currentRetries = 0;
                retryCount.set(0);
            }
        });
    }

    async function retry() {
        cleanup();
        currentRetries = 0;
        retryCount.set(0);
        try {
            await reconnect();
        } catch (e) {
            console.warn('[Subscription] Manual reconnect failed');
        }
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
        retryCount: { subscribe: retryCount.subscribe },
        retry,
        unsubscribe: cleanup
    };
}

export function useSubscription<T = NDKEvent>(
    filter: NDKFilter | NDKFilter[],
    parser?: (event: NDKEvent) => T
) {
    return createSubscription(filter, { timeout: 8000 }, parser);
}
