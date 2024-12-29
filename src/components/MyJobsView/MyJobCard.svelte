<script>
  import { nostrCache } from '../../backend/NostrCacheStore.js';
  import { communityJobManager } from '../../backend/CommunityJobManager.js';
  import { socialMediaManager } from '../../backend/SocialMediaManager.js';
  import ProfileImg from '../ProfileImg.svelte';

  export let job;
  let ideaOwnerProfile = null;

  async function fetchIdeaOwnerProfile() {
    if (job.ideaOwner) {
      ideaOwnerProfile = await socialMediaManager.getProfile(job.ideaOwner);
    }
  }

  $: if (job) {
    fetchIdeaOwnerProfile();
  }
</script>

<div class="job-card">
  <div class="header">
    <div class="title">
      <h4>{job.tags.find(t => t[0] === 'name')?.[1] || 'Unbenannter Job'}</h4>
      {#if ideaOwnerProfile}
        <div class="idea-owner">
          <ProfileImg profile={ideaOwnerProfile} />
          <span>{ideaOwnerProfile.name || job.ideaOwner}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="content">
    <p>{job.content}</p>
  </div>

  <div class="footer">
    <div class="tags">
      {#each job.tags.filter(t => t[0] === 'l') as [_, lang]}
        <span class="tag">{lang}</span>
      {/each}
    </div>
  </div>
</div>

<style>
  .job-card {
    background: var(--surface-2);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .title {
    flex-grow: 1;
  }

  .title h4 {
    margin: 0;
    color: var(--text-1);
  }

  .idea-owner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    color: var(--text-2);
  }

  .content {
    margin: 1rem 0;
    color: var(--text-1);
  }

  .footer {
    margin-top: 1rem;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tag {
    background: var(--surface-3);
    color: var(--text-2);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
  }
</style> 