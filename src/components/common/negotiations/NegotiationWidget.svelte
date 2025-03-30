<!-- NegotiationWidget.svelte -->
<script>
    import { negotiationManager } from "../../../backend/NegotiationManager.js";
    import { onMount } from "svelte";
    import { nostrCache } from '../../../backend/NostrCacheStore';
    import { currentJob } from '../../../stores/common/jobStore';
    import { initialOffers, isLoading } from './negotiationStore';
    import OfferSelector from './OfferSelector.svelte';
    import NegotiationWindow from './NegotiationWindow.svelte';
    import { nostrManager } from '../../../backend/NostrManagerStore.js';

    let title = "Negotiations";

    // Reactive statement to handle job changes
    $: if ($currentJob) {
        loadInitialOffers($currentJob.id);
    }

    async function loadInitialOffers(jobId) {
        if (!jobId) return;
        
        isLoading.set(true);
        try {
            const offers = await negotiationManager.getInitialOffers(jobId);
            console.log("All initial offers:", offers);
            
            // Filter out only offers that were declined by the current user
            const nonDeclinedOffers = await Promise.all(
                offers.map(async (offer) => {
                    // Get the approval status for this offer
                    const approvals = await negotiationManager.getOfferApproval(offer.id);

                    // approvals is an array of approval events or null
                    // we need to check if any of the approvals are declined by the current user
                    const isDeclinedByMe = approvals?.some(approval => 
                        approval.tags.find(t => t[0] === 'status')?.[1] === 'declined' && 
                        approval.pubkey === $nostrManager?.publicKey
                    );
                    return { offer, isDeclinedByMe };
                })
            );
            
            // Keep offers that weren't declined by the current user
            const filteredOffers = nonDeclinedOffers
                .filter(item => !item.isDeclinedByMe)
                .map(item => item.offer);
            
            console.log("Filtered offers (excluding those declined by me):", filteredOffers);
            initialOffers.set(filteredOffers);
        } catch (error) {
            console.error('Error loading initial offers:', error);
        } finally {
            isLoading.set(false);
        }
    }

    // Reactive statement to reload when cache updates
    $: if ($nostrCache && $currentJob) {
        loadInitialOffers($currentJob.id);
    }

    onMount(async () => {
        if ($currentJob) {
            await loadInitialOffers($currentJob.id);
        }
    });
</script>

<div class="single-card container">
    <div class="negotiation-layout">
        <h2 class="negotiation-layout-title">
            {title}
        </h2>

        <div class="negotiation-layout-content">
            <!-- Left side: Offer selector -->
            <div class="negotiation-layout-left">
                <OfferSelector />
            </div>

            <!-- Right side: Negotiation window -->
            <div class="negotiation-layout-right">
                <NegotiationWindow />
            </div>
        </div>
    </div>
</div>
