/**
 * useOfferDetail Composable
 * 
 * Centralized business logic for offer detail page.
 * Provides userRole determination ('io' | 'dev' | null) for clean component delegation.
 */

import { offerService, jobService, profileService, authService, contractService } from '$lib/services';
import type { Offer } from '$lib/types/offer';
import type { Job } from '$lib/types/job';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { goto } from '$app/navigation';

export type UserRole = 'io' | 'dev' | null;

export function useOfferDetail(offerId: () => string) {
    // State
    let offer = $state<Offer | null>(null);
    let job = $state<Job | null>(null);
    let senderProfile = $state<NDKUserProfile | undefined>(undefined);
    let offerChain = $state<Offer[]>([]);
    let isLoading = $state(true);

    // Load offer and related data
    async function loadOffer() {
        if (!authService.isLoggedIn) return;

        isLoading = true;
        try {
            offer = await offerService.getOffer(offerId());
            if (offer) {
                job = await jobService.getJob(offer.jobId);
                senderProfile = await profileService.getProfile(offer.pubkey);
                offerChain = await offerService.getOfferChain(offer.id);
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
            setTimeout(() => loadOffer(), 500);
        }
    });

    // ========== ROLE DETERMINATION ==========

    /**
     * Determine user's role for this offer chain:
     * - 'io': User is the job owner (Issue Owner)
     * - 'dev': User is a developer (not job owner)
     * - null: Unknown (job not loaded or not logged in)
     */
    const userRole = $derived<UserRole>(() => {
        if (!job || !authService.user?.pubkey) return null;
        return authService.user.pubkey === job.pubkey ? 'io' : 'dev';
    });

    // ========== OFFER CHAIN ANALYSIS ==========

    /**
     * Find accepted offer from Dev in chain (Dev accepted IO's counter)
     */
    const acceptedOfferFromDev = $derived(() => {
        if (!job) return null;
        return offerChain.find(o =>
            o.status === 'accepted' &&
            o.pubkey !== job.pubkey &&
            o.prevOfferId
        ) ?? null;
    });

    /**
     * Find latest pending offer addressed to current user
     */
    const latestPendingOfferForMe = $derived(() => {
        const myPubkey = authService.user?.pubkey;
        if (!myPubkey) return null;

        const pendingForMe = offerChain
            .filter(o => o.recipientPubkey === myPubkey && o.status === 'pending')
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        return pendingForMe[0] ?? null;
    });

    /**
     * Get all pending offers addressed to current user (for action buttons)
     */
    const pendingOffersForMe = $derived(() => {
        const myPubkey = authService.user?.pubkey;
        if (!myPubkey) return [];
        return offerChain.filter(o => o.recipientPubkey === myPubkey && o.status === 'pending');
    });

    // ========== DERIVED STATUS ==========

    const canCreateContract = $derived(
        userRole() === 'io' && acceptedOfferFromDev() !== null
    );

    const canTakeActions = $derived(
        latestPendingOfferForMe() !== null && !acceptedOfferFromDev()
    );

    const effectiveStatus = $derived(() => {
        if (acceptedOfferFromDev()) return 'accepted';
        const declined = offerChain.find(o => o.status === 'declined');
        if (declined) return 'declined';
        return offer?.status ?? 'pending';
    });

    // ========== ACTIONS ==========

    async function acceptOffer(targetOffer: Offer) {
        await offerService.acceptOffer(targetOffer);
        window.location.reload();
    }

    async function declineOffer(targetOffer: Offer) {
        await offerService.declineOffer(targetOffer);
        goto('/dashboard/offers');
    }

    async function createContract() {
        if (!job) return;

        const acceptedOffer = acceptedOfferFromDev();
        if (!acceptedOffer) return;

        const ioCounter = offerChain.find(o => o.pubkey === job.pubkey);

        if (ioCounter?.event && acceptedOffer.event) {
            await contractService.createContract({
                jobId: acceptedOffer.jobId,
                acceptedOfferId: acceptedOffer.id,
                developerPubkey: acceptedOffer.pubkey,
                counterOffer: ioCounter.event,
                acceptOffer: acceptedOffer.event,
                agreedBid: acceptedOffer.bid,
                message: `Contract for job: ${job.title ?? 'Unknown'}`
            });
        }

        goto('/dashboard/contracts');
    }

    // ========== PUBLIC API ==========

    return {
        // Data
        offer: () => offer,
        job: () => job,
        offerChain: () => offerChain,
        senderProfile: () => senderProfile,
        isLoading: () => isLoading,

        // Role & Status
        userRole,
        effectiveStatus,
        canCreateContract: () => canCreateContract,
        canTakeActions: () => canTakeActions,

        // Offer Chain Helpers
        acceptedOfferFromDev,
        latestPendingOfferForMe,
        pendingOffersForMe,

        // Actions
        acceptOffer,
        declineOffer,
        createContract
    };
}
