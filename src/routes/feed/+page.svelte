<!--
  Feed Page - Content from followed users
  
  Shows Ideas and Jobs from users you follow.
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Badge, Button, Skeleton } from '$lib/components';
	import { IdeaCard } from '$lib/components/ideas';
	import { JobCard } from '$lib/components/jobs';
	import { socialService, authService, ideaService, jobService } from '$lib/services';
	import { ndk } from '$lib/nostr';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import { derived, writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { Idea } from '$lib/types/idea';
	import type { Job } from '$lib/types/job';
	import { Users, Briefcase, Lightbulb, Rss } from 'lucide-svelte';
	import type { NDKFilter, NDKEvent } from '@nostr-dev-kit/ndk';

	// Filter state
	let filter = $state<'all' | 'ideas' | 'jobs'>('all');

	// Following list
	const following = socialService.subscribeFollowing();

	// Content stores
	const feedIdeas = writable<Idea[]>([]);
	const feedJobs = writable<Job[]>([]);
	let isLoading = $state(true);

	onMount(() => {
		// Subscribe to following changes
		const unsub = following.subscribe(followList => {
			if (followList.length > 0) {
				loadFeed(followList);
			} else {
				isLoading = false;
			}
		});

		return unsub;
	});

	async function loadFeed(authors: string[]) {
		isLoading = true;

		// Fetch Ideas from followed users
		const ideasFilter: NDKFilter = {
			kinds: [NOSTR_KINDS.IDEA as number],
			authors: authors,
			'#s': ['bitspark'],
			limit: 50
		};

		const ideasEvents = await ndk.fetchEvents(ideasFilter);
		const ideas = Array.from(ideasEvents).map((e: any) => ideaService.parseIdeaEvent(e));
		feedIdeas.set(ideas);

		// Fetch Jobs from followed users
		const jobsFilter: NDKFilter = {
			kinds: [NOSTR_KINDS.JOB as number],
			authors: authors,
			'#s': ['bitspark'],
			limit: 50
		};

		const jobsEvents = await ndk.fetchEvents(jobsFilter);
		const jobs = Array.from(jobsEvents).map((e: any) => jobService.parseJobEvent(e));
		feedJobs.set(jobs);

		isLoading = false;
	}

	// Combined and sorted feed
	const combinedFeed = derived([feedIdeas, feedJobs], ([$ideas, $jobs]) => {
		type FeedEntry = { type: 'idea' | 'job'; item: Idea | Job; createdAt: number };
		
		const entries: FeedEntry[] = [
			...$ideas.map(idea => ({ 
				type: 'idea' as const, 
				item: idea, 
				createdAt: typeof idea.createdAt === 'number' ? idea.createdAt : idea.createdAt.getTime() / 1000
			})),
			...$jobs.map(job => ({ 
				type: 'job' as const, 
				item: job, 
				createdAt: typeof job.createdAt === 'number' ? job.createdAt : job.createdAt.getTime() / 1000
			}))
		];

		// Sort by newest first
		entries.sort((a, b) => b.createdAt - a.createdAt);

		// Apply filter
		if (filter === 'ideas') return entries.filter(e => e.type === 'idea');
		if (filter === 'jobs') return entries.filter(e => e.type === 'job');
		return entries;
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
				<p class="text-muted">Content from people you follow</p>
			</div>

			<!-- Filter Tabs -->
			<Row gap={2}>
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
			</Row>

			<!-- Content -->
			{#if !authService.isLoggedIn}
				<div class="empty-state">
					<Users size={48} />
					<h2>Login to See Your Feed</h2>
					<p class="text-muted">Follow users to see their Ideas and Jobs in your personalized feed.</p>
				</div>
			{:else if isLoading}
				<div class="feed-grid">
					{#each Array(6) as _}
						<div class="skeleton-card">
							<Skeleton width="100%" height="150px" />
							<Stack gap={2}>
								<Skeleton width="80%" height="1.5rem" />
								<Skeleton width="100%" height="1rem" />
							</Stack>
						</div>
					{/each}
				</div>
			{:else if $following.length === 0}
				<div class="empty-state">
					<Users size={48} />
					<h2>You're Not Following Anyone</h2>
					<p class="text-muted">Follow other users to see their content here.</p>
					<Button variant="primary" onclick={() => window.location.href = '/ideas'}>
						Browse Ideas
					</Button>
				</div>
			{:else if $combinedFeed.length === 0}
				<div class="empty-state">
					<Rss size={48} />
					<h2>No Content Yet</h2>
					<p class="text-muted">The users you follow haven't posted anything yet.</p>
				</div>
			{:else}
				<div class="feed-grid">
					{#each $combinedFeed as entry (entry.item.id)}
						{#if entry.type === 'idea'}
							<IdeaCard idea={entry.item as any} />
						{:else}
							<JobCard job={entry.item as Job} />
						{/if}
					{/each}
				</div>
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

	.feed-grid {
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
</style>
