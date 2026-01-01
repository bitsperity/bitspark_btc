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

    const canIOCreateContract = $derived(
        isIO &&
        offer?.status === 'accepted' &&
        offer?.pubkey !== job?.pubkey
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
        if (!offer || !job) return;

        const chain = await offerService.getOfferChain(offer.id);
        const ioCounter = chain.find(o => o.pubkey === job.pubkey);

        if (ioCounter?.event && offer.event) {
            await contractService.createContract({
                jobId: offer.jobId,
                acceptedOfferId: offer.id,
                developerPubkey: offer.pubkey,
                counterOffer: ioCounter.event,
                acceptOffer: offer.event,
                agreedBid: offer.bid,
                message: `Contract for job: ${job?.title ?? 'Unknown'}`
            });
        }

        goto('/dashboard/contracts');
    }

    return {
        offer: () => offer,
        job: () => job,
        senderProfile: () => senderProfile,
        isLoading: () => isLoading,
        isForMe: () => isForMe,
        isFromMe: () => isFromMe,
        isIO: () => isIO,
        canIOCreateContract: () => canIOCreateContract,
        handleDevAccept,
        handleDecline,
        handleCreateContract
    };
}
