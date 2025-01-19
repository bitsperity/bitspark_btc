# Replace File
<script>
  import { onMount } from 'svelte';
  import { developerManager } from '../../../backend/DeveloperManager.js';
  import JobsOverviewBase from '../shared/JobsOverviewBase.svelte';

  let jobsWithHistory = [];

  async function loadJobs() {
    const applications = await developerManager.getMyApplications();
    if (applications && applications.length > 0) {
      jobsWithHistory = applications;
    }
  }
</script>

<JobsOverviewBase
  role="dev"
  {jobsWithHistory}
  {loadJobs}
/> 