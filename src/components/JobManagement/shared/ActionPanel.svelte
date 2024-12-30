<script>
  import { createEventDispatcher } from 'svelte';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';

  export let role = 'io';
  export let thread;
  export let currentOffer;

  const dispatch = createEventDispatcher();

  // Permissions Matrix
  const actionMatrix = {
    io: {
      canAccept: false,
      canDecline: true,
      canCounter: true,
      canCreateContract: (thread) => thread.status === 'approved'
    },
    dev: {
      canAccept: true,
      canDecline: true,
      canCounter: true,
      canCreateContract: false
    }
  };

  $: permissions = actionMatrix[role];
  $: isMyOffer = currentOffer.pubkey === $nostrManager?.publicKey;
  $: canAct = !isMyOffer && thread.status === 'pending';
</script>

<div class="flex flex-wrap gap-2">
  <!-- Developer Actions -->
  {#if role === 'dev' && canAct}
    <button 
      class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      on:click={() => dispatch('accept', { offer: currentOffer })}
    >
      Annehmen
    </button>
    
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      on:click={() => dispatch('counterOffer', { offer: currentOffer })}
    >
      Gegenangebot
    </button>
    
    <button 
      class="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      on:click={() => dispatch('decline', { offer: currentOffer })}
    >
      Ablehnen
    </button>
  {/if}

  <!-- Idea Owner Actions -->
  {#if role === 'io' && canAct}
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      on:click={() => dispatch('counterOffer', { offer: currentOffer })}
    >
      Gegenangebot
    </button>
    
    <button 
      class="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      on:click={() => dispatch('decline', { offer: currentOffer })}
    >
      Ablehnen
    </button>

    {#if permissions.canCreateContract(thread)}
      <button 
        class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        on:click={() => dispatch('createContract', { offer: currentOffer })}
      >
        Vertrag erstellen
      </button>
    {/if}
  {/if}
</div>

<style>
  button {
    font-size: 14px;
    font-weight: 500;
  }
</style> 