<!--
  Dashboard Ideas - My Ideas page
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Row, Button, Skeleton } from '$lib/components';
	import { IdeaCard } from '$lib/components/ideas';
	import { authService, ideaService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { Plus } from 'lucide-svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	// Subscribe to user's ideas
	let ideasStore = authService.user 
		? ideaService.subscribeToUserIdeas(authService.user.pubkey)
		: null;

	const ideas = $derived(
		ideasStore 
			? ($ideasStore as NDKEvent[]).map(event => ideaService.parseIdeaEvent(event))
			: []
	);

	const isLoading = $derived(ideasStore ? $ideasStore.length === 0 : false);

	onDestroy(() => ideasStore?.unsubscribe());
</script>

<AuroraBackground />

<main class="page">
	<Container>
		{#if !authService.isLoggedIn}
			<Stack gap={4} class="not-logged-in">
				<h1 class="text-display-md">Login Required</h1>
				<p class="text-body">Please connect your wallet to view your ideas.</p>
				<Button variant="primary" onclick={() => goto('/')}>
					Go Home
				</Button>
			</Stack>
		{:else}
			<Stack gap={6}>
				<Row justify="between">
					<div>
						<h1 class="text-display-lg">My Ideas</h1>
						<p class="text-muted">Ideas you've created</p>
					</div>
					<Button variant="primary" onclick={() => goto('/ideas/create')}>
						<Plus size={16} />
						<span>New Idea</span>
					</Button>
				</Row>

				{#if isLoading}
					<div class="ideas-grid">
						{#each Array(3) as _}
							<div class="skeleton-card">
								<Skeleton width="100%" height="150px" />
								<Stack gap={2}>
									<Skeleton width="80%" height="1.5rem" />
									<Skeleton width="100%" height="1rem" />
								</Stack>
							</div>
						{/each}
					</div>
				{:else if ideas.length === 0}
					<div class="empty-state">
						<p class="text-muted">You haven't created any ideas yet.</p>
						<Button variant="secondary" onclick={() => goto('/ideas/create')}>
							Create Your First Idea
						</Button>
					</div>
				{:else}
					<div class="ideas-grid">
						{#each ideas as idea (idea.id)}
							<IdeaCard {idea} />
						{/each}
					</div>
				{/if}
			</Stack>
		{/if}
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	:global(.not-logged-in) {
		align-items: center;
		text-align: center;
		padding: var(--space-16) 0;
	}

	.ideas-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-6);
	}

	.skeleton-card {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-16);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}
</style>
