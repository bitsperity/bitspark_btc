<script>
    import { selectedOffer, currentNegotiationChain } from './negotiationStore';
    import { negotiationManager } from '../../../backend/NegotiationManager.js';
    import NegotiationBubble from './NegotiationBubble.svelte';
    import InteractionBar from './InteractionBar.svelte';

    let latestOffer = null;
    let approval = null;

    // When selected offer changes, load the negotiation chain
    $: if ($selectedOffer) {
        loadNegotiationChain($selectedOffer.id);
    } else {
        currentNegotiationChain.set([]);
    }

    // Update latest offer when chain changes
    $: if ($currentNegotiationChain.length > 0) {
        latestOffer = $currentNegotiationChain[$currentNegotiationChain.length - 1];
        loadApproval(latestOffer.id);
    } else {
        latestOffer = null;
        approval = null;
    }

    async function loadNegotiationChain(offerId) {
        try {
            const chain = await negotiationManager.getNegotiationChain(offerId);
            currentNegotiationChain.set(chain);
        } catch (error) {
            console.error('Error loading negotiation chain:', error);
            currentNegotiationChain.set([]);
        }
    }

    async function loadApproval(offerId) {
        try {
            approval = await negotiationManager.getOfferApproval(offerId);
        } catch (error) {
            console.error('Error loading approval:', error);
            approval = null;
        }
    }
</script>

<div class="negotiation-window">
    {#if !$selectedOffer}
        <div class="no-selection">
            Select an offer to view the negotiation
        </div>
    {:else if $currentNegotiationChain.length === 0}
        <div class="loading">
            Loading negotiation...
        </div>
    {:else}
        <div class="bubbles-container">
            {#each $currentNegotiationChain as offer}
                <NegotiationBubble 
                    {offer} 
                    isInitial={offer.id === $selectedOffer.id}
                />
            {/each}
        </div>

        <!-- Only show interaction bar if we have a latest offer -->
        {#if latestOffer}
            <InteractionBar 
                offer={latestOffer}
                {approval}
            />
        {/if}
    {/if}
</div>

<style>
    .negotiation-window {
        height: 100%;
        min-height: 400px;
        background-color: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }

    .bubbles-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex-grow: 1;
        overflow-y: auto;
    }

    .no-selection, .loading {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-style: italic;
    }
</style>
