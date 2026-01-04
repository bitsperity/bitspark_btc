/**
 * NDK Svelte Setup - Singleton NDKSvelte instance
 * 
 * Uses NDKSvelte's built-in connection pool with automatic reconnection.
 * Listens for relay connect/disconnect events for accurate state.
 */

import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import NDKCacheDexie from '@nostr-dev-kit/ndk-cache-dexie';
import { writable, get } from 'svelte/store';
import { DEFAULT_RELAYS } from './config';

// Connection state store - reactive
export type ConnectionState = 'connecting' | 'connected' | 'disconnected';
export const connectionState = writable<ConnectionState>('disconnected');

// Track connected relay count
let connectedRelayCount = 0;

// NDKSvelte instance with cache for offline support
export const ndk = new NDKSvelte({
    explicitRelayUrls: DEFAULT_RELAYS,
    cacheAdapter: new NDKCacheDexie({ dbName: 'bitspark' }),
    enableOutboxModel: false,
    autoConnectUserRelays: false,
    autoFetchUserMutelist: false
});

/**
 * Connect to relays and set up event listeners
 */
export async function connectNdk(): Promise<void> {
    connectionState.set('connecting');
    console.log('[NDK] Connecting to relays:', DEFAULT_RELAYS);

    // Listen for relay connect/disconnect events on each relay
    for (const relay of ndk.pool.relays.values()) {
        relay.on('connect', () => {
            connectedRelayCount++;
            console.log(`[NDK] ✓ Connected to ${relay.url} (${connectedRelayCount} total)`);
            connectionState.set('connected');
        });

        relay.on('disconnect', () => {
            connectedRelayCount = Math.max(0, connectedRelayCount - 1);
            console.log(`[NDK] ✗ Disconnected from ${relay.url} (${connectedRelayCount} remaining)`);
            if (connectedRelayCount === 0) {
                connectionState.set('disconnected');
            }
        });
    }

    // Also listen on the pool level
    ndk.pool.on('relay:connect', (relay: any) => {
        console.log(`[NDK] Pool: relay connected ${relay.url}`);
    });

    ndk.pool.on('relay:disconnect', (relay: any) => {
        console.log(`[NDK] Pool: relay disconnected ${relay.url}`);
    });

    try {
        await ndk.connect();
        console.log('[NDK] Connect initiated (waiting for relays...)');

        // Set a timeout - if no connections after 10s, log warning
        setTimeout(() => {
            if (connectedRelayCount === 0) {
                console.warn('[NDK] Warning: No relays connected after 10s');
                connectionState.set('disconnected');
            }
        }, 10000);
    } catch (error) {
        console.error('[NDK] Connection error:', error);
        connectionState.set('disconnected');
        throw error;
    }
}

/**
 * Force reconnect - triggers NDK's pool reconnection
 */
export async function reconnect(): Promise<void> {
    console.log('[NDK] Reconnect requested');
    connectionState.set('connecting');
    connectedRelayCount = 0;

    try {
        await ndk.connect();
    } catch (error) {
        console.error('[NDK] Reconnect failed:', error);
        connectionState.set('disconnected');
        throw error;
    }
}

/**
 * Create a new NDKEvent with proper type handling
 */
export function createEvent(): NDKEvent {
    return new NDKEvent(ndk as any);
}

// Browser event listeners for visibility changes
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && connectedRelayCount === 0) {
            reconnect().catch(console.error);
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
        connectionState.set('disconnected');
    });
}
