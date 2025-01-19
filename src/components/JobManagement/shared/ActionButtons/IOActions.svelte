<script>
  import { createEventDispatcher } from 'svelte';
  
  export let job;
  export let currentOffer;
  
  const dispatch = createEventDispatcher();
  
  $: canCreateContract = currentOffer?.tags.find(t => 
    t[0] === 'status' && t[1] === 'approved'
  );

  function handleCounterOffer() {
    dispatch('counterOffer', { job, previousOffer: currentOffer });
  }

  function handleDecline() {
    dispatch('decline', { job, offer: currentOffer });
  }

  function handleCreateContract() {
    dispatch('createContract', { job, offer: currentOffer });
  }
</script>

<div class="flex gap-3 justify-end">
  {#if currentOffer}
    {#if canCreateContract}
      <button
        on:click={handleCreateContract}
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        Vertrag erstellen
      </button>
    {:else}
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