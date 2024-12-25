<script>
  import { onMount } from "svelte";
  import { ideaOwnerManager } from "../../backend/IdeaOwnerManager.js";
  import { nostrCache } from "../../backend/NostrCacheStore.js";
  import { NOSTR_KIND_CONTRACT } from "../../constants/nostrKinds.js";
  import JobCard from "./JobCard.svelte";

  export let ideaId;
  let contracts = [];

  async function fetchContracts() {
    if (!ideaId) return;

    // Hole alle Contracts die mit Jobs dieser Idea verknüpft sind
    const events = await $nostrCache.getEventsByCriteria({
      kinds: [NOSTR_KIND_CONTRACT],
      "#e": [ideaId]
    });

    // Für jeden Contract den zugehörigen Job laden
    contracts = await Promise.all(
      events.map(async contract => {
        const jobId = contract.tags.find(t => t[0] === 'e' && t[2] === 'job')?.[1];
        if (!jobId) return null;

        const jobEvent = await $nostrCache.getEventById(jobId);
        if (!jobEvent) return null;

        return transformContract(contract, jobEvent);
      })
    );

    // Null-Werte filtern
    contracts = contracts.filter(Boolean);
  }

  function transformContract(contractEvent, jobEvent) {
    const jobTags = jobEvent.tags.reduce(
      (tagObj, [key, value]) => ({ ...tagObj, [key]: value }),
      {}
    );

    return {
      id: contractEvent.id,
      jobId: jobEvent.id,
      title: jobTags.name || "N/A",
      abstract: jobEvent.content || "",
      languages: jobEvent.tags.filter(t => t[0] === 'l').map(t => t[1]),
      categories: jobEvent.tags.filter(t => t[0] === 'c').map(t => t[1]),
      createdAt: contractEvent.created_at,
      pubkey: jobEvent.pubkey,
      status: 'active' // TODO: Payment Status hinzufügen
    };
  }

  async function handleReview(contractId) {
    // TODO: Review-Dialog implementieren
    console.log('Review contract:', contractId);
  }

  $: if ($nostrCache && ideaId) {
    fetchContracts();
  }
</script>

<section class="section">
  <div class="section-header">
    <h3>Aktive Verträge</h3>
    {#if contracts.length > 0}
      <span class="badge">{contracts.length}</span>
    {/if}
  </div>

  {#if contracts.length === 0}
    <div class="empty-state">
      <p>Keine aktiven Verträge.</p>
    </div>
  {:else}
    <div class="job-grid">
      {#each contracts as contract (contract.id)}
        <JobCard 
          job={contract}
          actionLabel="Review"
          onAction={() => handleReview(contract.id)}
          showCreator={true}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .section {
    padding: 2rem;
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