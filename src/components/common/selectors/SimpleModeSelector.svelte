<script>
    import { currentMode, setMode } from '../../../stores/common/modeStore';
    import { onMount } from 'svelte';

    // Accept modes as a property
    export let modes = [];

    // Handle mode selection
    function handleModeSelect(mode) {
        setMode(mode);
    }

    // Set default mode on mount
    onMount(() => {
        if (modes.length > 0 && !$currentMode) {
            setMode(modes[0]);
        }
    });
</script>

<div class="button-group">
    {#each modes as mode}
        <button 
            class="btn-toggle {$currentMode === mode ? 'btn-toggle-active' : 'btn-toggle-inactive'}"
            on:click={() => handleModeSelect(mode)}
        >
            {mode}
        </button>
    {/each}
</div>
