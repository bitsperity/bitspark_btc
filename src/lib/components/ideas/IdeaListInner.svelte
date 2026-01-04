<!--
  IdeaListInner - Actual subscription component (internal)
  
  Uses managed subscription with timeout handling for robust loading.
-->
<script lang="ts">
	import { ideaService } from '$lib/services';
	import type { Idea } from '$lib/types/idea';
	import { Skeleton, Stack, Button } from '$lib/components';
	import IdeaCard from './IdeaCard.svelte';
	import { onDestroy } from 'svelte';
	import { createSubscription } from '$lib/nostr';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
	import { RefreshCw, WifiOff } from 'lucide-svelte';

	interface Props {
		category?: string;
	}

	let { category }: Props = $props();

	// Build filter
	const filter: NDKFilter = {
		kinds: [NOSTR_KINDS.IDEA as number],
		'#s': ['bitspark'],
		limit: 50
	};
	if (category) {
		filter['#c'] = [category];
	}

	// Create managed subscription with 8s timeout
	const subscription = createSubscription<Idea>(
		filter,
		{ timeout: 8000 },
		(event: NDKEvent) => ideaService.parseIdeaEvent(event)
	);

	const { store: ideas, state: subscriptionState, retry } = subscription;

	onDestroy(() => subscription.unsubscribe());
</script>

{#if $subscriptionState === 'loading'}
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
{:else if $subscriptionState === 'timeout'}
	<div class="timeout-state">
		<WifiOff size={48} />
		<h3>Connection Timeout</h3>
		<p>Could not load ideas from relays.</p>
		<Button variant="primary" onclick={retry}>
			<RefreshCw size={16} />
			<span>Retry</span>
		</Button>
	</div>
{:else if $ideas.length === 0}
	<div class="empty-state">
		<p class="text-muted">No ideas found. Be the first!</p>
		<a href="/ideas/create" class="create-link">Create an Idea</a>
	</div>
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

	.empty-state,
	.timeout-state {
		text-align: center;
		padding: var(--space-16);
	}

	.timeout-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		color: var(--text-muted);
	}

	.timeout-state h3 {
		color: var(--text-primary);
		margin: 0;
	}

	.timeout-state p {
		margin: 0;
	}

	.create-link {
		color: var(--orange-400);
		text-decoration: underline;
	}
</style>
