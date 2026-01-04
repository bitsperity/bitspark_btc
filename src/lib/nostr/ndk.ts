/**
 * NDK Svelte Setup - Singleton NDKSvelte instance
 * 
 * Features:
 * - Reactive Svelte store subscriptions
 * - Automatic health check (30s interval)
 * - Visibility-based reconnection (tab switch)
 * - Online/offline detection
 * - Connection state tracking
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
    enableOutboxModel: true,
    autoConnectUserRelays: false,
    autoFetchUserMutelist: false
});

let isConnected = false;
let reconnectTimer: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Connect to relays
 */
export async function connectNdk(): Promise<void> {
    connectionState.set('connecting');
    reconnectAttempts = 0;

    try {
        await ndk.connect();
        isConnected = true;
        connectionState.set('connected');
        startHealthCheck();
        console.log('[NDK] Connected to relays');
    } catch (error) {
        console.error('[NDK] Connection error:', error);
        connectionState.set('disconnected');
        throw error;
    }
}

/**
 * Get number of connected relays
 */
function getConnectedRelayCount(): number {
    return Array.from(ndk.pool.relays.values()).filter(
        r => r.connectivity.status === 1
    ).length;
}

/**
 * Check if connection is healthy and reconnect if needed
 */
async function checkConnectionHealth(): Promise<void> {
    const connectedCount = getConnectedRelayCount();

    // Update state based on actual connections
    if (connectedCount === 0 && get(connectionState) === 'connected') {
        connectionState.set('disconnected');
    } else if (connectedCount > 0 && get(connectionState) !== 'connected') {
        connectionState.set('connected');
    }

    // Reconnect if no connections
    if (connectedCount === 0 && isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        console.log('[NDK] No connections, attempting reconnect...');
        reconnectAttempts++;
        connectionState.set('connecting');

        try {
            await ndk.connect();
            connectionState.set('connected');
            reconnectAttempts = 0;
            console.log('[NDK] Reconnected successfully');
        } catch (error) {
            console.error('[NDK] Reconnection failed:', error);
            connectionState.set('disconnected');
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
    }, 30000);
}

/**
 * Force reconnect (call manually if needed)
 */
export async function reconnect(): Promise<void> {
    console.log('[NDK] Force reconnect requested');
    connectionState.set('connecting');
    reconnectAttempts = 0;

    try {
        await ndk.connect();
        isConnected = true;
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

// ============================================
// Browser Event Listeners (SSR-safe)
// ============================================

if (typeof document !== 'undefined') {
    // Visibility change - reconnect when tab becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isConnected) {
            console.log('[NDK] Tab visible, checking connection...');
            checkConnectionHealth();
        }
    });
}

if (typeof window !== 'undefined') {
    // Online event - reconnect when network comes back
    window.addEventListener('online', () => {
        console.log('[NDK] Network online, reconnecting...');
        reconnect().catch(console.error);
    });

    // Offline event - update state
    window.addEventListener('offline', () => {
        console.log('[NDK] Network offline');
        connectionState.set('disconnected');
    });
}
