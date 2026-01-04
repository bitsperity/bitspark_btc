<!--
  JobsExplorer - Main jobs page with grouped view
  
  Features:
  - Jobs grouped by Idea (collapsible)
  - Status tabs: All, Open, Assigned, Completed
  - Search across jobs and ideas
  - Language filter
-->
<script lang="ts">
	import { jobService, ideaService } from '$lib/services';
	import type { Job, JobStatus } from '$lib/types/job';
	import type { Idea } from '$lib/types/idea';
	import { Stack, Row, Input, Skeleton, Button } from '$lib/components';
	import IdeaJobGroup from './IdeaJobGroup.svelte';
	import { onDestroy } from 'svelte';
	import { createSubscription, NOSTR_KINDS } from '$lib/nostr';
	import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
	import { Search, RefreshCw, WifiOff } from 'lucide-svelte';

	// Subscriptions for jobs and ideas
	const jobSubscription = createSubscription<Job>(
		{ kinds: [NOSTR_KINDS.JOB as number], '#s': ['bitspark'], limit: 100 },
		{ timeout: 10000 },
		(event: NDKEvent) => jobService.parseJobEvent(event)
	);

	const ideaSubscription = createSubscription<Idea>(
		{ kinds: [NOSTR_KINDS.IDEA as number], '#s': ['bitspark'], limit: 100 },
		{ timeout: 10000 },
		(event: NDKEvent) => ideaService.parseIdeaEvent(event)
	);

	const { store: jobs, state: jobsState, retry: retryJobs } = jobSubscription;
	const { store: ideas, state: ideasState } = ideaSubscription;

	// State
	let searchQuery = $state('');
	let activeTab = $state<'all' | 'open' | 'assigned' | 'completed'>('all');
	let jobsWithStatus = $state<{ job: Job; derivedStatus: JobStatus }[]>([]);

	// Derive status for each job
	$effect(() => {
		if ($jobs.length > 0) {
			Promise.all(
				$jobs.map(async (job: Job) => {
					const derivedStatus = await jobService.deriveJobStatus(job.id);
					return { job, derivedStatus };
				})
			).then(results => {
				jobsWithStatus = results;
			});
		}
	});

	// Filter by status tab
	const filteredByStatus = $derived(() => {
		if (activeTab === 'all') return jobsWithStatus;
		return jobsWithStatus.filter(j => j.derivedStatus === activeTab);
	});

	// Filter by search
	const filteredJobs = $derived(() => {
		const filtered = filteredByStatus();
		if (!searchQuery.trim()) return filtered;
		
		const query = searchQuery.toLowerCase();
		return filtered.filter(({ job }) => 
			job.title.toLowerCase().includes(query) ||
			job.content?.toLowerCase().includes(query)
		);
	});

	// Group jobs by idea
	const groupedByIdea = $derived(() => {
		const filtered = filteredJobs();
		const groups = new Map<string, { idea: Idea | null; jobs: typeof filtered }>();
		
		for (const jobItem of filtered) {
			const ideaId = jobItem.job.ideaId;
			if (!groups.has(ideaId)) {
				const idea = $ideas.find(i => i.id === ideaId) ?? null;
				groups.set(ideaId, { idea, jobs: [] });
			}
			groups.get(ideaId)!.jobs.push(jobItem);
		}
		
		// Sort by number of open jobs (most first)
		return Array.from(groups.values())
			.filter(g => g.idea !== null)
			.sort((a, b) => {
				const aOpen = a.jobs.filter(j => j.derivedStatus === 'open').length;
				const bOpen = b.jobs.filter(j => j.derivedStatus === 'open').length;
				return bOpen - aOpen;
			});
	});

	// Counts for tabs
	const counts = $derived({
		all: jobsWithStatus.length,
		open: jobsWithStatus.filter(j => j.derivedStatus === 'open').length,
		assigned: jobsWithStatus.filter(j => j.derivedStatus === 'assigned').length,
		completed: jobsWithStatus.filter(j => j.derivedStatus === 'completed').length
	});

	const isLoading = $derived($jobsState === 'loading' || $ideasState === 'loading');
	const isTimeout = $derived($jobsState === 'timeout');

	onDestroy(() => {
		jobSubscription.unsubscribe();
		ideaSubscription.unsubscribe();
	});
