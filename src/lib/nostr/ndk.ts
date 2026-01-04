/**
 * NDK Svelte Setup - Singleton NDKSvelte instance
 * 
 * Uses NDKSvelte's built-in connection pool with automatic reconnection.
 * Tracks relay connections accurately using a Set.
 */

import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import { NDKEvent, type NDKRelay } from '@nostr-dev-kit/ndk';
import NDKCacheDexie from '@nostr-dev-kit/ndk-cache-dexie';
import { writable, derived } from 'svelte/store';
import { DEFAULT_RELAYS } from './config';

// Connection state types
export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

// Track connected relays accurately using a Set
const connectedRelays = writable<Set<string>>(new Set());

// Derived connection state
export const connectionState = derived(connectedRelays, ($relays) => {
    if ($relays.size > 0) return 'connected' as ConnectionState;
    return 'disconnected' as ConnectionState;
});

// Export connected count for UI
export const connectedRelayCount = derived(connectedRelays, ($relays) => $relays.size);

// NDKSvelte instance with cache for offline support
export const ndk = new NDKSvelte({
    explicitRelayUrls: DEFAULT_RELAYS,
    cacheAdapter: new NDKCacheDexie({ dbName: 'bitspark' }),
    enableOutboxModel: false,
    autoConnectUserRelays: false,
    autoFetchUserMutelist: false
});

// Flag to prevent duplicate event listeners
let listenersSetup = false;

/**
 * Set up relay event listeners (only once)
 */
function setupRelayListeners(): void {
    if (listenersSetup) return;
    listenersSetup = true;

    // Listen on pool level for all relay events
    ndk.pool.on('relay:connect', (relay: any) => {
        connectedRelays.update(set => {
            set.add(relay.url);
            console.log(`[NDK] ✓ Connected to ${relay.url} (${set.size} total)`);
            return new Set(set);
        });
    });

    ndk.pool.on('relay:disconnect', (relay: any) => {
        connectedRelays.update(set => {
            set.delete(relay.url);
            console.log(`[NDK] ✗ Disconnected from ${relay.url} (${set.size} remaining)`);
            return new Set(set);
        });
    });
}

/**
 * Connect to relays
 */
export async function connectNdk(): Promise<void> {
    console.log('[NDK] Connecting to relays:', DEFAULT_RELAYS);

    // Set up listeners before connecting
    setupRelayListeners();

    try {
        await ndk.connect();
        console.log('[NDK] Connect initiated');

        // Warn if no connections after 10s
        setTimeout(() => {
            let count = 0;
            connectedRelays.subscribe(set => count = set.size)();
            if (count === 0) {
                console.warn('[NDK] Warning: No relays connected after 10s');
            }
        }, 10000);
    } catch (error) {
        console.error('[NDK] Connection error:', error);
        throw error;
    }
}

/**
 * Force reconnect
 */
export async function reconnect(): Promise<void> {
    console.log('[NDK] Reconnect requested');
    try {
        await ndk.connect();
    } catch (error) {
        console.error('[NDK] Reconnect failed:', error);
        throw error;
    }
}

/**
 * Create a new NDKEvent
 */
export function createEvent(): NDKEvent {
    return new NDKEvent(ndk as any);
}

// Browser event listeners
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            let count = 0;
            connectedRelays.subscribe(set => count = set.size)();
            if (count === 0) {
                reconnect().catch(console.error);
            }
        }
    });
}

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[NDK] Network online');
        reconnect().catch(console.error);
    });

    window.addEventListener('offline', () => {
        console.log('[NDK] Network offline');
        connectedRelays.set(new Set());
    });
}
