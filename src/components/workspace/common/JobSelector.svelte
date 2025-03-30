<script>
    import { currentJob, setJob } from "../../../stores/common/jobStore";
    import { onMount } from "svelte";
    import { nostrCache } from "../../../backend/NostrCacheStore";
    import { nostrManager } from "../../../backend/NostrManagerStore.js";
    import { NOSTR_KIND_JOB, NOSTR_KIND_OFFER } from "../../../constants/nostrKinds";

    let jobs = [];
    let initialJobSelection = true;
    let isLoading = true;

    async function fetchJobsWithMyOffers() {
        console.log("Fetching jobs with my offers");
        isLoading = true;
        
        if (!$nostrManager || !$nostrManager.publicKey) {
            console.error("No public key available - user not logged in");
            isLoading = false;
            return;
        }

        try {
            // 1. Get all offers authored by the current user
            const myOffers = await $nostrCache.getEventsByCriteria({
                kinds: [NOSTR_KIND_OFFER],
                authors: [$nostrManager.publicKey]
            });
            
            console.log("Found my offers:", myOffers.length);
            
            // 2. Extract job IDs from all the offers
            const jobIds = new Set();
            myOffers.forEach(offer => {
                const jobTags = offer.tags.filter(tag => tag[0] === 'e' && tag[3] === 'job');
                jobTags.forEach(tag => jobIds.add(tag[1]));
            });
            
            console.log("Found job IDs:", Array.from(jobIds));
            
            // 3. Fetch all the jobs
            let allJobs = [];
            if (jobIds.size > 0) {
                // Fetch jobs in batches to avoid overly large queries
                const jobIdsArray = Array.from(jobIds);
                const batchSize = 10;
                
                for (let i = 0; i < jobIdsArray.length; i += batchSize) {
                    const batch = jobIdsArray.slice(i, i + batchSize);
                    
                    const criteria = {
                        kinds: [NOSTR_KIND_JOB],
                        ids: batch
                    };
                    
                    const batchResults = await $nostrCache.getEventsByCriteria(criteria);
                    allJobs = [...allJobs, ...batchResults];
                }
            }
            
            console.log("Fetched jobs:", allJobs.length);
            
            // 4. Sort jobs by creation date (newest first)
            const sortedJobs = allJobs.sort((a, b) => b.created_at - a.created_at);
            
            // 5. Update the jobs list if there are changes
            if (JSON.stringify(jobs.map(j => j.id)) !== JSON.stringify(sortedJobs.map(j => j.id))) {
                jobs = sortedJobs;
                
                // Check if the currently selected job is still in the list
                const currentJobStillExists = $currentJob && jobs.some(job => job.id === $currentJob.id);
                
                // Only select the first job if no job is selected or the current job no longer exists
                if ((initialJobSelection || !currentJobStillExists) && jobs.length > 0) {
                    setJob(jobs[0]);
                    initialJobSelection = false;
                }
            }
        } catch (error) {
            console.error("Error fetching jobs with offers:", error);
        } finally {
            isLoading = false;
        }
    }

    function handleJobSelect(job) {
        setJob(job);
    }

    function initialize() {
        if ($nostrManager && $nostrManager.publicKey) {
            // Subscribe to job events
            $nostrManager.subscribeToEvents({
                kinds: [NOSTR_KIND_JOB],
                "#s": ["bitspark"],
            });
            
            // Subscribe to my offer events
            $nostrManager.subscribeToEvents({
                kinds: [NOSTR_KIND_OFFER],
                authors: [$nostrManager.publicKey]
            });
        }
    }

    onMount(async () => {
        initialize();
        await fetchJobsWithMyOffers();
    });

    $: initialize(), $nostrManager;
    $: fetchJobsWithMyOffers(), $nostrCache; // Re-fetch when cache updates
</script>

<div class="scroll-selector-container">
    {#if isLoading}
        <div class="loading-message">Loading jobs...</div>
    {:else if jobs.length === 0}
        <div class="empty-message">No jobs found. Apply to jobs to see them here.</div>
    {:else}
        <div class="scroll-selector-content">
            {#each jobs as job}
                <div
                    class="image-card {$currentJob === job ? 'image-card-selected' : ''}"
                    on:click={() => handleJobSelect(job)}
                >
                    <img
                        src={job.tags.find(t => t[0] === 'image')?.[1] || '/default-job-image.png'}
                        alt={job.tags.find(t => t[0] === 'name')?.[1] || 'Unnamed Job'}
                        class="image-card-img"
                    />
                    <div class="image-card-overlay">
                        <span class="image-card-title">
                            {job.tags.find(t => t[0] === 'name')?.[1] || 'Unnamed Job'}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .loading-message, .empty-message {
        padding: 1rem;
        text-align: center;
        color: #6b7280;
    }
</style>
