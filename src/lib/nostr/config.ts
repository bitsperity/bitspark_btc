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
    IDEA: 1100,            // IMMUTABLE - ideas must be permanent
    JOB: 1101,             // IMMUTABLE - jobs must be permanent  
    OFFER: 30102,          // Replaceable - can update offer
    OFFER_RESPONSE: 30103, // Replaceable - can update response
    CONTRACT: 1104,        // IMMUTABLE - contracts must be permanent
    PULL_REQUEST: 1105,    // IMMUTABLE - PR chain must be permanent
    REVIEW: 1106,          // IMMUTABLE - Review chain must be permanent
    PAYMENT: 1107,         // IMMUTABLE - payment records must be permanent
    CONTRACT_CONFIRMATION: 1108  // IMMUTABLE - confirmations must be permanent
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
