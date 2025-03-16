<script>
    import { currentJob, setJob } from "../../../stores/common/jobStore";
    import { onMount } from "svelte";
    import { nostrCache } from "../../../backend/NostrCacheStore";
    import { nostrManager } from "../../../backend/NostrManagerStore.js";
    import { NOSTR_KIND_JOB } from "../../../constants/nostrKinds";

    // Accept ideaIds as a property
    export let ideaIds = [];

    let jobs = [];
    let initialJobSelection = true;

    async function fetchJobs() {
        console.log("fetchJobs", ideaIds);
        if ($nostrManager && $nostrManager.publicKey) {
            const criteria = {
                kinds: [NOSTR_KIND_JOB],
                authors: [$nostrManager.publicKey],
            };

            // Only add e-tags if ideaIds is not empty
            if (ideaIds.length > 0) {
                criteria.tags = { e: ideaIds };
            }

            const events = await $nostrCache.getEventsByCriteria(criteria);

            const newJobs = events.filter(event => 
                event.pubkey === $nostrManager.publicKey ||
                event.tags.some(t => t[0] === "p")
            );
            
            // Sort jobs by created_at in descending order (newest first)
            const sortedJobs = newJobs.sort((a, b) => b.created_at - a.created_at);
            
            // Check if the currently selected job is still in the new job list
            const currentJobStillExists = $currentJob && sortedJobs.some(job => job.id === $currentJob.id);
            
            // Only update jobs if there are changes to avoid unnecessary re-renders
            if (JSON.stringify(jobs.map(j => j.id)) !== JSON.stringify(sortedJobs.map(j => j.id))) {
                jobs = sortedJobs;
                
                // Only select the first job if no job is selected or the current job no longer exists
                if ((initialJobSelection || !currentJobStillExists) && jobs.length > 0) {
                    setJob(jobs[0]);
                    initialJobSelection = false;
                }
            }
        }
    }

    function handleJobSelect(job) {
        setJob(job);
    }

    function initialize() {
        if ($nostrManager && $nostrManager.publicKey) {
            $nostrManager.subscribeToEvents({
                kinds: [NOSTR_KIND_JOB],
                authors: [$nostrManager.publicKey],
                "#s": ["bitspark"],
            });
        }
    }

    onMount(async () => {
        initialize();
        await fetchJobs();
    });

    $: initialize(), $nostrManager;
    $: fetchJobs(), [$nostrCache, ideaIds]; // Re-fetch when ideaIds changes
</script>

<div class="scroll-selector-container">
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
</div>
