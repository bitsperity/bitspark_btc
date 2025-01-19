<script>
  import { createEventDispatcher } from 'svelte';
  
  export let job;
  export let currentOffer;
  
  const dispatch = createEventDispatcher();
  
  $: showInitialApply = !currentOffer;
  $: isMyOffer = currentOffer?.pubkey === $nostrManager?.publicKey;

  function handleAccept() {
    dispatch('accept', { job, offer: currentOffer });
  }

  function handleDecline() {
    dispatch('decline', { job, offer: currentOffer });
  }

  function handleCounterOffer() {
    dispatch('counterOffer', { job, previousOffer: currentOffer });
  }

  function handleApply() {
    dispatch('apply', { job });
  }
</script>

<div class="flex gap-3 justify-end">
  {#if showInitialApply}
    <button
      on:click={handleApply}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Bewerben
    </button>
  {:else if isMyOffer}
    <!-- Warte auf IO Antwort -->
    <span class="text-gray-600 italic">
      Warte auf Antwort...
    </span>
  {:else}
    <button
      on:click={handleAccept}
      class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
    >
      Akzeptieren
    </button>
    <button
      on:click={handleCounterOffer}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Gegenangebot
    </button>
    <button
      on:click={handleDecline}
      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Ablehnen
    </button>
  {/if}
</div>

<style>
  button {
    font-weight: 500;
    transition: all 0.2s;
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  button:active {
    transform: translateY(0);
  }
</style> 