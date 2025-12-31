/**
 * NDK Svelte Setup - Singleton NDKSvelte instance
 * 
 * Uses NDKSvelte (not plain NDK) for reactive Svelte store subscriptions.
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
    enableOutboxModel: true
});

/**
 * Connect to relays
 */
export async function connectNdk(): Promise<void> {
    try {
        await ndk.connect();
        console.log('[NDK] Connected to relays:', DEFAULT_RELAYS);
    } catch (error) {
        console.error('[NDK] Connection error:', error);
        throw error;
    }
}
