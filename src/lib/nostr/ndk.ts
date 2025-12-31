/**
 * NDK Store - Singleton NDK instance for the app
 * 
 * Usage:
 *   import { ndk, ndkUser } from '$lib/nostr/ndk';
 *   
 *   // Connect
 *   await ndk.connect();
 *   
 *   // Login with extension (NIP-07)
 *   const user = await ndkUser.login();
 */

import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk';
import { writable, derived, type Readable } from 'svelte/store';
import { DEFAULT_RELAYS } from './config';

// NDK instance - singleton
const ndkInstance = new NDK({
    explicitRelayUrls: DEFAULT_RELAYS,
    enableOutboxModel: true
});

// Stores
const connected = writable(false);
const currentUser = writable<NDK['activeUser']>(undefined);
const connectionError = writable<string | undefined>(undefined);

/**
 * Connect to relays
 */
async function connect(): Promise<void> {
    try {
        connectionError.set(undefined);
        await ndkInstance.connect();
        connected.set(true);
        console.log('[NDK] Connected to relays');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect';
        connectionError.set(message);
        console.error('[NDK] Connection error:', error);
        throw error;
    }
}

/**
 * Login with NIP-07 browser extension (Alby, nos2x, etc.)
 */
async function loginWithExtension(): Promise<typeof ndkInstance.activeUser> {
    if (typeof window === 'undefined' || !window.nostr) {
        throw new Error('No Nostr extension found. Please install Alby or nos2x.');
    }

    try {
        const signer = new NDKNip07Signer();
        ndkInstance.signer = signer;

        const user = await signer.user();
        await user.fetchProfile();

        ndkInstance.activeUser = user;
        currentUser.set(user);

        console.log('[NDK] Logged in as:', user.npub);
        return user;
    } catch (error) {
        console.error('[NDK] Login error:', error);
        throw error;
    }
}

/**
 * Logout - clear active user
 */
function logout(): void {
    ndkInstance.signer = undefined;
    ndkInstance.activeUser = undefined;
    currentUser.set(undefined);
    console.log('[NDK] Logged out');
}

/**
 * Check if user is logged in
 */
const isLoggedIn: Readable<boolean> = derived(currentUser, $user => $user !== undefined);

// Export NDK instance and utilities
export const ndk = ndkInstance;

export const ndkStore = {
    ndk: ndkInstance,
    connected,
    currentUser,
    connectionError,
    isLoggedIn,
    connect,
    loginWithExtension,
    logout
};

export default ndkStore;
