<script>
    import { negotiationManager } from '../../../backend/NegotiationManager.js';
    import ApplicationModal from '../../Modals/ApplicationModal.svelte';
    import { nostrManager } from '../../../backend/NostrManagerStore.js';
    import { selectedOffer } from './negotiationStore';
    import { onMount } from 'svelte';

    export let offer;
    export let approval;

    onMount(async () => {
        console.log("approval", approval);
    });

    let showCounterModal = false;

    function handleCounterOffer() {
        showCounterModal = true;
    }

    async function handleDecline() {
        if (!offer) return;
        await negotiationManager.declineOffer("Offer declined", $selectedOffer.id);
    }

    async function handleCreateContract() {
        if (!offer || !approval) return;
        // TODO: Implement contract creation
        console.log("Creating contract for offer:", offer.id);
    }

    // Determine if we can create a contract (offer is approved)
    $: canCreateContract = approval?.tags.find(t => t[0] === 'status')?.[1] === 'approved';

    // Determine if the offer is already declined
    $: isDeclined = approval?.tags.find(t => t[0] === 'status')?.[1] === 'declined';

    // Determine if we can make a counter offer (latest offer is not from us)
    $: canMakeCounterOffer = offer && $nostrManager?.publicKey !== offer.pubkey;
</script>

{#if showCounterModal}
    <ApplicationModal 
        jobId={offer.tags.find(t => t[0] === 'e' && t[3] === 'job')?.[1]}
        mode="counter"
        existingApplication={offer}
        role="io"
        on:close={() => showCounterModal = false}
        on:success={() => showCounterModal = false}
    />
{/if}

<div class="interaction-bar">
    {#if !isDeclined}
        {#if !canCreateContract}
            {#if canMakeCounterOffer}
                <button class="counter-btn" on:click={handleCounterOffer}>
                    Counter offer
                </button>
            {/if}
        {:else }
            <button class="contract-btn" on:click={handleCreateContract}>
                Create contract
            </button>
        {/if}
    {/if}
    <button class="decline-btn" on:click={handleDecline}>
        Decline
    </button>
</div>

<style>
    .interaction-bar {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .counter-btn {
        background-color: #223d6d;
        color: white;
    }

    .counter-btn:hover {
        background-color: #1a2f53;
    }

    .decline-btn {
        background-color: #ef4444;
        color: white;
    }

    .decline-btn:hover {
        background-color: #dc2626;
    }

    .contract-btn {
        background-color: #22c55e;
        color: white;
    }

    .contract-btn:hover {
        background-color: #16a34a;
    }
</style>
