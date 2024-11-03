<!-- JobWidget.svelte -->

<script>
  import { onMount, onDestroy } from "svelte";
  import { Link } from 'svelte-routing';
  import JobModal from './Modals/JobModal.svelte';
  import { jobManager } from '../backend/JobManager.js';
  import { nostrManager } from '../backend/NostrManagerStore.js';

  export let ideaID;
  export let creatorPubKey;

  let jobs = [];
  let showJobModal = false;
  let isLoggedIn = false;

  onMount(() => {
    initialize();
  });

  async function initialize() {
    jobManager.subscribeToJob(ideaID);
    isLoggedIn = !!$nostrManager?.publicKey;
    await fetchJobs();
  }

  async function fetchJobs() {
    try {
      // Immer nur approved Jobs anzeigen
      const fetchedJobs = await jobManager.getApprovedJobsByIdea(ideaID);
      jobs = fetchedJobs.map(transformJob);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }

  function transformJob(job) {
    return {
      id: job.id,
      title: job.title || "N/A",
      description: job.description || "",
      createdAt: job.created_at,
      url: job.bannerUrl || "",
      pubkey: job.pubkey
    };
  }

  function handleJobSubmit() {
    fetchJobs(); // Aktualisiere die Job-Liste
    showJobModal = false;
  }

  onDestroy(() => {
    jobManager.cleanup();
  });
</script>

<div class="job-section">
  <div class="job-header">
    <h2 class="section-title">Jobs</h2>
    {#if isLoggedIn}
      <button 
        class="create-job-btn"
        on:click={() => showJobModal = true}
      >
        <i class="fas fa-plus-circle mr-2"></i>
        Create Job
      </button>
    {/if}
  </div>

  {#if showJobModal}
    <JobModal 
      {ideaID}
      on:close={() => showJobModal = false}
      on:submit={handleJobSubmit}
    />
  {/if}

  <div class="job-grid">
    {#each jobs as job (job.id)}
      <Link to={`/job/${job.id}`} class="job-card">
        <div class="job-card-inner">
          {#if job.url}
            <div class="job-image" style="background-image: url({job.url})" />
          {/if}
          <div class="job-content">
            <h3 class="job-title">{job.title}</h3>
            <p class="job-description">{job.description}</p>
          </div>
        </div>
      </Link>
    {/each}
  </div>
</div>

<style>
  .job-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }

  .create-job-btn {
    display: flex;
    align-items: center;
    background-color: #2c5282;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .create-job-btn:hover {
    background-color: #1a365d;
    transform: translateY(-1px);
  }

  .job-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 0.5rem;
  }

  .job-card {
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
  }

  .job-card:hover {
    transform: translateY(-4px);
  }

  .job-card-inner {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    height: 100%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.3s ease;
  }

  .job-card-inner:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .job-image {
    width: 100%;
    height: 140px;
    background-size: cover;
    background-position: center;
    border-bottom: 1px solid #e5e7eb;
  }

  .job-content {
    padding: 1rem;
  }

  .job-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .job-description {
    color: #6b7280;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  @media (max-width: 640px) {
    .job-grid {
      grid-template-columns: 1fr;
    }
    
    .job-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  }
</style>
