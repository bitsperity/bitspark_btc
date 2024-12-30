<script>
  import { createEventDispatcher } from 'svelte';
  import { NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT } from '../../../constants/nostrKinds.js';

  export let job;
  export let currentOffer;

  const dispatch = createEventDispatcher();

  $: canCounterOffer = currentOffer && !hasContract;
  $: canDecline = currentOffer && !hasContract;
  $: canCreateContract = currentOffer && !hasContract && hasApproval;

  $: hasContract = job?.history?.some(e => e.kind === NOSTR_KIND_CONTRACT) || false;
  $: hasApproval = currentOffer?.tags?.some(t => 
    t[0] === 'status' && t[1] === 'approved'
  ) || false;

  function handleCounterOffer() {
    dispatch('counterOffer', { job, offer: currentOffer });
  }

  function handleDecline() {
    dispatch('decline', { job, offer: currentOffer });
  }

  function handleCreateContract() {
    dispatch('createContract', { job, offer: currentOffer });
  }
</script>

<div class="flex gap-4">
  {#if canCounterOffer}
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      on:click={handleCounterOffer}
    >
      Gegenangebot
    </button>
  {/if}

  {#if canDecline}
    <button
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      on:click={handleDecline}
    >
      Ablehnen
    </button>
  {/if}

  {#if canCreateContract}
    <button
      class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      on:click={handleCreateContract}
    >
      Vertrag erstellen
    </button>
  {/if}

  {#if !currentOffer}
    <p class="text-gray-500">Keine Angebote vorhanden</p>
  {/if}

  {#if hasContract}
    <p class="text-green-600">Vertrag wurde bereits erstellt</p>
  {/if}
</div> 