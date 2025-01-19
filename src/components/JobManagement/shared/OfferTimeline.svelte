<script>
  import { createEventDispatcher } from 'svelte';
  import { NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT, NOSTR_KIND_OFFER } from '../../../constants/nostrKinds.js';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';

  export let offers = [];
  export let currentOffer;
  export let role = 'io'; // 'io' oder 'dev'

  const dispatch = createEventDispatcher();

  $: sortedOffers = [...offers].sort((a, b) => a.created_at - b.created_at);
  $: hasContract = offers.some(e => e.kind === NOSTR_KIND_CONTRACT);
  
  // Prüfen ob das aktuelle Offer vom IO oder Dev kommt
  $: isCurrentOfferFromIO = currentOffer?.pubkey === $nostrManager?.publicKey && role === 'io';
  $: isCurrentOfferFromDev = currentOffer?.pubkey !== $nostrManager?.publicKey && role === 'dev';
  
  function getOfferStatus(offer) {
    if (hasContract) return 'signed';
    
    const approval = offers.find(e => 
      e.kind === NOSTR_KIND_APPROVAL && 
      e.tags.some(t => t[0] === 'e' && t[1] === offer.id)
    );
    
    if (approval) {
      const status = approval.tags.find(t => t[0] === 'status')?.[1];
      return status || 'pending';
    }
    
    return 'pending';
  }

  function handleAction(action, offer) {
    dispatch(action, { offer });
  }

  // Prüfen ob ein Contract erstellt werden kann
  $: canCreateContract = role === 'io' && 
                        currentOffer && 
                        !isCurrentOfferFromIO && 
                        getOfferStatus(currentOffer) === 'approved';

  // Hilfsfunktionen für Tag-Extraktion
  function getTagValue(offer, tagName) {
    return offer.tags.find(t => t[0] === tagName)?.[1];
  }

  function getReferencedEventId(offer, marker) {
    return offer.tags.find(t => t[0] === 'e' && t[3] === marker)?.[1];
  }

  function getRecipient(offer) {
    return offer.tags.find(t => t[0] === 'p')?.[1];
  }

  function isOfferForMe(offer) {
    const recipient = getRecipient(offer);
    return recipient === $nostrManager?.publicKey;
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE');
    } catch {
      return dateStr || 'Nicht angegeben';
    }
  }
</script>

<div class="space-y-4">
  {#each offers as offer, index}
    <div class="flex items-start gap-4 {index < offers.length - 1 ? 'pb-4 border-b' : ''}">
      <!-- Zeitstempel -->
      <div class="w-24 text-sm text-gray-500">
        {new Date(offer.created_at * 1000).toLocaleString()}
      </div>

      <!-- Angebot -->
      <div class="flex-1">
        <div class="bg-white p-4 rounded-lg shadow-sm">
          <!-- Absender -->
          <div class="text-sm font-medium mb-2">
            {offer.pubkey === $nostrManager?.publicKey ? 'Du' : `${offer.pubkey.slice(0,8)}...`}
          </div>

          <!-- Nachricht -->
          <p class="text-gray-700 mb-4">{offer.content}</p>

          <!-- Details -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Angebot:</span>
              <span class="font-medium">{offer.tags.find(t => t[0] === 'bid')?.[1] || '0'} sats</span>
            </div>
            <div>
              <span class="text-gray-500">Dauer:</span>
              <span class="font-medium">{offer.tags.find(t => t[0] === 'duration')?.[1] || '0'} Tage</span>
            </div>
            <div>
              <span class="text-gray-500">Start:</span>
              <span class="font-medium">{offer.tags.find(t => t[0] === 'startDate')?.[1] || 'Nicht angegeben'}</span>
            </div>
          </div>

          <!-- Bedingungen -->
          <div class="mt-4 text-sm">
            <span class="text-gray-500">Bedingungen:</span>
            <p class="mt-1">{offer.tags.find(t => t[0] === 'termsOfAgreement')?.[1] || 'Keine Bedingungen'}</p>
          </div>

          <!-- Aktionen -->
          {#if index === offers.length - 1 && offer.pubkey !== $nostrManager?.publicKey}
            <div class="mt-4 flex gap-2">
              <button 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                on:click={() => dispatch('counterOffer', { offer })}
              >
                Gegenangebot
              </button>
              <button 
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                on:click={() => dispatch('approve', { offer })}
              >
                Annehmen
              </button>
              <button 
                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                on:click={() => dispatch('decline', { offer })}
              >
                Ablehnen
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .prose {
    max-width: none;
  }
</style> 