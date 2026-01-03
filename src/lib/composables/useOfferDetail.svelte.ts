/**
 * useOfferDetail Composable
 * 
 * Centralized business logic for offer detail page.
 * Provides userRole determination ('io' | 'dev' | null) for clean component delegation.
 * REAL-TIME reactive updates via offerEvents subscription.
 */

import { offerService, jobService, profileService, authService, contractService } from '$lib/services';
import { offerEvents } from '$lib/services/giftwrap';
import type { Offer, Contract } from '$lib/types/offer';
import type { Job } from '$lib/types/job';
import type { NDKUserProfile, NDKEvent } from '@nostr-dev-kit/ndk';
import { goto } from '$app/navigation';

export type UserRole = 'io' | 'dev' | null;

export function useOfferDetail(offerId: () => string) {
    // ========== STATE ==========
    let job = $state<Job | null>(null);
    let existingContract = $state<Contract | null>(null);
    let senderProfile = $state<NDKUserProfile | undefined>(undefined);
    let isLoading = $state(true);

    // Reactive state from subscription
    let allOfferEvents = $state<NDKEvent[]>([]);

    // Cleanup function
    let cleanupFn: (() => void) | null = null;

    // ========== DERIVED FROM SUBSCRIPTION ==========

    // Parse all events to offers
    const allOffers = $derived.by(() => {
        return allOfferEvents.map(e => offerService.parseOfferEvent(e));
    });

    // Get the initial offer
    const offer = $derived.by((): Offer | null => {
        return allOffers.find(o => o.id === offerId()) ?? null;
    });

    // Build offer chain reactively
    const offerChain = $derived.by((): Offer[] => {
        const id = offerId();
        if (!id || allOffers.length === 0) return [];

        // Build maps for traversal
        const offerMap = new Map<string, Offer>();
        const childrenMap = new Map<string, string[]>();

        for (const o of allOffers) {
            offerMap.set(o.id, o);
            if (o.prevOfferId) {
                const children = childrenMap.get(o.prevOfferId) || [];
                children.push(o.id);
                childrenMap.set(o.prevOfferId, children);
            }
        }

        const startOffer = offerMap.get(id);
        if (!startOffer) return [];

        // Find root
        let rootId = id;
        let current = startOffer;
        while (current.prevOfferId && offerMap.has(current.prevOfferId)) {
            rootId = current.prevOfferId;
            current = offerMap.get(rootId)!;
        }

        // Build chain forward from root
        const chain: Offer[] = [];
        const queue = [rootId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const chainId = queue.shift()!;
            if (visited.has(chainId)) continue;
            visited.add(chainId);

            const o = offerMap.get(chainId);
            if (o) {
                chain.push(o);
                const children = childrenMap.get(chainId) || [];
                queue.push(...children);
            }
        }

        // Sort by creation time
        chain.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

        // Deduplicate
        const seen = new Set<string>();
        return chain.filter(o => {
            const key = `${o.pubkey}-${o.status}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    });

    // ========== SETUP SUBSCRIPTION ==========

    function setupSubscription() {
        cleanupFn?.();
        cleanupFn = offerEvents.subscribe(events => {
            allOfferEvents = events;
        });
    }

    // ========== LOAD METADATA ==========

    async function loadMetadata() {
        if (!authService.isLoggedIn) return;

        isLoading = true;
        try {
            // Setup live subscription
            setupSubscription();

            // Wait a moment for events to load
            await new Promise(resolve => setTimeout(resolve, 300));

            const currentOffer = offer;
            if (currentOffer) {
                job = await jobService.getJob(currentOffer.jobId);
                senderProfile = await profileService.getProfile(currentOffer.pubkey);
                existingContract = await contractService.getContractByJobId(currentOffer.jobId);
            }
        } catch (e) {
            console.error('[OfferDetail] Load error:', e);
        } finally {
            isLoading = false;
        }
    }

    // React to login state
    $effect(() => {
        const loggedIn = authService.isLoggedIn;
        const id = offerId();

        if (loggedIn && id) {
            setTimeout(() => loadMetadata(), 500);
        }
    });

    // ========== ROLE DETERMINATION ==========

    const userRole = $derived.by((): UserRole => {
        if (!job || !authService.user?.pubkey) return null;
        return authService.user.pubkey === job.pubkey ? 'io' : 'dev';
    });

    // ========== OFFER CHAIN ANALYSIS ==========

    const acceptedOfferFromDev = $derived.by(() => {
        if (!job) return null;
        const j = job;
        return offerChain.find(o =>
            o.status === 'accepted' &&
            o.pubkey !== j.pubkey &&
            o.prevOfferId
        ) ?? null;
    });

    const latestPendingOfferForMe = $derived(() => {
        const myPubkey = authService.user?.pubkey;
        if (!myPubkey) return null;

        const pendingForMe = offerChain
            .filter(o => o.recipientPubkey === myPubkey && o.status === 'pending')
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        return pendingForMe[0] ?? null;
    });

    const pendingOffersForMe = $derived.by(() => {
        const myPubkey = authService.user?.pubkey;
        if (!myPubkey) return [];
        const result = offerChain.filter(o => o.recipientPubkey === myPubkey && o.status === 'pending');
        console.log('[useOfferDetail] pendingOffersForMe:', {
            myPubkey: myPubkey?.slice(0, 8),
            offerChainLength: offerChain.length,
            pendingCount: result.length,
            chain: offerChain.map(o => ({ id: o.id.slice(0, 8), recipient: o.recipientPubkey?.slice(0, 8), status: o.status }))
        });
        return result;
    });

    // ========== DERIVED STATUS ==========

    const canCreateContract = $derived(
        userRole === 'io' && acceptedOfferFromDev !== null
    );

    const canTakeActions = $derived(
        latestPendingOfferForMe !== null && !acceptedOfferFromDev
    );

    const effectiveStatus = $derived.by(() => {
        if (acceptedOfferFromDev) return 'accepted';
        const declined = offerChain.find(o => o.status === 'declined');
        if (declined) return 'declined';
        return offer?.status ?? 'pending';
    });

    // ========== ACTIONS ==========

    async function acceptOffer(targetOffer: Offer) {
        await offerService.acceptOffer(targetOffer);
        // No reload needed - subscription will update!
    }

    async function declineOffer(targetOffer: Offer) {
        await offerService.declineOffer(targetOffer);
        goto('/dashboard/offers');
    }

    async function createContract() {
        if (!job) return;
        const j = job;

        const acceptedOffer = acceptedOfferFromDev;
        if (!acceptedOffer) return;

        const ioCounter = offerChain.find(o => o.pubkey === j.pubkey);

        if (ioCounter?.event && acceptedOffer.event) {
            await contractService.createContract({
                jobId: acceptedOffer.jobId,
                acceptedOfferId: acceptedOffer.id,
                developerPubkey: acceptedOffer.pubkey,
                counterOffer: ioCounter.event,
                acceptOffer: acceptedOffer.event,
                agreedBid: acceptedOffer.bid,
                message: `Contract for job: ${j.title ?? 'Unknown'}`
            });
        }

        goto('/dashboard/contracts');
    }

    // ========== PUBLIC API ==========

    return {
        // Data (reactive!)
        offer: () => offer,
        job: () => job,
        existingContract: () => existingContract,
        offerChain: () => offerChain,
        senderProfile: () => senderProfile,
        isLoading: () => isLoading,

        // Role & Status (as getter functions)
        userRole: () => userRole,
        effectiveStatus: () => effectiveStatus,
        canCreateContract: () => canCreateContract,
        canTakeActions: () => canTakeActions,

        // Offer Chain Helpers (as getter functions)
        acceptedOfferFromDev: () => acceptedOfferFromDev,
        latestPendingOfferForMe: () => latestPendingOfferForMe,
        pendingOffersForMe: () => pendingOffersForMe,

        // Actions
        acceptOffer,
        declineOffer,
        createContract,

        // Cleanup
        destroy: () => cleanupFn?.()
    };
}
