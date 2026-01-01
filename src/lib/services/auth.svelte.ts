/**
 * AuthService - Handles NIP-07 authentication
 * 
 * Uses a reactive signal (_authVersion) to trigger UI updates.
 * ndk.activeUser is source of truth, signal triggers reactivity.
 * 
 * Usage:
 *   import { authService } from '$lib/services';
 *   
 *   await authService.login();
 *   authService.user  // Current user (reactive)
 *   authService.isLoggedIn  // Boolean (reactive)
 */

import { NDKNip07Signer, type NDKUser } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { giftWrapService } from './giftwrap';

class AuthService {
    // Reactive signal - increment to trigger UI updates
    private _authVersion = $state(0);
    private _isLoading = $state(false);
    private _error = $state<string | undefined>(undefined);

    // Reading _authVersion makes these getters reactive
    get user(): NDKUser | undefined {
        // Touch version to make this getter reactive
        void this._authVersion;
        return ndk.activeUser;
    }

    get isLoggedIn(): boolean {
        // Touch version to make this getter reactive
        void this._authVersion;
        return ndk.activeUser !== undefined;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get error(): string | undefined {
        return this._error;
    }

    /**
     * Login with NIP-07 browser extension (Alby, nos2x, etc.)
     */
    async login(): Promise<NDKUser> {
        if (typeof window === 'undefined') {
            throw new Error('Cannot login on server');
        }

        if (!window.nostr) {
            throw new Error('No Nostr extension found. Please install Alby or nos2x.');
        }

        this._isLoading = true;
        this._error = undefined;

        try {
            const signer = new NDKNip07Signer();
            ndk.signer = signer;

            const user = await signer.user();
            await user.fetchProfile();

            ndk.activeUser = user;

            // Trigger reactive update
            this._authVersion++;

            // Start encrypted event subscription
            giftWrapService.start();

            console.log('[Auth] Logged in as:', user.npub);
            return user;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            this._error = message;
            console.error('[Auth] Login error:', error);
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    /**
     * Logout - clear current user
     */
    logout(): void {
        // Stop encrypted event subscription
        giftWrapService.stop();

        ndk.signer = undefined;
        ndk.activeUser = undefined;
        this._error = undefined;

        // Trigger reactive update
        this._authVersion++;

        console.log('[Auth] Logged out');
    }

    /**
     * Check if Nostr extension is available
     */
    hasExtension(): boolean {
        return typeof window !== 'undefined' && !!window.nostr;
    }
}

// Singleton export
export const authService = new AuthService();
