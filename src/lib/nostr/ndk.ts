/**
 * NDK Svelte Setup - Singleton NDKSvelte instance
 * 
 * Uses NDKSvelte's built-in connection pool with automatic reconnection.
 * Relies on multiple relays for redundancy.
 */

import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { writable, get } from 'svelte/store';
import { DEFAULT_RELAYS } from './config';

// Connection state store - reactive
export type ConnectionState = 'connecting' | 'connected' | 'disconnected';
export const connectionState = writable<ConnectionState>('disconnected');

// NDKSvelte instance - singleton with reactive store support
export const ndk = new NDKSvelte({
    explicitRelayUrls: DEFAULT_RELAYS,
    enableOutboxModel: false,  // Simplified for stability
    autoConnectUserRelays: false,
    autoFetchUserMutelist: false
});

/**
 * Connect to relays - NDK handles reconnection automatically
 */
export async function connectNdk(): Promise<void> {
    connectionState.set('connecting');

    try {
        await ndk.connect();

        // Wait a moment for WebSockets to establish
        await new Promise(r => setTimeout(r, 1000));

        logRelayStatus();

        // Check again after 3s (connections may establish later)
        setTimeout(logRelayStatus, 3000);

        // Monitor connection state via relay pool
        monitorRelayConnections();
    } catch (error) {
        console.error('[NDK] Connection error:', error);
        connectionState.set('disconnected');
        throw error;
    }
}

/**
 * Log which relays are connected
 */
function logRelayStatus(): void {
    const relays = Array.from(ndk.pool.relays.entries());
    const connected = relays.filter(([_, r]) => r.connectivity.status === 1);
    const failed = relays.filter(([_, r]) => r.connectivity.status !== 1);

    console.log(`[NDK] Relay status: ${connected.length}/${relays.length} connected`);
    connected.forEach(([url]) => console.log(`  ✓ ${url}`));
    if (failed.length > 0) {
        failed.forEach(([url]) => console.log(`  ✗ ${url}`));
    }

    connectionState.set(connected.length > 0 ? 'connected' : 'disconnected');
}

/**
 * Monitor relay connections and update state
 */
function monitorRelayConnections(): void {
    // Check connection state periodically
    setInterval(() => {
        const connectedCount = Array.from(ndk.pool.relays.values())
            .filter(r => r.connectivity.status === 1).length;

        const currentState = get(connectionState);

        if (connectedCount === 0 && currentState === 'connected') {
            connectionState.set('disconnected');
            console.log('[NDK] All relays disconnected');
        } else if (connectedCount > 0 && currentState !== 'connected') {
            connectionState.set('connected');
            console.log('[NDK] Relay connected');
        }
    }, 5000);  // Check every 5 seconds (UI feedback only)
}

/**
 * Force reconnect - triggers NDK's pool reconnection
 */
export async function reconnect(): Promise<void> {
    console.log('[NDK] Reconnect requested');
    connectionState.set('connecting');

    try {
        await ndk.connect();
        connectionState.set('connected');
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
        if (document.visibilityState === 'visible') {
            // Just update UI state, NDK handles reconnection
            const connectedCount = Array.from(ndk.pool.relays.values())
                .filter(r => r.connectivity.status === 1).length;
            if (connectedCount === 0) {
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
        connectionState.set('disconnected');
    });
}
