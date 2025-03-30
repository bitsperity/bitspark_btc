<script>
    import { selectedOffer, currentNegotiationChain } from './negotiationStore';
    import { negotiationManager } from '../../../backend/NegotiationManager.js';
    import NegotiationBubble from './NegotiationBubble.svelte';
    import InteractionBar from './InteractionBar.svelte';
    import { onMount, tick } from 'svelte';
    import { nostrCache } from '../../../backend/NostrCacheStore';

    let latestOffer = null;
    let approval = null;
    let bubblesContainer;
    let lastCacheUpdate = 0;

    // When selected offer changes, load the negotiation chain
    $: if ($selectedOffer) {
        loadNegotiationChain($selectedOffer.id);
    } else {
        currentNegotiationChain.set([]);
    }

    // Update latest offer when chain changes
    $: if ($currentNegotiationChain.length > 0) {
        latestOffer = $currentNegotiationChain[$currentNegotiationChain.length - 1];
        if ($selectedOffer) {
            loadApproval($selectedOffer.id);
        }
        scrollToBottom();
    } else {
        latestOffer = null;
        approval = null;
    }

    // React to changes in the nostrCache
    $: if ($nostrCache && $selectedOffer) {
        // Check if there are new events related to the current negotiation
        loadNegotiationChain($selectedOffer.id);
    }

    async function scrollToBottom() {
        await tick(); // Wait for DOM update
        if (bubblesContainer) {
            bubblesContainer.scrollTop = bubblesContainer.scrollHeight;
        }
    }

    async function loadNegotiationChain(offerId) {
        if (!offerId) return;
        
        try {
            const chain = await negotiationManager.getNegotiationChain(offerId);
            currentNegotiationChain.set(chain);
        } catch (error) {
            console.error('Error loading negotiation chain:', error);
            currentNegotiationChain.set([]);
        }
    }

    async function loadApproval(offerId) {
        if (!offerId) return;
        
        try {
            approval = await negotiationManager.getOfferApproval(offerId);
        } catch (error) {
            console.error('Error loading approval:', error);
            approval = null;
        }
    }

    onMount(() => {
        scrollToBottom();
    });

    // Nur loadApproval aufrufen, wenn $selectedOffer existiert
    $: if ($selectedOffer) {
        loadApproval($selectedOffer.id);
    }
</script>

<div class="scrollable-container">
    {#if !$selectedOffer}
        <div class="centered-message">
            Select an offer to view the negotiation
        </div>
    {:else if $currentNegotiationChain.length === 0}
        <div class="centered-message">
            Loading negotiation...
        </div>
    {:else}
        <div class="scrollable-content custom-scrollbar bubbles-container" bind:this={bubblesContainer}>
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
