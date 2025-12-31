<script lang="ts">
	import '../lib/styles/design-system.css';
	import './layout.css';
	import { NostrProvider } from '$lib/components';
	
	let { children } = $props();
</script>

<svelte:head>
	<title>BitSpark - Decentralized Freelance Marketplace</title>
	<meta name="description" content="A decentralized freelance marketplace built on Nostr protocol" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<NostrProvider>
	<div class="app">
		{@render children()}
	</div>
</NostrProvider>

<style>
	.app {
		min-height: 100vh;
	}
</style>
