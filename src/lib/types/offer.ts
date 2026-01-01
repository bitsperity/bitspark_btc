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
