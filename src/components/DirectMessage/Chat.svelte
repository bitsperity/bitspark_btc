<script>
    import { writable } from "svelte/store";
    import ChatList from "./ChatList.svelte";
    import ChatRoom from "./ChatRoom.svelte";
    import { onMount } from "svelte";
    import { dmManager } from "../../backend/DMManager.js";
    import { nostrManager } from "../../backend/NostrManagerStore.js";
    import { nostrCache } from "../../backend/NostrCacheStore.js";

    export let pubkey = null;
    let selectedRoom = writable(null);

    function selectRoom(event) {
        selectedRoom.set(event.detail);
    }

    $: loggedIn = $nostrManager && $nostrManager.publicKey;

    $: if (loggedIn && $nostrCache) {
        dmManager.init();
        dmManager.subscribeToMessages();
    }

    onMount(async () => {
        if (loggedIn) {
            await dmManager.init();
            dmManager.subscribeToMessages();
        }
    });
</script>

<main>
    <div class="chat-container">
        {#if loggedIn}
            <ChatList {pubkey} on:selectRoom={selectRoom} />
            {#if $selectedRoom}
                <ChatRoom {selectedRoom} />
            {:else}
                <div class="no-chat-selected">
                    <p>Select a chat to start messaging</p>
                </div>
            {/if}
        {:else}
            <div class="not-logged-in">
                <p>Please log in to access the chat.</p>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) {
        font-family: "Arial", sans-serif;
        background-color: #f0f2f5;
        margin: 0;
        padding: 0;
    }

    .chat-container {
        display: flex;
        height: 50vh;
        background-color: #fff;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        overflow: hidden;
        margin: auto;
        margin-bottom: 7vh;
        max-width: 1200px;
    }

    .no-chat-selected,
    .not-logged-in {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #888;
    }

    .not-logged-in {
        flex-direction: column;
        text-align: center;
    }
</style>
