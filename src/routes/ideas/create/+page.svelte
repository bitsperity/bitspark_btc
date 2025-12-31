<!--
  Create Idea Page
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Button } from '$lib/components';
	import { IdeaForm } from '$lib/components/ideas';
	import { authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
</script>

<AuroraBackground />

<main class="page">
	<Container>
		{#if authService.isLoggedIn}
			<Stack gap={6}>
				<a href="/ideas" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Ideas</span>
				</a>
				<IdeaForm />
			</Stack>
		{:else}
			<Stack gap={4} class="not-logged-in">
				<h1 class="text-display-md">Login Required</h1>
				<p class="text-body">Please connect your wallet to create an idea.</p>
				<Button variant="primary" onclick={() => goto('/')}>
					Go Home
				</Button>
			</Stack>
		{/if}
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

	:global(.not-logged-in) {
		align-items: center;
		text-align: center;
		padding: var(--space-16) 0;
	}
</style>
