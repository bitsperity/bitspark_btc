<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { nostrManager } from '../../backend/NostrManagerStore.js';
  import { developerManager } from '../../backend/DeveloperManager.js';
  import { ideaOwnerManager } from '../../backend/IdeaOwnerManager.js';

  export let jobId;
  export let mode = 'initial'; // 'initial' oder 'counter'
  export let existingApplication = null;
  export let role = 'dev'; // 'dev' oder 'io'

  const dispatch = createEventDispatcher();

  // Debug: Zeige existingApplication
  $: if (existingApplication) {
    console.log('=== Existing Application ===');
    console.log('ID:', existingApplication.id);
    console.log('Content:', existingApplication.content);
    console.log('PubKey:', existingApplication.pubkey);
    console.log('Original PubKey:', existingApplication.originalEvent?.pubkey);
    console.log('Tags:', existingApplication.tags);
    console.log('========================');
  }

  // Default Werte aus existingApplication übernehmen
  let bid = existingApplication?.tags.find(t => t[0] === 'bid')?.[1] || '';
  let duration = existingApplication?.tags.find(t => t[0] === 'duration')?.[1] || '';
  let startDate = existingApplication?.tags.find(t => t[0] === 'startDate')?.[1] || '';
  let termsOfAgreement = existingApplication?.tags.find(t => t[0] === 'termsOfAgreement')?.[1] || '';
  let description = existingApplication?.content || '';

  async function handleSubmit() {
    if (!$nostrManager) return;

    try {
      // Debug: Zeige die Werte die gesendet werden
      console.log('=== Submitting Counter Offer ===');
      console.log('Mode:', mode);
      console.log('Role:', role);
      console.log('JobID:', jobId);
      console.log('Description:', description);
      console.log('Bid:', bid);
      console.log('Duration:', duration);
      console.log('StartDate:', startDate);
      console.log('Terms:', termsOfAgreement);
      console.log('PrevOffer:', existingApplication?.id);
      console.log('Recipient:', existingApplication?.pubkey);
      console.log('========================');

      // Konvertiere bid und duration zu Zahlen
      const numericBid = parseInt(bid, 10);
      const numericDuration = parseInt(duration, 10);

      if (role === 'dev') {
        // Für Dev: Immer submitOffer verwenden, nur die Parameter unterscheiden sich
        console.log('Creating Dev Offer...');
        const offer = await developerManager.submitOffer(
          description,
          jobId,
          numericBid,
          numericDuration,
          startDate,
          termsOfAgreement,
          mode === 'counter' ? existingApplication?.id : null, // prev_offer nur bei counter
          mode === 'counter' ? existingApplication?.pubkey : null // recipient nur bei counter
        );
        console.log('Created Dev Offer:', offer);
      } else {
        // Counter Offer vom IO
        console.log('Creating IO Counter Offer...');
        const offer = await ideaOwnerManager.submitOffer(
          description,
          jobId,
          numericBid,
          numericDuration,
          startDate,
          termsOfAgreement,
          existingApplication.id,
          existingApplication.pubkey
        );
        console.log('Created IO Counter Offer:', offer);
      }

      dispatch('success');
    } catch (error) {
      console.error('Fehler beim Erstellen des Angebots:', error);
      console.error('Error Stack:', error.stack);
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" transition:fade>
  <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
    <!-- Header -->
    <div class="p-6 border-b">
      <h2 class="text-2xl font-semibold">
        {#if mode === 'initial'}
          Bewerbung einreichen
        {:else}
          Gegenangebot erstellen
        {/if}
      </h2>
    </div>

    <!-- Content -->
    <div class="p-6">
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Beschreibung -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Beschreibung
          </label>
          <textarea
            id="description"
            bind:value={description}
            rows="4"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Beschreiben Sie Ihr Angebot..."
            required
          ></textarea>
        </div>

        <!-- Preis und Dauer -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="bid" class="block text-sm font-medium text-gray-700 mb-1">
              Preis (in sats)
            </label>
            <input
              type="number"
              id="bid"
              bind:value={bid}
              min="0"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">
              Dauer (in Tagen)
            </label>
            <input
              type="number"
              id="duration"
              bind:value={duration}
              min="1"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <!-- Startdatum -->
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
            Startdatum
          </label>
          <input
            type="date"
            id="startDate"
            bind:value={startDate}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <!-- Vertragsbedingungen -->
        <div>
          <label for="terms" class="block text-sm font-medium text-gray-700 mb-1">
            Vertragsbedingungen
          </label>
          <textarea
            id="terms"
            bind:value={termsOfAgreement}
            rows="3"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Spezielle Bedingungen oder Vereinbarungen..."
          ></textarea>
        </div>
      </form>
    </div>

    <!-- Footer -->
    <div class="p-6 border-t bg-gray-50 flex justify-end gap-4">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        on:click={handleClose}
      >
        Abbrechen
      </button>
      <button
        type="submit"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        on:click={handleSubmit}
      >
        {mode === 'initial' ? 'Bewerbung senden' : 'Gegenangebot senden'}
      </button>
    </div>
  </div>
</div> 