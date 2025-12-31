<!--
  IdeaList - Grid of IdeaCards with loading state
-->
<script lang="ts">
	import { ideaService } from '$lib/services';
	import type { Idea } from '$lib/types/idea';
	import { Skeleton, Stack } from '$lib/components';
	import IdeaCard from './IdeaCard.svelte';
	import { onDestroy } from 'svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	interface Props {
		category?: string;
	}

	let { category }: Props = $props();

	// Use untrack to prevent infinite loop
	import { untrack } from 'svelte';
	
	// Store reference - subscribe once
	const ideasStore = ideaService.subscribeToIdeas(category);

	// Parse events to Ideas
	const ideas = $derived(
		($ideasStore as NDKEvent[]).map(event => ideaService.parseIdeaEvent(event))
	);

	const isLoading = $derived($ideasStore.length === 0);

	onDestroy(() => ideasStore.unsubscribe());
</script>

{#if isLoading}
	<div class="ideas-grid">
		{#each Array(6) as _}
			<div class="skeleton-card">
				<Skeleton width="100%" height="150px" />
				<Stack gap={2}>
					<Skeleton width="80%" height="1.5rem" />
					<Skeleton width="100%" height="1rem" />
					<Skeleton width="60%" height="1rem" />
				</Stack>
			</div>
		{/each}
	</div>
{:else if ideas.length === 0}
	<div class="empty-state">
		<p class="text-muted">No ideas found. Be the first!</p>
		<a href="/ideas/create" class="create-link">Create an Idea</a>
	</div>
{:else}
	<div class="ideas-grid">
		{#each ideas as idea (idea.id)}
			<IdeaCard {idea} />
		{/each}
	</div>
{/if}

<style>
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
	}

	.create-link {
		color: var(--orange-400);
		text-decoration: underline;
	}
</style>
