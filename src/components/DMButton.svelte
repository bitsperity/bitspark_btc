<script>
    import { onMount, onDestroy } from "svelte";
    import { nostrManager } from "../backend/NostrManagerStore.js"; // Import NostrManager
    import { nostrCache } from "../backend/NostrCacheStore.js";
    import { navigate } from "svelte-routing"; // Import svelte-routing for navigation
    export let profilePubKey; // Der Public Key des Nutzers für Direktnachrichten

    const navigateToDM = () => {
        if ($nostrManager?.publicKey) {
            navigate(`/dm/${profilePubKey}`);
        } else {
            console.error("User must be logged in to send a direct message.");
        }
    };

    onMount(() => {
        // Initial setup if needed
    });

    onDestroy(() => {
        // Cleanup if needed
    });

    // Reagiere auf Änderungen in nostrManager und nostrCache
    $: $nostrManager;
    $: $nostrCache;
</script>

<button
    on:click={navigateToDM}
    class={`dm-button ${!$nostrManager?.publicKey ? "disabled" : ""}`}
    disabled={!$nostrManager?.publicKey}
>
    <i class="icon fas fa-comment"></i>
    Message
</button>

<style>
    .dm-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px 20px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        background-color: #f7931a; /* Grundfarbe für den DM-Button */
        color: white;
        font-size: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition:
            background-color 0.3s,
            box-shadow 0.3s;
    }

    .dm-button.disabled {
        background-color: grey;
        cursor: default;
    }

    .icon {
        margin-right: 8px;
    }
</style>