</script>

<div class="jobs-explorer">
	<!-- Search -->
	<div class="search-bar">
		<Search size={18} class="search-icon" />
		<input 
			type="text" 
			placeholder="Search jobs..." 
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

	<!-- Status Tabs -->
	<div class="tabs">
		<button 
			class="tab" 
			class:active={activeTab === 'all'}
			onclick={() => activeTab = 'all'}
		>
			All
			<span class="count">{counts.all}</span>
		</button>
		<button 
			class="tab" 
			class:active={activeTab === 'open'}
			onclick={() => activeTab = 'open'}
		>
			Open
			{#if counts.open > 0}
				<span class="count open">{counts.open}</span>
			{/if}
		</button>
		<button 
			class="tab" 
			class:active={activeTab === 'assigned'}
			onclick={() => activeTab = 'assigned'}
		>
			Assigned
			{#if counts.assigned > 0}
				<span class="count assigned">{counts.assigned}</span>
			{/if}
		</button>
		<button 
			class="tab" 
			class:active={activeTab === 'completed'}
			onclick={() => activeTab = 'completed'}
		>
			Completed
			{#if counts.completed > 0}
				<span class="count completed">{counts.completed}</span>
			{/if}
		</button>
	</div>

	<!-- Content -->
	{#if isLoading}
		<Stack gap={3}>
			{#each Array(3) as _}
				<Skeleton width="100%" height="80px" />
			{/each}
		</Stack>
	{:else if isTimeout}
		<div class="timeout-state">
			<WifiOff size={48} />
			<h3>Connection Timeout</h3>
			<p>Could not load jobs from relays.</p>
			<Button variant="primary" onclick={retryJobs}>
				<RefreshCw size={16} />
				<span>Retry</span>
			</Button>
		</div>
	{:else if groupedByIdea().length === 0}
		<div class="empty-state">
			<p>No jobs found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
		</div>
	{:else}
		<Stack gap={3}>
			{#each groupedByIdea() as group, i (group.idea?.id)}
				<IdeaJobGroup 
					idea={group.idea!} 
					jobs={group.jobs}
					defaultExpanded={i < 3}
				/>
			{/each}
		</Stack>
	{/if}
</div>

<style>
	.jobs-explorer {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.search-bar {
		position: relative;
		display: flex;
		align-items: center;
	}

	:global(.search-icon) {
		position: absolute;
		left: var(--space-4);
		color: var(--text-muted);
	}

	.search-input {
		width: 100%;
		padding: var(--space-3) var(--space-4) var(--space-3) calc(var(--space-4) + 26px);
		background: var(--bg-glass);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.search-input:focus {
		border-color: var(--orange-500);
	}

	.tabs {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		background: var(--bg-subtle);
		border-radius: var(--radius-md);
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: var(--text-primary);
		background: var(--bg-card);
	}

	.count {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: var(--radius-full);
		background: rgba(255, 255, 255, 0.1);
	}

	.count.open {
		background: rgba(16, 185, 129, 0.2);
		color: var(--success);
	}

	.count.assigned {
		background: rgba(251, 191, 36, 0.2);
		color: var(--warning);
	}

	.count.completed {
		background: rgba(107, 114, 128, 0.2);
		color: var(--text-muted);
	}

	.empty-state,
	.timeout-state {
		text-align: center;
		padding: var(--space-12);
		color: var(--text-muted);
	}

	.timeout-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.timeout-state h3 {
		color: var(--text-primary);
		margin: 0;
	}

	.timeout-state p {
		margin: 0;
	}
</style>
