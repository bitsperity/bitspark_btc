<!-- IdeaLabView.svelte -->
<script>
  import { onMount } from "svelte";
  import Menu from "../components/Sidebar/Sidebar.svelte";
  import Footer from "../components/Footers/Footer.svelte";
  import { contentContainerClass } from "../helperStore.js";
  import Banner from "../components/Banner.svelte";
  import ToolBar from "../components/Toolbar/Toolbar.svelte";
  import CommunityJobsSection from "../components/IdeaLab/CommunityJobsSection.svelte";
  import ActiveJobsSection from "../components/IdeaLab/ActiveJobsSection.svelte";
  import ContractSection from "../components/IdeaLab/ContractSection.svelte";
  import ApplicationsSection from "../components/IdeaLab/ApplicationsSection.svelte";
  import { nostrManager } from "../backend/NostrManagerStore.js";
  import { nostrCache } from "../backend/NostrCacheStore.js";
  import { NOSTR_KIND_IDEA } from "../constants/nostrKinds";

  let bannerImage = "../../img/Banner1u.png";
  let title = "BitSpark";
  let subtitle = "idea lab";
  let userIdeas = [];

  async function fetchUserIdeas() {
    if (!$nostrManager?.publicKey) return;

    const ideas = await $nostrCache.getEventsByCriteria({
      kinds: [NOSTR_KIND_IDEA],
      authors: [$nostrManager.publicKey],
      tags: { s: ["bitspark"] }
    });

    userIdeas = ideas.map(idea => ({
      id: idea.id,
      title: idea.tags.find(t => t[0] === "iName")?.[1] || "Untitled Idea",
      subtitle: idea.tags.find(t => t[0] === "iSub")?.[1] || ""
    }));
  }

  // Auf Cache-Änderungen reagieren
  $: {
    if ($nostrCache) {
      console.log('Cache updated, fetching ideas...');
      fetchUserIdeas();
    }
  }

  onMount(async () => {
    if ($nostrManager) {
      // Subscribe to encrypted events (1059)
      await $nostrManager.subscribeToEvents({
        kinds: [1059],
        "#p": [$nostrManager.publicKey],
      });
      
      // Initial fetch
      await fetchUserIdeas();
    }
  });
</script>

<main class="overview-page">
  <Menu />
  <div class="flex-grow">
    <Banner {bannerImage} {title} {subtitle} show_right_text={false} />
    <ToolBar />
    <div class={$contentContainerClass}>
      {#if userIdeas.length === 0}
        <div class="single-card">
          <div class="empty-state">
            <h3>No Ideas Found</h3>
            <p>Create an idea to start managing jobs and collaborating with developers!</p>
          </div>
        </div>
      {:else}
        {#each userIdeas as idea (idea.id)}
          <div class="single-card">
            <div class="idea-header">
              <h2>{idea.title}</h2>
              {#if idea.subtitle}
                <p class="idea-subtitle">{idea.subtitle}</p>
              {/if}
            </div>

            <!-- Community Jobs die auf Republish warten -->
            <CommunityJobsSection ideaId={idea.id} />

            <!-- Aktive Jobs (eigene + republished) -->
            <ActiveJobsSection ideaId={idea.id} />

            <!-- Bewerbungen -->
            <ApplicationsSection ideaId={idea.id} />

            <!-- Aktive Contracts -->
            <ContractSection ideaId={idea.id} />
          </div>
        {/each}
      {/if}
    </div>
  </div>
  <Footer />
</main>

<style>
  .idea-header {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .idea-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .idea-subtitle {
    color: #6b7280;
    margin-top: 0.5rem;
    font-size: 1.1rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: #6b7280;
    font-size: 1.1rem;
  }
</style>
