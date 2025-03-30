<script>
    import { initialOffers, selectedOffer, isLoading, clearSelectedOffer, clearInitialOffers } from './negotiationStore';
    import { currentJob } from '../../../stores/common/jobStore';
    import { nostrManager } from '../../../backend/NostrManagerStore.js';

    function selectOffer(offer) {
        selectedOffer.set(offer);
        // Subscribe to all events related to this offer
        if ($nostrManager && offer) {
            // Subscribe to all events that reference this offer (counter offers and approvals)
            console.log("offer subscribing to", offer);
            $nostrManager.subscribeToEvents({
                "#e": [offer.id]
            });
        }
    }

    $: clearSelectedOffer(), $currentJob;
    $: clearInitialOffers(), $currentJob;
</script>

<div class="scrollable-container">
    {#if $isLoading}
        <div class="centered-message">Loading offers...</div>
    {:else if $initialOffers.length === 0}
        <div class="centered-message">No offers available</div>
    {:else}
        <div class="scrollable-content custom-scrollbar">
            {#each $initialOffers as offer}
                <div 
                    class="offer-item {$selectedOffer?.id === offer.id ? 'selected' : ''}"
                    on:click={() => selectOffer(offer)}
                >
                    <div class="offer-header">
                        <span class="offer-bid">{offer.tags.find(t => t[0] === 'bid')?.[1] || 'N/A'} sats</span>
                        <span class="offer-duration">{offer.tags.find(t => t[0] === 'duration')?.[1] || 'N/A'} days</span>
                    </div>
                    <div class="offer-preview">
                        {offer.content}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
