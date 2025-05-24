<script>
    import { currentIdea, setIdea, clearSelectedIdea } from '../../../stores/common/ideaStore';
    import { onMount } from 'svelte';
    import { nostrCache } from '../../../backend/NostrCacheStore';
    import { nostrManager } from "../../../backend/NostrManagerStore.js";
    import { NOSTR_KIND_IDEA } from '../../../constants/nostrKinds';
    import { clearCurrentJob } from '../../../stores/common/jobStore';
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
        if ($currentIdea?.id === idea.id) {
            clearSelectedIdea();
        } else {
            setIdea(idea);
        }
    }

    onMount(async () => {
        await loadIdeas();
        // Clear any previous selection
        clearSelectedIdea();
    });

    $: loadIdeas(), $nostrCache;

    $: clearCurrentJob(), $currentIdea;
</script>

<div class="scroll-selector-container">
    <div class="scroll-selector-content">
        {#each ideas as idea}
            <div 
                class="image-card {$currentIdea?.id === idea.id ? 'image-card-selected' : ''}"
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
