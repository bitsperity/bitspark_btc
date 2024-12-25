<!-- JobCard.svelte -->
<script>
  import { Link } from 'svelte-routing';

  export let job;
  export let actionLabel = null;
  export let onAction = null;
  export let showCreator = false;
</script>

<div class="job-card">
  <Link to={`/job/${job.id}`} class="job-content">
    <div class="header">
      <h4>{job.title}</h4>
      {#if showCreator}
        <div class="creator-info">
          Erstellt von: {job.pubkey}
        </div>
      {/if}
    </div>

    <p class="abstract">{job.abstract}</p>

    {#if job.languages?.length || job.categories?.length}
      <div class="tags-container">
        {#if job.languages?.length}
          <div class="tags">
            {#each job.languages as lang}
              <span class="tag language">{lang}</span>
            {/each}
          </div>
        {/if}

        {#if job.categories?.length}
          <div class="tags">
            {#each job.categories as cat}
              <span class="tag category">{cat}</span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </Link>

  {#if actionLabel && onAction}
    <div class="actions">
      <button class="action-btn" on:click={onAction}>
        {actionLabel}
      </button>
    </div>
  {/if}
</div>

<style>
  .job-card {
    background: white;
    border-radius: 1.25rem;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 4px solid #ffffff;
  }

  .job-card:hover {
    transform: scale(1.02);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }

  .job-content {
    padding: 1.5rem;
    text-decoration: none;
    display: block;
    color: inherit;
  }

  .header {
    margin-bottom: 1rem;
  }

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4a5568;
    margin: 0;
    line-height: 1.4;
  }

  .creator-info {
    font-size: 0.875rem;
    color: #718096;
    margin-top: 0.5rem;
    font-style: italic;
  }

  .abstract {
    color: #4a5568;
    font-size: 0.9375rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .tags-container {
    margin-top: auto;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .tags:last-child {
    margin-bottom: 0;
  }

  .tag {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .tag.language {
    background: #ebf4ff;
    color: #2c5282;
  }

  .tag.category {
    background: #f0fff4;
    color: #2f855a;
  }

  .actions {
    padding: 1rem 1.5rem;
    background: #f7fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
  }

  .action-btn {
    background: #2c5282;
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: #2a4365;
    transform: translateY(-1px);
  }
</style> 