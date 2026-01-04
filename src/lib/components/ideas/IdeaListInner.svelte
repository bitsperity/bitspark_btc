<!--
  IdeaListInner - Ideas listing with filtering and stats
  
  Uses ideasWithStats store for enriched data with job counts.
-->
<script lang="ts">
	import { Skeleton, Stack, Button } from '$lib/components';
	import IdeaCard from './IdeaCard.svelte';
	import IdeaFilters from './IdeaFilters.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { ideasWithStatsStore, type IdeaFilterOptions } from '$lib/stores';
	import { RefreshCw, WifiOff } from 'lucide-svelte';
	import { get } from 'svelte/store';

	// Start subscriptions on mount
	onMount(() => {
		ideasWithStatsStore.start();
	});

	onDestroy(() => {
		ideasWithStatsStore.stop();
	});

	// Subscribe to stores
	const ideas = ideasWithStatsStore;
	const isLoading = ideasWithStatsStore.isLoading;
	
	// Get current filters reactively
	let currentFilters = $state<IdeaFilterOptions>({ search: '', category: null, status: 'all', sortBy: 'newest' });
	
	$effect(() => {
		const unsub = ideasWithStatsStore.filters.subscribe(f => {
			currentFilters = f;
		});
		return unsub;
	});

	function handleFilterChange(key: keyof IdeaFilterOptions, value: any) {
		ideasWithStatsStore.setFilter(key, value);
	}

	function handleRetry() {
		ideasWithStatsStore.stop();
		ideasWithStatsStore.start();
	}
</script>

<!-- Filters -->
<IdeaFilters filters={currentFilters} onFilterChange={handleFilterChange} />

{#if $isLoading}
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
{:else if $ideas.length === 0}
	{#if currentFilters.search || currentFilters.category}
		<div class="empty-state">
			<p class="text-muted">No ideas match your filters.</p>
			<Button variant="ghost" onclick={() => ideasWithStatsStore.resetFilters()}>
				Clear Filters
			</Button>
		</div>
	{:else}
		<div class="empty-state">
			<p class="text-muted">No ideas found. Be the first!</p>
			<a href="/ideas/create" class="create-link">Create an Idea</a>
		</div>
	{/if}
{:else}
	<div class="ideas-grid">
		{#each $ideas as idea (idea.id)}
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
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.create-link {
		color: var(--orange-400);
		text-decoration: underline;
	}
</style>
