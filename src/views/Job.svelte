<!-- JobView.svelte -->
<script>
  import { onMount, onDestroy } from "svelte";
  import Menu from "../components/Sidebar/Sidebar.svelte";
  import CommentWidget from "../components/CommentWidget.svelte";
  import Footer from "../components/Footers/Footer.svelte";
  import Banner from "../components/Banner.svelte";
  import ToolBar from "../components/Toolbar/Toolbar.svelte";
  import { nostrCache } from "../backend/NostrCacheStore.js";
  import { nostrManager } from "../backend/NostrManagerStore.js";
  import { contentContainerClass } from "../helperStore.js";
  import { NOSTR_KIND_JOB } from "../constants/nostrKinds";
  import ZapWidget from "../components/ZapWidget.svelte";
  import { socialMediaManager } from "../backend/SocialMediaManager.js";
  import ApplicationModal from "../components/Modals/ApplicationModal.svelte";

  export let id;
  let job = null;
  let creator_profile = null;
  let showApplicationModal = false;
  let canApply = false;

  function initialize() {
    if ($nostrManager) {
      console.log('NostrManager initialized with pubkey:', $nostrManager.publicKey);
      $nostrManager.subscribeToEvents({
        kinds: [NOSTR_KIND_JOB],
        ids: [id]
      });
      fetchJob();
    }
  }

  async function fetchJob() {
    const jobEvent = await $nostrCache.getEventById(id);
    if (!jobEvent) return;

    console.log('Fetched job event:', jobEvent);

    // Job-Daten aus Event extrahieren
    const tags = jobEvent.tags.reduce(
      (tagObj, [key, value]) => ({ ...tagObj, [key]: value }),
      {}
    );

    // Original-Ersteller finden falls republished
    const originalCreator = jobEvent.tags.find(t => t[0] === 'p')?.[1];

    job = {
      id: jobEvent.id,
      title: tags.name || "N/A",
      description: jobEvent.content || "",
      requirements: tags.requirements || "",
      image: tags.image || "",
      page: tags.page || "",
      languages: jobEvent.tags.filter(t => t[0] === 'l').map(t => t[1]),
      categories: jobEvent.tags.filter(t => t[0] === 'c').map(t => t[1]),
      createdAt: jobEvent.created_at,
      pubkey: jobEvent.pubkey,
      originalCreator,
      ideaId: jobEvent.tags.find(t => t[0] === 'e')?.[1]
    };

    console.log('Processed job:', job);

    if (job) {
      fetchProfile(job.pubkey);
      if (job.originalCreator) {
        fetchProfile(job.originalCreator);
      }
    }
  }

  async function fetchProfile(pubkey) {
    creator_profile = await socialMediaManager.getProfile(pubkey);
  }

  function handleApplicationSuccess() {
    showApplicationModal = false;
    // TODO: Feedback anzeigen
  }

  onMount(() => {
    initialize();
  });

  onDestroy(() => {
    if ($nostrManager) {
      $nostrManager.unsubscribeAll();
    }
  });

  $: if ($nostrCache) {
    fetchJob();
  }

  $: {
    const isLoggedIn = !!$nostrManager?.publicKey;
    const isNotCreator = job?.pubkey !== $nostrManager?.publicKey;
    const isNotOriginalCreator = job?.originalCreator !== $nostrManager?.publicKey;
    
    console.log('Apply button conditions:', {
      isLoggedIn,
      isNotCreator,
      isNotOriginalCreator,
      userPubkey: $nostrManager?.publicKey,
      jobPubkey: job?.pubkey,
      originalCreator: job?.originalCreator
    });

    canApply = isLoggedIn && isNotCreator && isNotOriginalCreator;
  }
</script>

