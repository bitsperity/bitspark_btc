/**
 * BitSpark Nostr Configuration
 * 
 * Centralized configuration for Nostr protocol settings.
 */

// Default relays for BitSpark
// Using local Umbrel relay for development
export const DEFAULT_RELAYS = [
    'ws://umbrel.local:4848'
];

// App identifier tag - used in all BitSpark events
export const APP_TAG: [string, string] = ['s', 'bitspark'];

// BitSpark custom event kinds
export const NOSTR_KINDS = {
    // Standard kinds
    METADATA: 0,
    TEXT_NOTE: 1,
    CONTACTS: 3,
    DM: 4,
    REACTION: 7,
    ZAP_REQUEST: 9734,
    ZAP_RECEIPT: 9735,

    // BitSpark custom kinds
    // 1xxx = non-replaceable (immutable)
    // 30xxx = replaceable
    IDEA: 30100,           // Replaceable - can update idea details
    JOB: 30101,            // Replaceable - can update job details
    OFFER: 30102,          // Replaceable - can update offer
    OFFER_RESPONSE: 30103, // Replaceable - can update response
    CONTRACT: 30104,       // Replaceable - can update contract status
    PULL_REQUEST: 1105,    // IMMUTABLE - PR chain must be permanent
    REVIEW: 1106,          // IMMUTABLE - Review chain must be permanent
    PAYMENT: 30107,
    CONTRACT_CONFIRMATION: 30108
} as const;

// Event tag types
export const TAGS = {
    EVENT: 'e',
    PUBKEY: 'p',
    REPLACEABLE: 'd',
    TITLE: 'title',
    SUMMARY: 'summary',
    IMAGE: 'image',
    AMOUNT: 'amount',
    STATUS: 'status',
    CATEGORY: 'c',
    LANGUAGE: 'l',
    GITHUB: 'github',
    LIGHTNING: 'lnaddress'
} as const;

// Status values for various events
export const STATUS = {
    IDEA: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        ARCHIVED: 'archived'
    },
    JOB: {
        OPEN: 'open',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },
    OFFER: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        DECLINED: 'declined',
        WITHDRAWN: 'withdrawn'
    },
    CONTRACT: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        DISPUTED: 'disputed'
    },
    PR: {
        SUBMITTED: 'submitted',
        APPROVED: 'approved',
        CHANGES_REQUESTED: 'changes_requested',
        MERGED: 'merged'
    }
} as const;

export type NostrKind = typeof NOSTR_KINDS[keyof typeof NOSTR_KINDS];
