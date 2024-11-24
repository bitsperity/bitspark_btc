<!-- JobExplorer.svelte -->
<script>
  import Menu from "../components/Sidebar/Sidebar.svelte";
  import JobManagerWidget from "../components/IdeaLabView/JobManagerWidget.svelte";
  import Footer from "../components/Footers/Footer.svelte";
  import { contentContainerClass } from "../helperStore.js";
  import Banner from "../components/Banner.svelte";
  import ToolBar from "../components/Toolbar/Toolbar.svelte";
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

  $: if ($nostrCache && $nostrManager?.publicKey) {
    fetchUserIdeas();
  }
</script>

<main class="overview-page">
  <Menu />
  <div class="flex-grow">
    <Banner {bannerImage} {title} {subtitle} show_right_text={false} />
    <ToolBar />
    <div class={$contentContainerClass}>
      {#if userIdeas.length === 0}
        <div class="empty-state">
          <p>No ideas found. Create an idea to start managing jobs!</p>
        </div>
      {:else}
        {#each userIdeas as idea (idea.id)}
          <div class="idea-section">
            <h2 class="idea-title">
              {idea.title}
              {#if idea.subtitle}
                <span class="idea-subtitle">{idea.subtitle}</span>
              {/if}
            </h2>
            <JobManagerWidget ideaID={idea.id} />
          </div>
        {/each}
      {/if}
    </div>
  </div>
  <Footer />
</main>

<style>
  .idea-section {
    margin-bottom: 2rem;
  }

  .idea-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }

  .idea-subtitle {
    font-size: 1rem;
    font-weight: normal;
    color: #6b7280;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .empty-state p {
    color: #6b7280;
    font-size: 1.1rem;
  }
</style>
