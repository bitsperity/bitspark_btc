<!--
  Settings Page - Relay and other settings
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Button } from '$lib/components';
	import { RelayManager } from '$lib/components/settings';
	import { authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<a href="/" class="back-link">
				<ArrowLeft size={16} />
				<span>Back to Home</span>
			</a>

			<h1 class="text-display-lg">Settings</h1>

			{#if !authService.isLoggedIn}
				<p class="text-muted">Some settings require login to save.</p>
			{/if}

			<RelayManager />
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		color: var(--text-primary);
	}
</style>
