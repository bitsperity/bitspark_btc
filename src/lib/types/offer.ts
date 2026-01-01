/**
 * Offer & Contract Types
 */

import type { NostrEntity } from './nostr';
import type { NDKEvent } from '@nostr-dev-kit/ndk';

/**
 * Offer status values
 */
export type OfferStatus = 'pending' | 'accepted' | 'declined';

/**
 * Parsed Offer from NDK Event
 */
export interface Offer extends NostrEntity {
    jobId: string;
    prevOfferId?: string;
    recipientPubkey: string;
    bid: number;           // sats
    duration: number;      // days
    startDate?: string;    // ISO date
    terms: string;
    message: string;       // content
    status: OfferStatus;
}

/**
 * Input for creating a new offer
 */
export interface CreateOfferInput {
    jobId: string;
    recipientPubkey: string;
    bid: number;
    duration: number;
    startDate?: string;
    terms: string;
    message: string;
    prevOfferId?: string;  // For counter-offers
}

/**
 * Signed event stored as proof
 */
export interface SignedEventProof {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}

/**
 * Contract with embedded proofs
 */
export interface Contract extends NostrEntity {
    jobId: string;
    acceptedOfferId: string;
    developerPubkey: string;
    ioPubkey: string;
    agreedBid: number;
    message: string;
    proofs: SignedEventProof[];
    isRepublished: boolean;  // True if dev republished
}

/**
 * Input for creating a contract
 */
export interface CreateContractInput {
    jobId: string;
    acceptedOfferId: string;
    developerPubkey: string;
    counterOffer: NDKEvent;  // IO's counter-offer
    acceptOffer: NDKEvent;   // Dev's accept
    agreedBid: number;
    message: string;
}

/**
 * Offer display config
 */
export const OFFER_STATUS_CONFIG: Record<OfferStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'warning' },
    accepted: { label: 'Accepted', color: 'success' },
    declined: { label: 'Declined', color: 'error' }
};

/**
 * Contract status values
 */
export type ContractStatus = 'active' | 'pr_submitted' | 'completed' | 'disputed';

/**
 * PR status values
 */
export type PRStatus = 'submitted' | 'approved' | 'changes_requested';

/**
 * Pull Request entity
 */
export interface PullRequest extends NostrEntity {
    contractId: string;
    jobId: string;
    prUrl: string;
    message: string;
    status: PRStatus;
    developerPubkey: string;
    ioPubkey: string;
    reviewMessage?: string;
}

/**
 * Input for submitting a PR
 */
export interface SubmitPRInput {
    contractId: string;
    jobId: string;
    prUrl: string;
    message: string;
    ioPubkey: string;
}

/**
 * PR status display config
 */
export const PR_STATUS_CONFIG: Record<PRStatus, { label: string; color: string }> = {
    submitted: { label: 'Under Review', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    changes_requested: { label: 'Changes Requested', color: 'error' }
};

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
    active: { label: 'Active', color: 'primary' },
    pr_submitted: { label: 'PR Submitted', color: 'warning' },
    completed: { label: 'Completed', color: 'success' },
    disputed: { label: 'Disputed', color: 'error' }
};
