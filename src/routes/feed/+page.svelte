<!--
  Feed Page - Activity from followed users
  
  Shows Ideas, Jobs, Comments, and Likes from people you follow.
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Button, Skeleton } from '$lib/components';
	import { ActivityItem } from '$lib/components/social';
	import { authService } from '$lib/services';
	import { 
		allActivities, 
		ideaActivities, 
		jobActivities, 
		commentActivities, 
		likeActivities,
		activityFeedLoading,
		activityFeedHasMore,
		loadActivities,
		loadMore
	} from '$lib/stores/activityFeed';
	import { onMount } from 'svelte';
	import { Users, Lightbulb, Briefcase, MessageCircle, Heart, Rss, Loader } from 'lucide-svelte';

	// Filter state
	let filter = $state<'all' | 'ideas' | 'jobs' | 'comments' | 'likes'>('all');

	// Get filtered activities based on current filter
	const filteredActivities = $derived(() => {
		switch (filter) {
			case 'ideas': return $ideaActivities;
			case 'jobs': return $jobActivities;
			case 'comments': return $commentActivities;
			case 'likes': return $likeActivities;
			default: return $allActivities;
		}
	});

	onMount(() => {
		if (authService.isLoggedIn) {
			loadActivities();
		}
	});
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<!-- Header -->
			<div>
				<Row gap={2} class="header-row">
					<Rss size={24} />
					<h1 class="text-display-lg">Your Feed</h1>
				</Row>
				<p class="text-muted">Activity from people you follow</p>
			</div>

			<!-- Filter Tabs -->
			<div class="filter-tabs">
				<button 
					class="filter-tab" 
					class:active={filter === 'all'} 
					onclick={() => filter = 'all'}
				>
					All
				</button>
				<button 
					class="filter-tab" 
					class:active={filter === 'ideas'} 
					onclick={() => filter = 'ideas'}
				>
					<Lightbulb size={14} />
					Ideas
				</button>
				<button 
					class="filter-tab" 
					class:active={filter === 'jobs'} 
					onclick={() => filter = 'jobs'}
				>
					<Briefcase size={14} />
					Jobs
				</button>
				<button 
					class="filter-tab" 
					class:active={filter === 'comments'} 
					onclick={() => filter = 'comments'}
				>
					<MessageCircle size={14} />
					Comments
				</button>
				<button 
					class="filter-tab" 
					class:active={filter === 'likes'} 
					onclick={() => filter = 'likes'}
				>
					<Heart size={14} />
					Likes
				</button>
			</div>

			<!-- Content -->
			{#if !authService.isLoggedIn}
				<div class="empty-state">
					<Users size={48} />
					<h2>Login to See Your Feed</h2>
					<p class="text-muted">Follow users to see their activity in your personalized feed.</p>
				</div>
			{:else if $activityFeedLoading && filteredActivities().length === 0}
				<Stack gap={3}>
					{#each Array(5) as _}
						<div class="skeleton-item">
							<Skeleton circle size="40px" />
							<Stack gap={2} class="skeleton-content">
								<Skeleton width="60%" height="1rem" />
								<Skeleton width="100%" height="0.875rem" />
							</Stack>
						</div>
					{/each}
				</Stack>
			{:else if filteredActivities().length === 0}
				<div class="empty-state">
					<Rss size={48} />
					<h2>No Activity Yet</h2>
					<p class="text-muted">The users you follow haven't been active recently.</p>
					<Button variant="primary" onclick={() => window.location.href = '/ideas'}>
						Browse Ideas
					</Button>
				</div>
			{:else}
				<Stack gap={3}>
					{#each filteredActivities() as activity (activity.event.id)}
						<ActivityItem event={activity.event} />
					{/each}
					
					<!-- Load More -->
					{#if $activityFeedHasMore}
						<Button 
							variant="glass" 
							onclick={loadMore} 
							disabled={$activityFeedLoading}
							class="load-more"
						>
							{#if $activityFeedLoading}
								<Loader size={16} class="spin" />
								Loading...
							{:else}
								Load more
							{/if}
						</Button>
					{/if}
				</Stack>
			{/if}
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	:global(.header-row) {
		margin-bottom: var(--space-2);
	}

	.filter-tabs {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.filter-tab {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.filter-tab:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.filter-tab.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.skeleton-item {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
	}

	:global(.skeleton-content) {
		flex: 1;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-16);
		text-align: center;
		color: var(--text-muted);
	}

	.empty-state h2 {
		color: var(--text-primary);
		margin: 0;
	}

	.empty-state p {
		max-width: 300px;
		margin: 0;
	}

	:global(.load-more) {
		width: 100%;
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
