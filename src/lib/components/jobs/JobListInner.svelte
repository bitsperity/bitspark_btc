<!--
  JobListInner - Actual subscription component
-->
<script lang="ts">
	import { jobService } from '$lib/services';
	import type { Job } from '$lib/types/job';
	import { Skeleton, Stack } from '$lib/components';
	import JobCard from './JobCard.svelte';
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

	const jobs = $derived(
		($jobsStore as NDKEvent[]).map(event => jobService.parseJobEvent(event))
	);

	const isLoading = $derived($jobsStore.length === 0);

	onDestroy(() => jobsStore.unsubscribe());
</script>

{#if isLoading}
	<div class="jobs-grid">
		{#each Array(4) as _}
			<div class="skeleton-card">
				<Skeleton width="60%" height="1.25rem" />
				<Skeleton width="100%" height="1rem" />
				<Skeleton width="40%" height="1rem" />
			</div>
		{/each}
	</div>
{:else if jobs.length === 0}
	<div class="empty-state">
		<p class="text-muted">No jobs found.</p>
	</div>
{:else}
	<div class="jobs-grid">
		{#each jobs as job (job.id)}
			<JobCard {job} />
		{/each}
	</div>
{/if}

<style>
	.jobs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.skeleton-card {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-12);
	}
</style>
