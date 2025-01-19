<script>
  import { onMount } from 'svelte';
  import { communityJobManager } from '../../../backend/CommunityJobManager.js';
  import { ideaOwnerManager } from '../../../backend/IdeaOwnerManager.js';
  import JobsOverviewBase from '../shared/JobsOverviewBase.svelte';

  export let ideaId;

  let jobsWithHistory = [];

  async function loadJobs() {
    const history = await communityJobManager.getJobHistory(ideaId, null, {
      getPending: true,
      getAdvertised: true,
      getSigned: true
    });
    
    if (history && history.length > 0) {
      jobsWithHistory = history;
    }
  }

  onMount(async () => {
    // Subscribe auf neue Jobs
    ideaOwnerManager.subscribeToJobsByIdea(ideaId);
  });
</script>

<JobsOverviewBase
  role="io"
  {jobsWithHistory}
  {loadJobs}
/> 