<!--
  NostrProvider Component - Initializes NDK connection on mount
  
  Usage in +layout.svelte:
    <NostrProvider>
      {@render children()}
    </NostrProvider>
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { connectNdk } from '$lib/nostr';
	import type { Snippet } from 'svelte';

	interface Props {
		autoConnect?: boolean;
		children: Snippet;
	}

	let {
		autoConnect = true,
		children
	}: Props = $props();

	onMount(async () => {
		if (autoConnect) {
			try {
				await connectNdk();
			} catch (error) {
				console.error('Failed to connect to Nostr relays:', error);
			}
		}
	});
</script>

{@render children()}
