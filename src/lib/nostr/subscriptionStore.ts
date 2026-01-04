/**
 * Subscription Store - Enhanced subscription with EOSE detection
 * 
 * Features:
 * - Uses EOSE (End Of Stored Events) to detect empty vs failed
 * - Fast timeout (3s) with aggressive retry
 * - Doesn't retry unnecessarily when relay confirms no results
 */

import { writable, derived, get, type Readable } from 'svelte/store';
import { ndk, reconnect, connectionState } from './ndk';
import type { NDKFilter, NDKEvent, NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';

export type SubscriptionState = 'loading' | 'loaded' | 'empty' | 'retrying' | 'failed';

export interface SubscriptionOptions {
    timeout?: number;
    maxRetries?: number;
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
 * Create a managed subscription with EOSE detection
 */
export function createSubscription<T = NDKEvent>(
    filter: NDKFilter | NDKFilter[],
    options: SubscriptionOptions = {},
    parser?: (event: NDKEvent) => T
): ManagedSubscription<T> {
    const { timeout = 3000, maxRetries = 2, closeOnEose = false } = options;

    const state = writable<SubscriptionState>('loading');
    const events = writable<T[]>([]);
    const retryCount = writable(0);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let ndkStore: ReturnType<typeof ndk.storeSubscribe> | null = null;
    let storeUnsubscribe: (() => void) | null = null;
    let currentRetries = 0;
    let receivedEose = false;

    async function startSubscription() {
        state.set(currentRetries > 0 ? 'retrying' : 'loading');
        events.set([]);
        receivedEose = false;

        if (timeoutId) clearTimeout(timeoutId);

        // Timeout only triggers if NO EOSE received
        timeoutId = setTimeout(async () => {
            // If we got EOSE, relay confirmed results (even if empty)
            if (receivedEose) return;

            const eventCount = get(events).length;
            if (eventCount === 0) {
                currentRetries++;
                retryCount.set(currentRetries);

                if (currentRetries < maxRetries) {
                    console.log(`[Subscription] Timeout, retry ${currentRetries}/${maxRetries}`);
                    cleanup();

                    // Quick backoff: 0.5s, 1s
                    await new Promise(r => setTimeout(r, 500 * currentRetries));

                    // Only reconnect if actually disconnected
                    if (get(connectionState) !== 'connected') {
                        try {
                            await reconnect();
                        } catch (e) {
                            console.warn('[Subscription] Reconnect failed');
                        }
                    }
                    startSubscription();
                } else {
                    console.log('[Subscription] All retries exhausted');
                    state.set('failed');
                }
            }
        }, timeout);

        // Create subscription with EOSE detection
        const subOpts: NDKSubscriptionOptions = {
            closeOnEose,
            groupable: false  // Don't group to ensure we get our own EOSE
        };

        ndkStore = ndk.storeSubscribe(filter, subOpts);

        // Listen for EOSE on the underlying subscription
        if (ndkStore.subscription) {
            ndkStore.subscription.on('eose', () => {
                receivedEose = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                // If EOSE and no events = empty (not failed)
                if (get(events).length === 0) {
                    state.set('empty');
                }
            });
        }

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
        if (get(connectionState) !== 'connected') {
            try {
                await reconnect();
            } catch (e) {
                console.warn('[Subscription] Manual reconnect failed');
            }
        }
        startSubscription();
    }

    function cleanup() {
        receivedEose = false;
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
    return createSubscription(filter, { timeout: 3000, maxRetries: 2 }, parser);
}
