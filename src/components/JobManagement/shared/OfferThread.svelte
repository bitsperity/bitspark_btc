<script>
  import { createEventDispatcher } from 'svelte';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';
  import ActionPanel from './ActionPanel.svelte';

  export let thread;
  export let role = 'io'; // 'io' oder 'dev'
  export let expanded = false;

  const dispatch = createEventDispatcher();

  $: currentOffer = thread.counterOffers[thread.counterOffers.length - 1] || thread.initialOffer;
  $: isMyTurn = (role === 'io' && currentOffer.pubkey !== $nostrManager?.publicKey) || 
                (role === 'dev' && currentOffer.pubkey === $nostrManager?.publicKey);

  function toggleExpand() {
    expanded = !expanded;
  }

  function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('de-DE');
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat('de-DE').format(amount);
  }
</script>

<!-- Thread Container -->
<div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:border-gray-200 transition-colors">
  <!-- Thread Header -->
  <div class="p-4 flex items-center justify-between cursor-pointer" on:click={toggleExpand}>
    <div class="flex items-center space-x-4">
      <!-- Status Indicator -->
      <div class="w-2 h-2 rounded-full {thread.status === 'pending' ? 'bg-blue-500' : 
                                       thread.status === 'approved' ? 'bg-green-500' :
                                       thread.status === 'declined' ? 'bg-red-500' : 
                                       'bg-purple-500'}">
      </div>
      
      <!-- Basic Info -->
      <div>
        <h3 class="font-medium">
          {thread.initialOffer.pubkey === $nostrManager?.publicKey ? 'Dein Angebot' : 'Angebot von ' + thread.initialOffer.pubkey.slice(0,8)}
        </h3>
        <p class="text-sm text-gray-500">
          {formatAmount(currentOffer.tags.find(t => t[0] === 'bid')?.[1])} sats • 
          {currentOffer.tags.find(t => t[0] === 'duration')?.[1]} Tage
        </p>
      </div>
    </div>

    <!-- Action Required Badge -->
    {#if isMyTurn && thread.status === 'pending'}
      <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
        Aktion erforderlich
      </span>
    {/if}
  </div>

  <!-- Expanded Content -->
  {#if expanded}
    <div class="border-t border-gray-100">
      <!-- Timeline -->
      <div class="p-4 space-y-4">
        {#each [thread.initialOffer, ...thread.counterOffers] as offer}
          <div class="flex space-x-4">
            <!-- Timeline Line -->
            <div class="w-0.5 bg-gray-200 relative">
              <div class="w-2 h-2 rounded-full bg-gray-400 absolute -left-[3px]"></div>
            </div>
            
            <!-- Offer Content -->
            <div class="flex-1">
              <div class="text-sm text-gray-500 mb-1">
                {formatDate(offer.created_at)}
              </div>
              <div class="bg-gray-50 rounded p-3">
                <div class="text-sm font-medium mb-2">
                  {offer.pubkey === $nostrManager?.publicKey ? 'Du' : offer.pubkey.slice(0,8)}
                </div>
                <p class="text-sm text-gray-700 mb-2">{offer.content}</p>
                <div class="text-sm text-gray-600 space-y-1">
                  <div>Angebot: {formatAmount(offer.tags.find(t => t[0] === 'bid')?.[1])} sats</div>
                  <div>Dauer: {offer.tags.find(t => t[0] === 'duration')?.[1]} Tage</div>
                  <div>Start: {offer.tags.find(t => t[0] === 'startDate')?.[1]}</div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Action Panel -->
      {#if thread.status === 'pending'}
        <div class="p-4 bg-gray-50 border-t border-gray-100">
          <ActionPanel 
            {role}
            {thread}
            {currentOffer}
            on:counterOffer
            on:accept
            on:decline
            on:createContract
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Ensure smooth animations */
  .transition-colors {
    transition-property: background-color, border-color;
    transition-duration: 150ms;
  }
</style> 