<main class="overview-page">
  <Menu />
  <div class="flex-grow">
    <Banner
      title={job?.title}
      subtitle={job?.originalCreator ? "Republished Job" : "Original Job"}
      show_right_text={false}
    />

    <ToolBar />

    <div class={$contentContainerClass}>
      <div class="single-card">
        {#if job}
          <div class="job-header">
            <div class="creator-info">
              {#if job.originalCreator}
                <div class="republished">
                  <span>Original erstellt von: {job.originalCreator}</span>
                  <span>Republished von: {job.pubkey}</span>
                </div>
              {:else}
                <span>Erstellt von: {job.pubkey}</span>
              {/if}
            </div>

            {#if job.languages?.length || job.categories?.length}
              <div class="tags-container">
                {#if job.languages?.length}
                  <div class="tags">
                    <span class="tag-label">Sprachen:</span>
                    {#each job.languages as lang}
                      <span class="tag language">{lang}</span>
                    {/each}
                  </div>
                {/if}

                {#if job.categories?.length}
                  <div class="tags">
                    <span class="tag-label">Kategorien:</span>
                    {#each job.categories as cat}
                      <span class="tag category">{cat}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            {#if canApply}
              <button class="apply-button" on:click={() => {
                showApplicationModal = true;
                console.log('showApplicationModal set to:', showApplicationModal);
              }}>
                Auf diesen Job bewerben
              </button>
            {/if}
          </div>

          <div class="job-content">
            {#if job.image}
              <img src={job.image} alt={job.title} class="job-image" />
            {/if}

            <div class="description">
              <h3>Beschreibung</h3>
              <div class="text-content">
                {@html job.description}
              </div>
            </div>

            {#if job.page}
              <div class="details">
                <h3>Details</h3>
                <div class="text-content rich-text">
                  {@html job.page}
                </div>
              </div>
            {/if}

            {#if job.requirements}
              <div class="requirements">
                <h3>Anforderungen</h3>
                <div class="text-content plain-text">
                  {job.requirements}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <ZapWidget eventId={id} />
      
      <div class="single-card">
        <CommentWidget {id} />
      </div>
    </div>
  </div>

  <Footer />
</main>

{#if showApplicationModal}
  {@debug showApplicationModal}
  {#if job?.id}
    <ApplicationModal
      jobId={job.id}
      on:close={() => {
        console.log('Closing modal');
        showApplicationModal = false;
      }}
      on:success={handleApplicationSuccess}
    />
  {:else}
    <div style="color: red;">Error: No job.id available</div>
  {/if}
{/if}

<style>
  .single-card {
    background: white;
    border-radius: 1.25rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
    padding: 2rem;
  }

  .job-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .creator-info {
    color: #718096;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .republished {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .tag-label {
    color: #4a5568;
    font-weight: 500;
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

  .job-content {
    color: #4a5568;
    font-size: 1.1rem;
    line-height: 1.7;
  }

  .job-image {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .description, .details, .requirements {
    margin-bottom: 3rem;
  }

  .description h3, .details h3, .requirements h3 {
    color: #2c5282;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .text-content {
    max-width: 70ch;
    margin: 0 auto;
  }

  .plain-text {
    white-space: pre-wrap;
    font-family: monospace;
    background: #f7fafc;
    padding: 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.9em;
  }

  .rich-text {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .rich-text :global(h1),
  .rich-text :global(h2),
  .rich-text :global(h3) {
    color: #2c5282;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  .rich-text :global(p) {
    margin-bottom: 1em;
  }

  .rich-text :global(ul),
  .rich-text :global(ol) {
    margin-left: 1.5em;
    margin-bottom: 1em;
  }

  .rich-text :global(li) {
    margin-bottom: 0.5em;
  }

  .rich-text :global(pre),
  .rich-text :global(code) {
    background: #f7fafc;
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
    font-family: monospace;
  }

  .rich-text :global(pre) {
    padding: 1em;
    margin: 1em 0;
    overflow-x: auto;
  }

  .rich-text :global(a) {
    color: #2c5282;
    text-decoration: underline;
  }

  .rich-text :global(blockquote) {
    border-left: 4px solid #e2e8f0;
    padding-left: 1em;
    margin: 1em 0;
    color: #718096;
  }

  .apply-button {
    display: block;
    width: fit-content;
    margin: 1.5rem auto 0;
    padding: 0.75rem 1.5rem;
    background-color: #2c5282;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .apply-button:hover {
    background-color: #2a4365;
    transform: translateY(-1px);
  }
</style>
