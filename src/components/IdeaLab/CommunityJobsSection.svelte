<!-- CommunityJobsSection.svelte -->
<script>
  import { onMount } from "svelte";
  import { ideaOwnerManager } from "../../backend/IdeaOwnerManager.js";
  import { nostrCache } from "../../backend/NostrCacheStore.js";
  import { NOSTR_KIND_JOB } from "../../constants/nostrKinds.js";
  import JobCard from "./JobCard.svelte";

  export let ideaId;
  let communityJobs = [];

  async function fetchCommunityJobs() {
    if (!ideaId) return;

    const events = await $nostrCache.getEventsByCriteria({
      kinds: [NOSTR_KIND_JOB],
      "#e": [ideaId]
    });

    const ideaEvent = await $nostrCache.getEventById(ideaId);
    if (!ideaEvent) return;

    // Nur Jobs die:
    // 1. NICHT vom IO erstellt wurden
    // 2. Noch NICHT republished wurden (kein 'p' tag)
    communityJobs = events
      .filter(event => 
        event.pubkey !== ideaEvent.pubkey && // Nicht vom IO
        !event.tags.some(t => t[0] === 'p') // Noch nicht republished
      )
      .map(transformJob);
  }

  function transformJob(event) {
    const tags = event.tags.reduce(
      (tagObj, [key, value]) => ({ ...tagObj, [key]: value }),
      {}
    );

    return {
      id: event.id,
      title: tags.name || "N/A",
      abstract: event.content || "",
      languages: event.tags.filter(t => t[0] === 'l').map(t => t[1]),
      categories: event.tags.filter(t => t[0] === 'c').map(t => t[1]),
      createdAt: event.created_at,
      pubkey: event.pubkey
    };
  }

  async function handleRepublish(jobId) {
    try {
      const jobEvent = await $nostrCache.getEventById(jobId);
      if (!jobEvent) throw new Error('Job not found');

      await ideaOwnerManager.republishCommunityJob(jobEvent);
      await fetchCommunityJobs(); // Liste aktualisieren
    } catch (error) {
      console.error('Error republishing job:', error);
    }
  }

  $: if ($nostrCache && ideaId) {
    fetchCommunityJobs();
  }
</script>

<section class="section">
  <div class="section-header">
    <h3>Community Jobs</h3>
    {#if communityJobs.length > 0}
      <span class="badge">{communityJobs.length}</span>
    {/if}
  </div>

  {#if communityJobs.length === 0}
    <div class="empty-state">
      <p>Keine neuen Community Jobs verfügbar.</p>
    </div>
  {:else}
    <div class="job-grid">
      {#each communityJobs as job (job.id)}
        <JobCard 
          {job}
          actionLabel="Republish"
          onAction={() => handleRepublish(job.id)}
          showCreator={true}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .section {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .section-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .badge {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .job-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
</style> 