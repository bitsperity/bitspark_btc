<!-- NegotiationWidget.svelte -->
<script>
    import { negotiationManager } from "../../../backend/NegotiationManager.js";
    import { onMount } from "svelte";
    import { nostrCache } from '../../../backend/NostrCacheStore';
    import { currentJob } from '../../../stores/common/jobStore';
    import { initialOffers, isLoading } from './negotiationStore';
    import OfferSelector from './OfferSelector.svelte';
    import NegotiationWindow from './NegotiationWindow.svelte';

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
            
            // Filter out declined offers
            const nonDeclinedOffers = await Promise.all(
                offers.map(async (offer) => {
                    // Get the approval status for this offer
                    const approval = await negotiationManager.getOfferApproval(offer.id);
                    // If there's an approval with status 'declined', filter it out
                    const isDeclined = approval?.tags.find(t => t[0] === 'status')?.[1] === 'declined';
                    return { offer, isDeclined };
                })
            );
            
            // Keep only non-declined offers
            const filteredOffers = nonDeclinedOffers
                .filter(item => !item.isDeclined)
                .map(item => item.offer);
            
            console.log("Filtered offers (excluding declined):", filteredOffers);
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
