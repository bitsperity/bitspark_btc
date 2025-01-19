# New File
<script>
  import { onMount } from 'svelte';
  import { NOSTR_KIND_GIFT_WRAP } from '../../../constants/nostrKinds.js';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';
  import { nostrCache } from '../../../backend/NostrCacheStore.js';
  import JobCard from './JobCard.svelte';
  import ThreadList from './ThreadList.svelte';
  import ApplicationModal from '../../Modals/ApplicationModal.svelte';

  export let role = 'io'; // 'io' oder 'dev'
  export let jobsWithHistory = [];
  export let loadJobs;

  let selectedJobId = null;
  let showApplicationModal = false;
  let selectedOffer = null;

  // Reaktiv auf Cache-Änderungen reagieren
  $: if ($nostrCache) {
    loadJobs();
  }

  $: selectedJob = jobsWithHistory.find(j => j.job.id === selectedJobId);
  
  // Debug Logging
  $: if (jobsWithHistory.length > 0) {
    console.log(`=== Jobs (${role}) ===`);
    jobsWithHistory.forEach(jwh => {
      console.log(`Job: ${jwh.job.id}`);
      console.log('Tags:', jwh.job.tags);
      console.log('History:', jwh.history);
      console.log('Offer Chains:', jwh.offerChains);
      console.log('------------------------');
    });
  }

  onMount(async () => {
    if (!$nostrManager) return;
    
    // Subscribe auf verschlüsselte Offers (GIFT_WRAP) die an uns gerichtet sind
    $nostrManager.subscribeToEvents({
      kinds: [NOSTR_KIND_GIFT_WRAP],
      "#p": [$nostrManager.publicKey]
    });
  });

  function handleJobSelect(event) {
    const { jobId } = event.detail;
    selectedJobId = jobId;
  }

  async function handleCounterOffer(event) {
    const { offer } = event.detail;
    selectedOffer = offer;
    showApplicationModal = true;
  }
</script>

<div class="flex h-full">
  <!-- Linke Seite: Job-Liste -->
  <div class="w-1/3 border-r p-4 overflow-y-auto">
    <h2 class="text-2xl font-semibold mb-4">
      {role === 'io' ? 'Jobs' : 'Meine Bewerbungen'}
    </h2>
    
    {#if jobsWithHistory.length > 0}
      <div class="space-y-4">
        {#each jobsWithHistory as jobWithHistory}
          <div 
            class="p-4 rounded-lg border cursor-pointer transition-colors duration-200 {selectedJobId === jobWithHistory.job.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}"
            on:click={() => handleJobSelect({ detail: { jobId: jobWithHistory.job.id } })}
            on:keydown={(e) => e.key === 'Enter' && handleJobSelect({ detail: { jobId: jobWithHistory.job.id } })}
            role="button"
            tabindex="0"
          >
            <h3 class="font-medium">
              {jobWithHistory.job.tags.find(t => t[0] === 'name')?.[1] || 'Unbenannter Job'}
            </h3>
            <div class="text-sm text-gray-500 mt-1">
              {role === 'io' 
                ? `${jobWithHistory.offerChains?.length || 0} Bewerbungen`
                : `Status: ${jobWithHistory.status}`
              }
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8">
        <p class="text-gray-600">
          {role === 'io' 
            ? 'Keine Jobs für diese Idea gefunden.'
            : 'Du hast dich noch auf keine Jobs beworben.'
          }
        </p>
      </div>
    {/if}
  </div>

  <!-- Rechte Seite: Job-Details und Verhandlungen -->
  <div class="flex-1 p-4 overflow-y-auto">
    {#if selectedJob}
      <!-- Job Details -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">
          {selectedJob.job.tags.find(t => t[0] === 'name')?.[1] || 'Unbenannter Job'}
        </h2>
        
        <div class="prose max-w-none">
          <h3 class="text-lg font-medium mb-2">Beschreibung</h3>
          <p class="mb-4">{selectedJob.job.content || 'Keine Beschreibung verfügbar'}</p>

          <h3 class="text-lg font-medium mb-2">Anforderungen</h3>
          <p class="mb-4">
            {selectedJob.job.tags.find(t => t[0] === 'requirements')?.[1] || 'Keine Anforderungen angegeben'}
          </p>

          <div class="flex flex-wrap gap-2 mb-4">
            {#each selectedJob.job.tags.filter(t => t[0] === 'c') as category}
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                {category[1]}
              </span>
            {/each}
            {#each selectedJob.job.tags.filter(t => t[0] === 'l') as lang}
              <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                {lang[1]}
              </span>
            {/each}
          </div>
        </div>
      </div>

      <!-- Verhandlungen -->
      <ThreadList
        threads={role === 'io' ? selectedJob.offerChains : [{
          id: selectedJob.offer.id,
          initialOffer: selectedJob.offer,
          counterOffers: [],
          status: selectedJob.status,
          currentActor: role
        }]}
        {role}
        on:counterOffer={handleCounterOffer}
      />
    {:else}
      <div class="h-full flex items-center justify-center">
        <p class="text-gray-500">
          {role === 'io' 
            ? 'Wähle einen Job aus der Liste aus'
            : 'Wähle eine Bewerbung aus der Liste aus'
          }
        </p>
      </div>
    {/if}
  </div>
</div>

<!-- Modals -->
{#if showApplicationModal && selectedJob}
  <ApplicationModal
    jobId={selectedJob.job.id}
    mode="counter"
    existingApplication={selectedOffer}
    {role}
    on:success={() => {
      showApplicationModal = false;
      selectedOffer = null;
      loadJobs();
    }}
    on:close={() => {
      showApplicationModal = false;
      selectedOffer = null;
    }}
  />
{/if}

<style>
  .prose {
    max-width: none;
  }
</style> 