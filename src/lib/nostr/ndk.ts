/**
 * NDK Svelte Setup - Singleton NDKSvelte instance
 * 
 * Uses NDKSvelte (not plain NDK) for reactive Svelte store subscriptions.
 * Includes automatic reconnection for stale connections.
 * 
 * Usage:
 *   import { ndk } from '$lib/nostr';
 *   
 *   // Reactive subscription
 *   const events = ndk.storeSubscribe({ kinds: [0], authors: [pubkey] });
 *   
 *   // In template
 *   {#each $events as event}...{/each}
 */

import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import { DEFAULT_RELAYS } from './config';

// NDKSvelte instance - singleton with reactive store support
export const ndk = new NDKSvelte({
    explicitRelayUrls: DEFAULT_RELAYS,
    enableOutboxModel: true,
    autoConnectUserRelays: false,
    autoFetchUserMutelist: false
});

let isConnected = false;
let reconnectTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Connect to relays
 */
export async function connectNdk(): Promise<void> {
    try {
        await ndk.connect();
        isConnected = true;
        console.log('[NDK] Connected to relays:', DEFAULT_RELAYS);

        // Start health check
        startHealthCheck();
    } catch (error) {
        console.error('[NDK] Connection error:', error);
        throw error;
    }
}

/**
 * Check if connection is healthy and reconnect if needed
 */
async function checkConnectionHealth(): Promise<void> {
    // Check if any relay is connected
    const connectedRelays = Array.from(ndk.pool.relays.values()).filter(
        r => r.connectivity.status === 1 // CONNECTING or CONNECTED
    );

    if (connectedRelays.length === 0 && isConnected) {
        console.log('[NDK] Connection lost, reconnecting...');
        try {
            await ndk.connect();
            console.log('[NDK] Reconnected successfully');
        } catch (error) {
            console.error('[NDK] Reconnection failed:', error);
        }
    }
}

/**
 * Start periodic health check (every 30 seconds)
 */
function startHealthCheck(): void {
    if (reconnectTimer) {
        clearInterval(reconnectTimer);
    }

    reconnectTimer = setInterval(() => {
        checkConnectionHealth();
    }, 30000); // Check every 30 seconds
}

/**
 * Force reconnect (call manually if needed)
 */
export async function reconnect(): Promise<void> {
    console.log('[NDK] Manual reconnect requested');
    await ndk.connect();
    isConnected = true;
    console.log('[NDK] Reconnected');
}
