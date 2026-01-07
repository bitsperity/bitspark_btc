/**
 * AuthService - Handles NIP-07 authentication
 * 
 * Features:
 * - NIP-07 browser extension login
 * - Auto-reconnect before login
 * - Profile fetch with timeout
 * - Reactive state with $state
 */

import { NDKNip07Signer, type NDKUser } from '@nostr-dev-kit/ndk';
import { ndk, reconnect } from '$lib/nostr';
import { giftWrapService } from './giftwrap';
import { dmService } from './dm';
import { socialService } from './social';
import { bookmarkService } from './bookmarks';
import { listService } from './lists';

// Profile fetch timeout (5 seconds)
const PROFILE_TIMEOUT = 5000;

class AuthService {
    private _authVersion = $state(0);
    private _isLoading = $state(false);
    private _error = $state<string | undefined>(undefined);
    private _profileLoading = $state(false);

    get user(): NDKUser | undefined {
        void this._authVersion;
        return ndk.activeUser;
    }

    get isLoggedIn(): boolean {
        void this._authVersion;
        return ndk.activeUser !== undefined;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get profileLoading(): boolean {
        return this._profileLoading;
    }

    get error(): string | undefined {
        return this._error;
    }

    /**
     * Login with NIP-07 browser extension
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
            // Ensure NDK connection before login
            console.log('[Auth] Ensuring NDK connection...');
            try {
                await reconnect();
            } catch (e) {
                console.warn('[Auth] Reconnect failed, trying login anyway');
            }

            const signer = new NDKNip07Signer();
            ndk.signer = signer;

            const user = await signer.user();
            ndk.activeUser = user;

            // Trigger reactive update immediately (user is logged in)
            this._authVersion++;
            this._isLoading = false;

            // Fetch profile in background with timeout
            this._profileLoading = true;
            this.fetchProfileWithTimeout(user).finally(() => {
                this._profileLoading = false;
                this._authVersion++;
            });

            // Start encrypted event subscription
            giftWrapService.start();

            // Initialize DM service
            dmService.init();

            // Initialize social features (follows, likes)
            socialService.init();

            // Initialize bookmarks
            bookmarkService.init();

            // Initialize lists
            listService.init();

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
     * Fetch profile with timeout - doesn't block login
     */
    private async fetchProfileWithTimeout(user: NDKUser): Promise<void> {
        try {
            const fetchPromise = user.fetchProfile();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_TIMEOUT)
            );

            await Promise.race([fetchPromise, timeoutPromise]);
            console.log('[Auth] Profile fetched successfully');
        } catch (error) {
            console.warn('[Auth] Profile fetch failed:', error);
            // Will retry in UserMenu
        }
    }

    /**
     * Retry fetching profile (called from UserMenu if profile is missing)
     */
    async retryFetchProfile(): Promise<void> {
        if (!ndk.activeUser) return;

        this._profileLoading = true;
        try {
            await this.fetchProfileWithTimeout(ndk.activeUser);
        } finally {
            this._profileLoading = false;
            this._authVersion++;
        }
    }

    /**
     * Logout - clear current user
     */
    logout(): void {
        giftWrapService.stop();
        ndk.signer = undefined;
        ndk.activeUser = undefined;
        this._error = undefined;
        this._authVersion++;
    }

    /**
     * Check if Nostr extension is available
     */
    hasExtension(): boolean {
        return typeof window !== 'undefined' && !!window.nostr;
    }
}

export const authService = new AuthService();
