<script>
    import { initialOffers, selectedOffer, isLoading } from './negotiationStore';

    function selectOffer(offer) {
        selectedOffer.set(offer);
    }
</script>

{#if $isLoading}
    <div class="loading">Loading offers...</div>
{:else if $initialOffers.length === 0}
    <div class="no-offers">No offers available</div>
{:else}
    <div class="offers-list">
        {#each $initialOffers as offer}
            <div 
                class="offer-item {$selectedOffer?.id === offer.id ? 'selected' : ''}"
                on:click={() => selectOffer(offer)}
            >
                <div class="offer-header">
                    <span class="bid">{offer.tags.find(t => t[0] === 'bid')?.[1] || 'N/A'} sats</span>
                    <span class="duration">{offer.tags.find(t => t[0] === 'duration')?.[1] || 'N/A'} days</span>
                </div>
                <div class="offer-preview">
                    {offer.content}
                </div>
            </div>
        {/each}
    </div>
{/if}

<style>
    .offers-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .offer-item {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .offer-item:hover {
        background-color: #f8fafc;
        transform: translateX(4px);
    }

    .offer-item.selected {
        border-color: #223d6d;
        background-color: #f1f5f9;
        transform: translateX(4px);
    }

    .offer-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    .bid {
        color: #223d6d;
    }

    .duration {
        color: #64748b;
    }

    .offer-preview {
        font-size: 0.875rem;
        color: #4a5568;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .loading, .no-offers {
        padding: 1rem;
        text-align: center;
        color: #64748b;
    }
</style>
