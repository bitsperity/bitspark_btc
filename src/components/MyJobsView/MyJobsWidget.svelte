<script>
  import { nostrCache } from '../../backend/NostrCacheStore.js';
  import { communityJobManager } from '../../backend/CommunityJobManager.js';
  import MyJobCard from './MyJobCard.svelte';

  let myJobs = [];

  async function fetchMyJobs() {
    myJobs = await communityJobManager.getMyDeveloperJobs();
  }

  // Auf Cache-Änderungen reagieren
  $: $nostrCache, fetchMyJobs();
</script>

<section class="section">
  <div class="section-header">
    <h3>Meine Jobs</h3>
    {#if myJobs.length > 0}
      <span class="badge">{myJobs.length}</span>
    {/if}
  </div>

  {#if myJobs.length > 0}
    <div class="jobs">
      {#each myJobs as job}
        <MyJobCard {job} />
      {/each}
    </div>
  {:else}
    <p class="no-jobs">Keine Jobs gefunden</p>
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

  .badge {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
  }

  .jobs {
    display: grid;
    gap: 1rem;
  }

  .no-jobs {
    text-align: center;
    color: #6b7280;
  }
</style> 