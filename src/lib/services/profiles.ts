/**
 * ProfileService - Handles profile fetching and updates
 * 
 * Single Responsibility: Profile data management.
 * Uses NDKSvelte.storeSubscribe() for reactive subscriptions.
 * 
 * Usage:
 *   import { profileService } from '$lib/services';
 *   
 *   const profileStore = profileService.subscribeToProfile(pubkey);
 *   $profileStore[0]?.profile  // Reactive profile data
 */

import type { NDKUserProfile, NDKUser } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import type { Profile } from '$lib/types';

class ProfileService {
    /**
     * Create a reactive subscription to a user's profile (Kind 0)
     * Returns a Svelte store that auto-updates when events arrive.
     */
    subscribeToProfile(pubkey: string) {
        return ndk.storeSubscribe(
            { kinds: [0], authors: [pubkey] },
            { closeOnEose: true }
        );
    }

    /**
     * Fetch a profile once (non-reactive)
     */
    async getProfile(pubkey: string): Promise<NDKUserProfile | undefined> {
        const user = ndk.getUser({ pubkey });
        await user.fetchProfile();
        return user.profile;
    }

    /**
     * Get NDKUser by pubkey
     */
    getUser(pubkey: string): NDKUser {
        return ndk.getUser({ pubkey });
    }

    /**
     * Update current user's profile
     */
    async updateProfile(profile: Partial<NDKUserProfile>): Promise<void> {
        const user = ndk.activeUser;
        if (!user) {
            throw new Error('Not logged in');
        }

        // Merge with existing profile
        user.profile = {
            ...user.profile,
            ...profile
        };

        // Publish Kind 0 event
        await user.publish();
        console.log('[Profile] Updated profile');
    }

    /**
     * Convert pubkey to Profile with extended fields
     */
    async getExtendedProfile(pubkey: string): Promise<Profile | undefined> {
        const ndkProfile = await this.getProfile(pubkey);
        if (!ndkProfile) return undefined;

        const user = this.getUser(pubkey);

        return {
            ...ndkProfile,
            pubkey,
            npub: user.npub
        };
    }
}

// Singleton export
export const profileService = new ProfileService();
