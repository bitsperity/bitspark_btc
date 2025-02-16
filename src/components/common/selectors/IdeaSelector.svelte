<script>
    import { selectedIdeas, toggleIdea, clearSelectedIdeas } from '../../../stores/common/ideaStore';
    import { onMount } from 'svelte';
    import { nostrCache } from '../../../backend/NostrCacheStore';
    import { nostrManager } from "../../../backend/NostrManagerStore.js";
    import { NOSTR_KIND_IDEA } from '../../../constants/nostrKinds';

    let ideas = [];

    async function loadIdeas() {
        if ($nostrManager && $nostrManager.publicKey) {
            const allIdeas = await $nostrCache.getEventsByCriteria({
                kinds: [NOSTR_KIND_IDEA],
                authors: [$nostrManager.publicKey],
            });
            ideas = allIdeas;
        }
    }

    function handleIdeaSelect(idea) {
        toggleIdea(idea);
    }

    function initialize() {
        if ($nostrManager && $nostrManager.publicKey) {
            $nostrManager.subscribeToEvents({
                kinds: [NOSTR_KIND_IDEA],
                authors: [$nostrManager.publicKey],
                "#s": ["bitspark"], 
            });
        }
    }

    onMount(async () => {
        initialize();
        await loadIdeas();
        // Clear any previous selections
        clearSelectedIdeas();
    });

    $: initialize(), $nostrManager;
    $: loadIdeas(), $nostrCache;
</script>

<div class="scroll-selector-container">
    <div class="scroll-selector-content">
        {#each ideas as idea}
            <div 
                class="image-card {$selectedIdeas.some(i => i.id === idea.id) ? 'image-card-selected' : ''}"
                on:click={() => handleIdeaSelect(idea)}
            >
                <img 
                    src={idea.tags.find(t => t[0] === 'ibUrl')?.[1] || '/default-idea-image.png'}
                    alt={idea.tags.find(t => t[0] === 'iName')?.[1] || 'Unnamed Idea'}
                    class="image-card-img"
                />
                <div class="image-card-overlay">
                    <span class="image-card-title">
                        {idea.tags.find(t => t[0] === 'iName')?.[1] || 'Unnamed Idea'}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</div>
