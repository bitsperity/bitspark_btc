/**
 * AuthService - Handles NIP-07 authentication
 * 
 * Single Responsibility: User authentication lifecycle only.
 * Uses Svelte 5 $state for reactive state management.
 * 
 * Usage:
 *   import { authService } from '$lib/services';
 *   
 *   await authService.login();
 *   authService.user  // Current user
 *   authService.isLoggedIn  // Boolean
 */

import { NDKNip07Signer, type NDKUser } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';

class AuthService {
    // Svelte 5 reactive state
    private _user = $state<NDKUser | undefined>(undefined);
    private _isLoading = $state(false);
    private _error = $state<string | undefined>(undefined);

    // Getters for reactive access
    get user(): NDKUser | undefined {
        return this._user;
    }

    get isLoggedIn(): boolean {
        return this._user !== undefined;
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
            this._user = user;

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
        ndk.signer = undefined;
        ndk.activeUser = undefined;
        this._user = undefined;
        this._error = undefined;
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
