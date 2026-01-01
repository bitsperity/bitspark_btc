/**
 * OfferService - Manages offers for BitSpark
 * 
 * Uses the central GiftWrapService for all encrypted event handling.
 * This service focuses on offer-specific business logic.
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS, APP_TAG } from '$lib/nostr/config';
import type { Offer, CreateOfferInput, OfferStatus } from '$lib/types/offer';
import { createTagAccessors, parseBaseEvent } from '$lib/utils';
import { derived, type Readable } from 'svelte/store';
import { giftWrapService, offerEvents } from './giftwrap';

class OfferService {
    /**
     * Send an encrypted offer using NIP-59 Gift Wrap
     */
    async sendOffer(input: CreateOfferInput): Promise<NDKEvent> {
        const signer = ndk.signer;
        if (!signer) throw new Error('No signer available');

        const user = await signer.user();

        // Create the rumor event (unsigned - will be wrapped)
        const rumor = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        rumor.kind = NOSTR_KINDS.OFFER;
        rumor.pubkey = user.pubkey;
        rumor.content = input.message;
        rumor.created_at = Math.floor(Date.now() / 1000);

        // Generate unique d-tag
        const dTag = `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        rumor.tags = [
            ['d', dTag],
            ['e', input.jobId, '', 'job'],
            ['p', input.recipientPubkey],
            ['bid', input.bid.toString()],
            ['duration', input.duration.toString()],
            ['terms', input.terms],
            ['status', 'pending'],
            APP_TAG
        ];

        if (input.startDate) {
            rumor.tags.push(['startDate', input.startDate]);
        }
        if (input.prevOfferId) {
            rumor.tags.push(['e', input.prevOfferId, '', 'prev']);
        }

        // Use central GiftWrapService to send
        const result = await giftWrapService.sendGiftWrap(rumor, input.recipientPubkey, true);

        console.log('[OfferService] Sent offer:', rumor.id?.slice(0, 16) + '...');
        return result.toRecipient;
    }

    /**
     * Accept an offer (encrypted)
     */
    async acceptOffer(offer: Offer): Promise<NDKEvent> {
        // Prevent double-accept
        const currentStatus = await this.getLatestStatus(offer.id);
        if (currentStatus === 'accepted') {
            throw new Error('Offer has already been accepted');
        }
        if (currentStatus === 'declined') {
            throw new Error('Offer has already been declined');
        }

        const signer = ndk.signer;
        if (!signer) throw new Error('No signer available');

        const user = await signer.user();

        const rumor = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        rumor.kind = NOSTR_KINDS.OFFER;
        rumor.pubkey = user.pubkey;
        rumor.content = 'Offer accepted';
        rumor.created_at = Math.floor(Date.now() / 1000);

        const dTag = `accept-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        rumor.tags = [
            ['d', dTag],
            ['e', offer.jobId, '', 'job'],
            ['e', offer.id, '', 'prev'],
            ['p', offer.pubkey],
            ['bid', offer.bid.toString()],
            ['duration', offer.duration.toString()],
            ['terms', offer.terms],
            ['status', 'accepted'],
            APP_TAG
        ];

        const result = await giftWrapService.sendGiftWrap(rumor, offer.pubkey, true);
        console.log('[OfferService] Accepted offer');
        return result.toRecipient;
    }

    /**
     * Decline an offer (encrypted)
     */
    async declineOffer(offer: Offer): Promise<NDKEvent> {
        // Prevent double-decline or declining accepted offer
        const currentStatus = await this.getLatestStatus(offer.id);
        if (currentStatus === 'accepted') {
            throw new Error('Offer has already been accepted');
        }
        if (currentStatus === 'declined') {
            throw new Error('Offer has already been declined');
        }

        const signer = ndk.signer;
        if (!signer) throw new Error('No signer available');

        const user = await signer.user();

        const rumor = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        rumor.kind = NOSTR_KINDS.OFFER;
        rumor.pubkey = user.pubkey;
        rumor.content = 'Offer declined';
        rumor.created_at = Math.floor(Date.now() / 1000);

        const dTag = `decline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        rumor.tags = [
            ['d', dTag],
            ['e', offer.jobId, '', 'job'],
            ['e', offer.id, '', 'prev'],
            ['p', offer.pubkey],
            ['status', 'declined'],
            APP_TAG
        ];

        const result = await giftWrapService.sendGiftWrap(rumor, offer.pubkey, true);
        console.log('[OfferService] Declined offer');
        return result.toRecipient;
    }

    /**
     * Subscribe to initial offers I received (where I'm the recipient, not the author)
     * Only returns initial offers (no counter-offers) - counter-offers are shown in history
     */
    subscribeToMyOffers(): Readable<Offer[]> {
        const user = ndk.activeUser;
        const myPubkey = user?.pubkey ?? '';

        return derived(offerEvents, $events => {
            return $events
                .filter(e => e.pubkey !== myPubkey) // Not authored by me
                .map(e => this.parseOfferEvent(e))
                .filter(o => !o.prevOfferId); // Only initial offers
        });
    }

    /**
     * Subscribe to initial offers I sent
     * Only returns initial offers (no counter-offers) - counter-offers are shown in history
     */
    subscribeToMySentOffers(): Readable<Offer[]> {
        const user = ndk.activeUser;
        const myPubkey = user?.pubkey ?? '';

        return derived(offerEvents, $events => {
            return $events
                .filter(e => e.pubkey === myPubkey) // Authored by me
                .map(e => this.parseOfferEvent(e))
                .filter(o => !o.prevOfferId); // Only initial offers
        });
    }

    /**
     * Subscribe to offers for a specific job
     */
    subscribeToJobOffers(jobId: string): Readable<Offer[]> {
        return derived(offerEvents, $events => {
            return $events
                .filter(e => {
                    const jobTag = e.tags.find(t => t[0] === 'e' && t[3] === 'job');
                    return jobTag?.[1] === jobId;
                })
                .map(e => this.parseOfferEvent(e));
        });
    }

    /**
     * Get a single offer from the central cache
     */
    async getOffer(offerId: string): Promise<Offer | null> {
        const event = giftWrapService.getDecryptedEvent(offerId);
        if (!event) return null;
        return this.parseOfferEvent(event);
    }

    /**
     * Get the full offer chain for negotiation history
     * Follows prevOfferId references bidirectionally
     */
    async getOfferChain(offerId: string): Promise<Offer[]> {
        // Get all offer events from the store
        const allOfferEvents: NDKEvent[] = [];
        offerEvents.subscribe(events => {
            allOfferEvents.push(...events);
        })();

        // Build maps for traversal
        const offerMap = new Map<string, Offer>();
        const childrenMap = new Map<string, string[]>(); // prevId -> [childIds]

        for (const event of allOfferEvents) {
            const offer = this.parseOfferEvent(event);
            offerMap.set(offer.id, offer);

            // Track children (offers that reference this one as prev)
            if (offer.prevOfferId) {
                const children = childrenMap.get(offer.prevOfferId) || [];
                children.push(offer.id);
                childrenMap.set(offer.prevOfferId, children);
            }
        }

        const startOffer = offerMap.get(offerId);
        if (!startOffer) return [];

        // Find root by traversing backwards
        let rootId = offerId;
        let current = startOffer;
        while (current.prevOfferId && offerMap.has(current.prevOfferId)) {
            rootId = current.prevOfferId;
            current = offerMap.get(rootId)!;
        }

        // Build chain forward from root using BFS
        const chain: Offer[] = [];
        const queue = [rootId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);

            const offer = offerMap.get(id);
            if (offer) {
                chain.push(offer);
                // Add children to queue
                const children = childrenMap.get(id) || [];
                queue.push(...children);
            }
        }

        // Sort by creation time
        chain.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

        // Deduplicate: if same person sends same status twice, keep only the first
        const seen = new Set<string>();
        const dedupedChain = chain.filter(offer => {
            const key = `${offer.pubkey}-${offer.status}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return dedupedChain;
    }

    /**
     * Get the current status of an offer (from latest in chain)
     */
    async getLatestStatus(offerId: string): Promise<OfferStatus> {
        const chain = await this.getOfferChain(offerId);
        if (chain.length === 0) return 'pending';

        // Find the latest non-pending status
        for (let i = chain.length - 1; i >= 0; i--) {
            if (chain[i].status !== 'pending') {
                return chain[i].status;
            }
        }
        return 'pending';
    }


    /**
     * Parse NDKEvent to Offer
     */
    parseOfferEvent(event: NDKEvent): Offer {
        const { getTag, getTags } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        const jobTag = event.tags.find(t => t[0] === 'e' && t[3] === 'job');
        const prevTag = event.tags.find(t => t[0] === 'e' && t[3] === 'prev');

        return {
            ...base,
            jobId: jobTag?.[1] ?? getTags('e')[0] ?? '',
            prevOfferId: prevTag?.[1],
            recipientPubkey: getTag('p') ?? '',
            bid: parseInt(getTag('bid') ?? '0', 10),
            duration: parseInt(getTag('duration') ?? '0', 10),
            startDate: getTag('startDate'),
            terms: getTag('terms') ?? '',
            message: event.content,
            status: (getTag('status') as OfferStatus) ?? 'pending',
            event
        };
    }
}

export const offerService = new OfferService();
