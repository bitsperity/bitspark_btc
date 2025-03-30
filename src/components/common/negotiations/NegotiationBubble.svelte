<script>
    import { nostrManager } from '../../../backend/NostrManagerStore.js';

    export let offer;
    export let isInitial;

    $: isOwnMessage = offer.pubkey === $nostrManager?.publicKey;
    $: bid = offer.tags.find(t => t[0] === 'bid')?.[1];
    $: duration = offer.tags.find(t => t[0] === 'duration')?.[1];
    $: startDate = offer.tags.find(t => t[0] === 'startDate')?.[1];
    $: terms = offer.tags.find(t => t[0] === 'termsOfAgreement')?.[1];
</script>

<div class="bubble-container {isOwnMessage ? 'own' : 'other'}">
    <div class="bubble {isInitial ? 'initial' : ''}">
        <div class="bubble-header">
            {#if isInitial}
                <span class="badge">Initial Offer</span>
            {/if}
            <span class="bid">{bid} sats</span>
            <span class="duration">{duration} days</span>
        </div>
        
        <div class="bubble-content">
            <p class="message">{offer.content}</p>
            <div class="details">
                <p class="start-date">Start: {startDate}</p>
                <p class="terms">Terms: {terms}</p>
            </div>
        </div>
    </div>
</div>

<style>
    .bubble-container {
        display: flex;
        margin: 1rem 0;
    }

    .bubble-container.own {
        justify-content: flex-end;
    }

    .bubble {
        max-width: 80%;
        padding: 1rem;
        border-radius: 1rem;
        background-color: #f1f5f9;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .bubble-container.own .bubble {
        background-color: #223d6d;
        color: white;
    }

    .bubble.initial {
        border: 2px solid #223d6d;
    }

    .bubble-container.own .bubble.initial {
        border-color: white;
    }

    .bubble-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    .badge {
        background-color: #223d6d;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .bubble-container.own .badge {
        background-color: white;
        color: #223d6d;
    }

    .bubble-content {
        font-size: 0.875rem;
    }

    .details {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 0.75rem;
        opacity: 0.8;
    }

    .bubble-container:not(.own) .details {
        border-top-color: rgba(0, 0, 0, 0.1);
    }
</style>
