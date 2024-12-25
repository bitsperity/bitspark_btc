<!-- ActiveJobsSection.svelte -->
<script>
  import { onMount } from "svelte";
  import { ideaOwnerManager } from "../../backend/IdeaOwnerManager.js";
  import { nostrCache } from "../../backend/NostrCacheStore.js";
  import { NOSTR_KIND_JOB } from "../../constants/nostrKinds.js";
  import JobCard from "./JobCard.svelte";

  export let ideaId;
  let activeJobs = [];

  async function fetchActiveJobs() {
    if (!ideaId) return;

    // Hole zuerst die Idea um den Creator zu bekommen
    const ideaEvent = await $nostrCache.getEventById(ideaId);
    if (!ideaEvent) {
      console.error('Idea not found:', ideaId);
      return;
    }

    // Hole alle Jobs für diese Idea
    const events = await $nostrCache.getEventsByCriteria({
      kinds: [NOSTR_KIND_JOB],
      "#e": [ideaId]
    });

    // Nur Jobs die:
    // 1. Diese spezifische Idea als direktes Event-Tag haben
    // 2. Vom IO selbst erstellt ODER vom IO republished wurden
    activeJobs = events
      .filter(event => {
        // Prüfe ob der Job wirklich zu dieser Idea gehört
        const ideaTag = event.tags.find(t => t[0] === 'e' && t[1] === ideaId);
        if (!ideaTag) return false;

        // Prüfe ob der Job vom IO ist oder republished wurde
        const isCreator = event.pubkey === ideaEvent.pubkey;
        const isRepublished = event.tags.some(t => t[0] === 'p');
        return isCreator || isRepublished;
      })
      .map(transformJob);
  }

  function transformJob(event) {
    const tags = event.tags.reduce(
      (tagObj, [key, value]) => ({ ...tagObj, [key]: value }),
      {}
    );

    // Finde den Original-Ersteller falls republished
    const originalCreator = event.tags.find(t => t[0] === 'p')?.[1];

    return {
      id: event.id,
      title: tags.name || "N/A",
      abstract: event.content || "",
      languages: event.tags.filter(t => t[0] === 'l').map(t => t[1]),
      categories: event.tags.filter(t => t[0] === 'c').map(t => t[1]),
      createdAt: event.created_at,
      pubkey: event.pubkey,
      originalCreator
    };
  }

  // Subscribe zu Jobs wenn die Komponente mounted
  onMount(async () => {
    if (ideaId) {
      await ideaOwnerManager.subscribeToJobsByIdea(ideaId);
    }
  });

  $: if ($nostrCache && ideaId) {
    fetchActiveJobs();
  }
</script>

<section class="section">
  <div class="section-header">
    <h3>Aktive Jobs</h3>
    {#if activeJobs.length > 0}
      <span class="badge">{activeJobs.length}</span>
    {/if}
  </div>

  {#if activeJobs.length === 0}
    <div class="empty-state">
      <p>Keine aktiven Jobs. Erstellen Sie einen Job oder republishen Sie Community Jobs.</p>
    </div>
  {:else}
    <div class="job-grid">
      {#each activeJobs as job (job.id)}
        <JobCard 
          {job}
          showCreator={!!job.originalCreator}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .section {
    padding: 2rem;
    background: white;
    border-radius: 1.25rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .section-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #4a5568;
    margin: 0;
  }

  .badge {
    background: #ebf4ff;
    color: #2c5282;
    padding: 0.25rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #718096;
    background: #f7fafc;
    border-radius: 1rem;
    margin: 1rem 0;
  }

  .empty-state p {
    font-size: 1rem;
    line-height: 1.6;
  }

  .job-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    padding: 1rem 0;
  }

  @media (max-width: 640px) {
    .job-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 