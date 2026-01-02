/**
 * useOfferDetail Composable
 * 
 * Centralized business logic for offer detail page.
 * Handles loading, role checks, and contract creation.
 */

import { offerService, jobService, profileService, authService, contractService } from '$lib/services';
import type { Offer } from '$lib/types/offer';
import type { Job } from '$lib/types/job';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { goto } from '$app/navigation';

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
                // Load the full chain to find accepted offers
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

    // Computed role checks
    const isForMe = $derived(offer && authService.user?.pubkey === offer.recipientPubkey);
    const isFromMe = $derived(offer && authService.user?.pubkey === offer.pubkey);
    const isIO = $derived(job && authService.user?.pubkey === job.pubkey);

    // Find an ACCEPTED offer from Dev in the chain
    // This means: status='accepted', from Dev (not IO), and must have a prevOfferId (it's a response)
    const acceptedOfferFromDev = $derived(() => {
        if (!job) return null;

        const found = offerChain.find(o =>
            o.status === 'accepted' &&           // Explicitly accepted
            o.pubkey !== job.pubkey &&           // From Dev (not IO)
            o.prevOfferId                        // Must be responding to something (not initial offer)
        );

        return found ?? null;
    });

    // IO can create contract if there's a proper accepted offer from Dev in the chain
    const canIOCreateContract = $derived(
        isIO && job && acceptedOfferFromDev() !== null
    );

    // Dev accepts offer (doesn't create contract)
    async function handleDevAccept() {
        if (!offer) return;
        await offerService.acceptOffer(offer);
        goto('/dashboard/offers');
    }

    // Dev declines offer
    async function handleDecline() {
        if (!offer) return;
        await offerService.declineOffer(offer);
        goto('/dashboard/offers');
    }

    // IO creates contract after seeing Dev's accept
    async function handleCreateContract() {
        if (!job) return;

        const acceptedOffer = acceptedOfferFromDev();
        if (!acceptedOffer) return;

        // Find IO's counter-offer that Dev accepted
        const ioCounter = offerChain.find(o => o.pubkey === job.pubkey);

        if (ioCounter?.event && acceptedOffer.event) {
            await contractService.createContract({
                jobId: acceptedOffer.jobId,
                acceptedOfferId: acceptedOffer.id,
                developerPubkey: acceptedOffer.pubkey,
                counterOffer: ioCounter.event,
                acceptOffer: acceptedOffer.event,
                agreedBid: acceptedOffer.bid,
                message: `Contract for job: ${job?.title ?? 'Unknown'}`
            });
        }

        goto('/dashboard/contracts');
    }

    // Find the latest pending offer addressed to current user in the chain
    const latestPendingOfferForMe = $derived(() => {
        const myPubkey = authService.user?.pubkey;
        if (!myPubkey) return null;

        // Find pending offers addressed to me, sorted by created_at desc
        const pendingForMe = offerChain
            .filter(o => o.recipientPubkey === myPubkey && o.status === 'pending')
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        return pendingForMe[0] ?? null;
    });

    return {
        offer: () => offer,
        job: () => job,
        senderProfile: () => senderProfile,
        offerChain: () => offerChain,
        isLoading: () => isLoading,
        isForMe: () => isForMe,
        isFromMe: () => isFromMe,
        isIO: () => isIO,
        canIOCreateContract: () => canIOCreateContract,
        acceptedOfferFromDev,
        latestPendingOfferForMe,
        handleDevAccept,
        handleDecline,
        handleCreateContract
    };
}

