/**
 * Authentication Types
 */

import type { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

/**
 * Extended profile with BitSpark-specific fields
 */
export interface Profile extends NDKUserProfile {
    pubkey: string;
    npub: string;
    github?: GitHubIdentity;
}

/**
 * GitHub verification via Gist
 */
export interface GitHubIdentity {
    username: string;
    gistId: string;
    verified: boolean;
}

/**
 * Auth state for reactive UI
 */
export interface AuthState {
    user: NDKUser | undefined;
    profile: Profile | undefined;
    isLoading: boolean;
    error: string | undefined;
}
