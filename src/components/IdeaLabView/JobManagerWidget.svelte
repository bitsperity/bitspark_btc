<script>
    import { onMount, onDestroy } from "svelte";
    import { jobManager } from '../../backend/JobManager.js';
    import { nostrManager } from '../../backend/NostrManagerStore.js';
    import { nostrCache } from '../../backend/NostrCacheStore.js';
    import { Link } from 'svelte-routing';
  
    export let ideaID;
    
    let pendingJobs = [];
    let approvedJobs = [];
    let declinedJobs = [];
    
    $: jobSections = [
      { title: 'Pending Jobs', jobs: pendingJobs, type: 'pending' },
      { title: 'Approved Jobs', jobs: approvedJobs, type: 'approved' },
      { title: 'Declined Jobs', jobs: declinedJobs, type: 'declined' }
    ];
  
    let unsubscribe = nostrCache.subscribe(async () => {
      await fetchAllJobs();
    });
  
    onMount(() => {
      initialize();
    });
  
    async function initialize() {
      jobManager.subscribeToJob(ideaID);
      await fetchAllJobs();
    }
  
    async function fetchAllJobs() {
      try {
        const allJobs = await jobManager.getJobsByIdea(ideaID);
        console.log('Fetched jobs:', allJobs);
        [pendingJobs, approvedJobs, declinedJobs] = await sortJobsByStatus(allJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    }
  
    async function sortJobsByStatus(jobs) {
      const creatorPubkey = await jobManager.getIdeaCreatorPubkey(ideaID);
      const sorted = await Promise.all(jobs.map(async (job) => {
        const status = await jobManager.getApprovalStatus(job.id, creatorPubkey);
        return { ...job, status };
      }));
  
      return [
        sorted.filter(job => job.status === "pending"),
        sorted.filter(job => job.status === "approved"),
        sorted.filter(job => job.status === "declined")
      ];
    }
  
    async function handleApproval(jobId, isApproved) {
      try {
        await jobManager.handleApproval(jobId, ideaID, isApproved);
        await fetchAllJobs();
      } catch (error) {
        console.error('Error handling approval:', error);
      }
    }
  
    onDestroy(() => {
      unsubscribe();
      jobManager.cleanup();
    });
  </script>
  
  <div class="job-manager">
    {#each jobSections as section}
      {#if section.jobs.length > 0}
        <div class="section">
          <div class="section-header">
            <h3>{section.title}</h3>
            <span class="badge">{section.jobs.length}</span>
          </div>
          
          <div class="job-grid">
            {#each section.jobs as job (job.id)}
              <div class="job-card" class:interactive={section.type === 'pending'}>
                <Link to="/job/{job.id}" class="job-content">
                  <h4>{job.title}</h4>
                  
                  {#if job.languages?.length}
                    <div class="tags">
                      {#each job.languages as lang}
                        <span class="tag">{lang}</span>
                      {/each}
                    </div>
                  {/if}
                  <div style="height: 10px;"></div>
                  {#if job.categories?.length}
                    <div class="tags">
                      {#each job.categories as cat}
                        <span class="tag">{cat}</span>
                      {/each}
                    </div>
                  {/if}
                </Link>
  
                {#if section.type === 'pending'}
                  <div class="actions">
                    <button class="btn primary" on:click={() => handleApproval(job.id, true)}>
                      <i class="fas fa-check"></i>
                      Accept
                    </button>
                    <button class="btn secondary" on:click={() => handleApproval(job.id, false)}>
                      <i class="fas fa-times"></i>
                      Decline
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
  
  <style>
    .job-manager {
      background: var(--surface-color, #fff);
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
  
    .section {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
  
    .section:last-child {
      border-bottom: none;
    }
  
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
  
    .section-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary, #111827);
      margin: 0;
    }
  
    .badge {
      background: var(--surface-secondary, #f3f4f6);
      color: var(--text-secondary, #6b7280);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  
    .job-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  
    .job-card {
      background: var(--surface-elevated, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
  
    .job-card.interactive:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
  
    .job-content {
      padding: 1.25rem;
      text-decoration: none;
      display: block;
    }
  
    h4 {
      color: var(--text-primary, #111827);
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
  
    .abstract {
      color: var(--text-secondary, #6b7280);
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
  
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  
    .tag {
      background: var(--surface-secondary, #f3f4f6);
      color: var(--text-secondary, #6b7280);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }
  
    .actions {
      padding: 1rem;
      border-top: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      gap: 0.75rem;
    }
  
    .btn {
      flex: 1;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
  
    .btn.primary {
      background: var(--primary-color, #f7931a);
      color: white;
      border: none;
    }
  
    .btn.primary:hover {
      background: var(--primary-dark, #e17f0e);
    }
  
    .btn.secondary {
      background: white;
      color: var(--text-secondary, #6b7280);
      border: 1px solid var(--border-color, #e5e7eb);
    }
  
    .btn.secondary:hover {
      background: var(--surface-secondary, #f3f4f6);
    }
  </style>