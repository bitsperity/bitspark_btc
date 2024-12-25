// src/constants/nostrKinds.js

// Core event kinds for BitSpark platform
export const NOSTR_KIND_IDEA = 1341;        // For posting new ideas/projects
export const NOSTR_KIND_JOB = 1342;         // For job postings within ideas
export const NOSTR_KIND_OFFER = 1343;  // For job applications/offers
export const NOSTR_KIND_APPROVAL = 1344;     // For approving/declining applications
export const NOSTR_KIND_CONTRACT = 1345;     // For finalizing agreements
export const NOSTR_KIND_PR = 1346;          // For pull request submissions
export const NOSTR_KIND_REVIEW = 1347;      // For reviewing work/contributions
export const NOSTR_KIND_PAYMENT = 1348;     // For payment-related events

// Standard Nostr events
export const NOSTR_KIND_PROFILE = 0;        // Profile metadata
export const NOSTR_KIND_DELETE = 5;         // Event deletion
export const NOSTR_KIND_DM = 4;            // Regular Direct Messages (NIP-04)
export const NOSTR_KIND_SEAL = 13;         // Sealed messages layer (NIP-59)
export const NOSTR_KIND_SEALED_DM = 14;    // Sealed Direct Messages (NIP-17)
export const NOSTR_KIND_GIFT_WRAP = 1059;  // Gift Wrap for anonymous events (NIP-59)

// Events that require full encryption stack
// Process: rumor (NIP-04) -> seal (NIP-59) -> gift wrap (NIP-59)
export const ENCRYPTED_KINDS = [
    NOSTR_KIND_SEALED_DM,     // Sealed DMs (NIP-17)
    NOSTR_KIND_OFFER,   // Job applications/offers
];
