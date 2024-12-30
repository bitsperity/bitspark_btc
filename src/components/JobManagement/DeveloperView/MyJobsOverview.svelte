# New File
<script>
  import { onMount } from 'svelte';
  import { developerManager } from '../../../backend/DeveloperManager.js';
  import { NOSTR_KIND_GIFT_WRAP } from '../../../constants/nostrKinds.js';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';
  import { nostrCache } from '../../../backend/NostrCacheStore.js';
  import JobCard from '../shared/JobCard.svelte';
  import ThreadList from '../shared/ThreadList.svelte';
  import ApplicationModal from '../../Modals/ApplicationModal.svelte';

  let myApplications = [];
  let selectedJobId = null;
  let showApplicationModal = false;
  let selectedOffer = null;

  // Reaktiv auf Cache-Änderungen reagieren
  $: if ($nostrCache) {
    loadApplications();
  }

  $: selectedJob = myApplications.find(a => a.job.id === selectedJobId);

  // Debug Logging
  $: if (myApplications.length > 0) {
    console.log('=== Meine Bewerbungen ===');
    myApplications.forEach(app => {
      console.log(`Job: ${app.job.id}`);
      console.log('Offer:', app.offer);
      console.log('Status:', app.status);
      console.log('------------------------');
    });
  }

  async function loadApplications() {
    const applications = await developerManager.getMyApplications();
    if (applications && applications.length > 0) {
      myApplications = applications;
    }
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
    <h2 class="text-2xl font-semibold mb-4">Meine Bewerbungen</h2>
    
    {#if myApplications.length > 0}
      <div class="space-y-4">
        {#each myApplications as application}
          <div 
            class="p-4 rounded-lg border cursor-pointer transition-colors duration-200 {selectedJobId === application.job.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}"
            on:click={() => handleJobSelect({ detail: { jobId: application.job.id } })}
            on:keydown={(e) => e.key === 'Enter' && handleJobSelect({ detail: { jobId: application.job.id } })}
            role="button"
            tabindex="0"
          >
            <h3 class="font-medium">
              {application.job.tags.find(t => t[0] === 'name')?.[1] || 'Unbenannter Job'}
            </h3>
            <div class="text-sm text-gray-500 mt-1">
              Status: {application.status}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8">
        <p class="text-gray-600">
          Du hast dich noch auf keine Jobs beworben.
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
        threads={[{
          id: selectedJob.offer.id,
          initialOffer: selectedJob.offer,
          counterOffers: [],
          status: selectedJob.status,
          currentActor: 'dev'
        }]}
        role="dev"
        on:counterOffer={handleCounterOffer}
      />
    {:else}
      <div class="h-full flex items-center justify-center">
        <p class="text-gray-500">Wähle eine Bewerbung aus der Liste aus</p>
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
    role="dev"
    on:success={() => {
      showApplicationModal = false;
      selectedOffer = null;
      loadApplications();
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