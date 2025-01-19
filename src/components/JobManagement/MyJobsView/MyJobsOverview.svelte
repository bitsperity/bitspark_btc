<script>
  import { onMount } from 'svelte';
  import { communityJobManager } from '../../../backend/CommunityJobManager.js';
  import { developerManager } from '../../../backend/DeveloperManager.js';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';
  import { nostrCache } from '../../../backend/NostrCacheStore.js';
  import { NOSTR_KIND_OFFER, NOSTR_KIND_GIFT_WRAP } from '../../../constants/nostrKinds.js';
  import JobCard from '../shared/JobCard.svelte';
  import OfferTimeline from '../shared/OfferTimeline.svelte';
  import ApplicationModal from '../../Modals/ApplicationModal.svelte';

  let jobs = [];
  let selectedJob = null;
  let offers = [];
  let currentOffer = null;
  let showApplicationModal = false;
  let applicationMode = 'apply';  // 'apply' oder 'counter'

  // Reaktiv auf Cache-Änderungen reagieren
  $: if ($nostrCache && $nostrManager) {
    loadJobs();
    if (selectedJob) {
      loadOffers(selectedJob.id);
    }
  }

  async function loadJobs() {
    try {
      // Lade meine Jobs
      const jobHistory = await communityJobManager.getJobHistory(
        null,
        $nostrManager.publicKey,
        {
          getPending: true,
          getAdvertised: true,
          getSigned: true
        }
      );
      
      if (jobHistory && jobHistory.length > 0) {
        jobs = jobHistory.map(j => j.job);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Jobs:', error);
    }
  }

  onMount(async () => {
    if ($nostrManager) {
      // Subscribe auf verschlüsselte Offers (GIFT_WRAP) die an uns gerichtet sind
      $nostrManager.subscribeToEvents({
        kinds: [NOSTR_KIND_GIFT_WRAP],
        "#p": [$nostrManager.publicKey]
      });
    }
  });

  async function loadOffers(jobId) {
    if (!jobId) return;

    try {
      const jobHistory = await communityJobManager.getJobHistory(null, null, {
        getPending: true,
        getAdvertised: true
      });
      
      const jobWithHistory = jobHistory.find(j => j.job.id === jobId);
      if (jobWithHistory) {
        // Nur nach normalen Offers suchen, da GIFT_WRAP bereits entschlüsselt wurde
        offers = jobWithHistory.history.filter(e => e.kind === NOSTR_KIND_OFFER) || [];
        offers.sort((a, b) => a.created_at - b.created_at);
        currentOffer = offers.length > 0 ? offers[offers.length - 1] : null;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Angebote:', error);
    }
  }

  function handleJobSelect(event) {
    const { jobId } = event.detail;
    selectedJob = jobs.find(j => j.id === jobId);
    if (selectedJob) {
      loadOffers(jobId);
    }
  }

  function handleApply() {
    applicationMode = 'apply';
    showApplicationModal = true;
  }

  function handleCounterOffer() {
    applicationMode = 'counter';
    showApplicationModal = true;
  }

  async function handleAccept(event) {
    const { offer } = event.detail;
    if (offer) {
      try {
        await developerManager.acceptOffer("Angebot akzeptiert", offer.originalEvent?.id || offer.id);
        await loadOffers(selectedJob.id);
      } catch (error) {
        console.error('Fehler beim Akzeptieren des Angebots:', error);
      }
    }
  }

  async function handleDecline(event) {
    const { offer } = event.detail;
    if (offer) {
      try {
        await developerManager.declineOffer("Angebot abgelehnt", offer.originalEvent?.id || offer.id);
        await loadOffers(selectedJob.id);
      } catch (error) {
        console.error('Fehler beim Ablehnen des Angebots:', error);
      }
    }
  }

  function getJobsByStatus(status) {
    if (!jobs) return [];
    
    switch(status) {
      case 'pending':
        return jobs.filter(j => !currentOffer || currentOffer.status === 'pending');
      case 'negotiation':
        return jobs.filter(j => currentOffer?.status === 'in_negotiation');
      case 'contracted':
        return jobs.filter(j => currentOffer?.status === 'contracted');
      default:
        return [];
    }
  }
</script>

<div class="space-y-8">
  <!-- Job Kategorien -->
  <div class="grid grid-cols-1 gap-8">
    <!-- Offene Bewerbungen -->
    <div>
      <h2 class="text-2xl font-semibold mb-4">Offene Bewerbungen</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#if getJobsByStatus('pending').length > 0}
          {#each getJobsByStatus('pending') as job (job.id)}
            <JobCard 
              {job}
              role="dev"
              currentOffer={selectedJob?.id === job.id ? currentOffer : null}
              on:select={handleJobSelect}
              on:apply={handleApply}
              on:accept={handleAccept}
              on:decline={handleDecline}
              on:counterOffer={handleCounterOffer}
            />
          {/each}
        {:else}
          <div class="col-span-2 text-center py-4">
            <p class="text-gray-600">Keine offenen Bewerbungen</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- In Verhandlung -->
    <div>
      <h2 class="text-2xl font-semibold mb-4">In Verhandlung</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#if getJobsByStatus('negotiation').length > 0}
          {#each getJobsByStatus('negotiation') as job (job.id)}
            <JobCard 
              {job}
              role="dev"
              currentOffer={selectedJob?.id === job.id ? currentOffer : null}
              on:select={handleJobSelect}
              on:accept={handleAccept}
              on:decline={handleDecline}
              on:counterOffer={handleCounterOffer}
            />
          {/each}
        {:else}
          <div class="col-span-2 text-center py-4">
            <p class="text-gray-600">Keine laufenden Verhandlungen</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Verträge -->
    <div>
      <h2 class="text-2xl font-semibold mb-4">Aktive Verträge</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#if getJobsByStatus('contracted').length > 0}
          {#each getJobsByStatus('contracted') as job (job.id)}
            <JobCard 
              {job}
              role="dev"
              currentOffer={selectedJob?.id === job.id ? currentOffer : null}
              on:select={handleJobSelect}
              showActions={false}
            />
          {/each}
        {:else}
          <div class="col-span-2 text-center py-4">
            <p class="text-gray-600">Keine aktiven Verträge</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Job Details mit Timeline -->
  {#if selectedJob}
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold mb-4">
        Verhandlungsverlauf
      </h3>
      <OfferTimeline 
        {offers}
        {currentOffer}
      />
    </div>
  {/if}
</div>

<!-- Modals -->
{#if showApplicationModal}
  <ApplicationModal
    jobId={selectedJob.id}
    mode={applicationMode}
    existingApplication={applicationMode === 'counter' ? currentOffer : null}
    on:success={() => {
      showApplicationModal = false;
      loadOffers(selectedJob.id);
    }}
    on:close={() => showApplicationModal = false}
  />
{/if} 