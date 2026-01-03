<!--
  JobListInner - Tabbed job list with status filtering
  
  Features:
  - Status tabs: Open, Assigned, In Review, Completed
  - Compact list view
  - Collapse/expand for many items
-->
<script lang="ts">
	import { jobService } from '$lib/services';
	import type { Job, JobStatus } from '$lib/types/job';
	import { Skeleton, Stack, Button } from '$lib/components';
	import JobListItem from './JobListItem.svelte';
	import { onDestroy } from 'svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	interface Props {
		language?: string;
		ideaId?: string;
	}

	let { language, ideaId }: Props = $props();

	// Subscribe based on filter type
	const jobsStore = ideaId 
		? jobService.subscribeToIdeaJobs(ideaId)
		: jobService.subscribeToJobs(language);

	let jobsWithStatus = $state<{ job: Job; derivedStatus: JobStatus }[]>([]);
	let activeTab = $state<JobStatus>('open');
	let showAll = $state(false);
	const MAX_VISIBLE = 5;

	// Parse jobs and derive their status
	$effect(() => {
		const events = $jobsStore as NDKEvent[];
		const jobs = events.map(event => jobService.parseJobEvent(event));
		
		// Derive status for each job
		Promise.all(
			jobs.map(async (job) => {
				const derivedStatus = await jobService.deriveJobStatus(job.id);
				return { job, derivedStatus };
			})
		).then(results => {
			jobsWithStatus = results;
		});
	});

	const isLoading = $derived($jobsStore.length === 0 && jobsWithStatus.length === 0);

	// Group jobs by status
	const openJobs = $derived(jobsWithStatus.filter(j => j.derivedStatus === 'open'));
	const assignedJobs = $derived(jobsWithStatus.filter(j => j.derivedStatus === 'assigned'));
	const reviewJobs = $derived(jobsWithStatus.filter(j => j.derivedStatus === 'review'));
	const completedJobs = $derived(jobsWithStatus.filter(j => j.derivedStatus === 'completed'));

	const currentJobs = $derived({
		open: openJobs,
		assigned: assignedJobs,
		review: reviewJobs,
		completed: completedJobs
	}[activeTab]);

	const visibleJobs = $derived(
		showAll ? currentJobs : currentJobs.slice(0, MAX_VISIBLE)
	);

	const hasMore = $derived(currentJobs.length > MAX_VISIBLE);

	onDestroy(() => jobsStore.unsubscribe());

	function selectTab(tab: JobStatus) {
		activeTab = tab;
		showAll = false;
	}
</script>

<div class="job-list-container">
	{#if isLoading}
		<Stack gap={2}>
			{#each Array(3) as _}
				<Skeleton width="100%" height="56px" />
			{/each}
		</Stack>
	{:else if jobsWithStatus.length === 0}
		<div class="empty-state">
			<p class="text-muted">No jobs yet.</p>
		</div>
	{:else}
		<!-- Status Tabs -->
		<div class="tabs">
			<button 
				class="tab" 
				class:active={activeTab === 'open'}
				onclick={() => selectTab('open')}
			>
				Open
				{#if openJobs.length > 0}
					<span class="count open">{openJobs.length}</span>
				{/if}
			</button>
			<button 
				class="tab" 
				class:active={activeTab === 'assigned'}
				onclick={() => selectTab('assigned')}
			>
				Assigned
				{#if assignedJobs.length > 0}
					<span class="count assigned">{assignedJobs.length}</span>
				{/if}
			</button>
			<button 
				class="tab" 
				class:active={activeTab === 'review'}
				onclick={() => selectTab('review')}
			>
				In Review
				{#if reviewJobs.length > 0}
					<span class="count review">{reviewJobs.length}</span>
				{/if}
			</button>
			<button 
				class="tab" 
				class:active={activeTab === 'completed'}
				onclick={() => selectTab('completed')}
			>
				Completed
				{#if completedJobs.length > 0}
					<span class="count completed">{completedJobs.length}</span>
				{/if}
			</button>
		</div>

		<!-- Job List -->
		{#if currentJobs.length === 0}
			<div class="empty-tab">
				<p class="text-muted">No {activeTab} jobs.</p>
			</div>
		{:else}
			<Stack gap={2}>
				{#each visibleJobs as { job } (job.id)}
					<JobListItem {job} />
				{/each}
			</Stack>

			{#if hasMore && !showAll}
				<button class="show-more" onclick={() => showAll = true}>
					Show all {currentJobs.length} {activeTab} jobs →
				</button>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.job-list-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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
		padding: var(--space-2) var(--space-3);
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
		padding: 2px 6px;
		border-radius: var(--radius-full);
	}

	.count.open {
		background: rgba(16, 185, 129, 0.2);
		color: var(--success);
	}

	.count.assigned {
		background: rgba(251, 191, 36, 0.2);
		color: var(--warning);
	}

	.count.review {
		background: rgba(59, 130, 246, 0.2);
		color: var(--info);
	}

	.count.completed {
		background: rgba(107, 114, 128, 0.2);
		color: var(--text-muted);
	}

	.empty-state,
	.empty-tab {
		text-align: center;
		padding: var(--space-8);
	}

	.show-more {
		background: transparent;
		border: none;
		color: var(--orange-400);
		font-size: 0.875rem;
		cursor: pointer;
		padding: var(--space-2);
		text-align: center;
	}

	.show-more:hover {
		text-decoration: underline;
	}
</style>
