// src/constants/nostrKinds.js

// Core event kinds for BitSpark platform
export const NOSTR_KIND_IDEA = 1341;        // For posting new ideas/projects
export const NOSTR_KIND_JOB = 2542;         // For job postings within ideas
export const NOSTR_KIND_OFFER = 2543;       // For job applications/offers (encrypted)
export const NOSTR_KIND_APPROVAL = 2544;     // For approving/declining applications
export const NOSTR_KIND_CONTRACT = 2545;     // For finalizing agreements
export const NOSTR_KIND_PR = 2546;          // For pull request submissions
export const NOSTR_KIND_REVIEW = 2547;      // For reviewing work/contributions

// Standard Nostr events
export const NOSTR_KIND_PROFILE = 0;        // Profile metadata
export const NOSTR_KIND_DELETE = 5;         // Event deletion
export const NOSTR_KIND_DM = 4;            // Regular Direct Messages (NIP-04)
export const NOSTR_KIND_SEAL = 13;         // Sealed messages layer (NIP-59)
export const NOSTR_KIND_SEALED_DM = 14;    // Sealed Direct Messages (NIP-17)
export const NOSTR_KIND_GIFT_WRAP = 1059;  // Gift Wrap for anonymous events (NIP-59)
