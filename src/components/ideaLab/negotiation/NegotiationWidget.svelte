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
            initialOffers.set(offers);
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
