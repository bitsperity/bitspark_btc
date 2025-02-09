<!-- IdeaLabView.svelte -->
<script>
  import { onMount } from "svelte";
  import Menu from "../components/Sidebar/Sidebar.svelte";
  import Footer from "../components/Footers/Footer.svelte";
  import { contentContainerClass } from "../helperStore.js";
  import Banner from "../components/Banner.svelte";
  import ToolBar from "../components/Toolbar/Toolbar.svelte";
  import { nostrManager } from "../backend/NostrManagerStore.js";
  import { nostrCache } from "../backend/NostrCacheStore.js";
  import { NOSTR_KIND_IDEA } from "../constants/nostrKinds";
  import IdeaJobsOverview from "../components/JobManagement/IdeaLabView/IdeaJobsOverview.svelte";

  let bannerImage = "../../img/Banner1u.png";
  let title = "BitSpark";
  let subtitle = "idea lab";
  let selectedIdea = null;
  let myIdeas = [];

  onMount(async () => {
    if ($nostrManager && $nostrCache) {
      // Lade meine Ideas
      const ideas = await $nostrCache.getEventsByCriteria({
        kinds: [NOSTR_KIND_IDEA],
        authors: [$nostrManager.publicKey]
      });
      myIdeas = ideas.sort((a, b) => b.created_at - a.created_at);
      
      if (myIdeas.length > 0) {
        selectedIdea = myIdeas[0];
      }
    }
  });
</script>

<main class="overview-page">
  <Menu />
  <div class="flex-grow">
    <Banner {bannerImage} {title} {subtitle} show_right_text={false} />
    <ToolBar />
    <div class={$contentContainerClass}>
      <!-- Idea Auswahl -->
      {#if myIdeas.length > 0}
        <div class="mb-6">
          <select 
            bind:value={selectedIdea}
            class="input-style"
          >
            {#each myIdeas as idea}
              <option value={idea}>
                {idea.tags.find(t => t[0] === 'iName')?.[1] || 'Unbenannte Idea'}
              </option>
            {/each}
          </select>
        </div>

        <!-- Jobs für ausgewählte Idea -->
        {#if selectedIdea}
          <IdeaJobsOverview ideaId={selectedIdea.id} />
        {/if}
      {:else}
        <div class="text-center py-8">
          <p class="text-xl text-gray-600">
            Du hast noch keine Ideas erstellt.
          </p>
          <a 
            href="/post-idea" 
            class="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Erste Idea erstellen
          </a>
        </div>
      {/if}
    </div>
  </div>
  <Footer />
</main>

<style>
  select {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: block;
  }
</style>
