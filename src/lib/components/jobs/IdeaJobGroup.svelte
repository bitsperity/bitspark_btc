<!--
  IdeaJobGroup - Collapsible group of jobs under an idea
  
  Shows:
  - Idea title + author
  - Job count badge
  - Collapsible list of jobs
-->
<script lang="ts">
	import { Row, Stack, Avatar, Badge } from '$lib/components';
	import JobListItem from './JobListItem.svelte';
	import type { Job, JobStatus } from '$lib/types/job';
	import type { Idea } from '$lib/types/idea';
	import { profileService } from '$lib/services';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { ChevronDown, ChevronRight, Briefcase } from 'lucide-svelte';

	interface Props {
		idea: Idea;
		jobs: { job: Job; derivedStatus: JobStatus }[];
		defaultExpanded?: boolean;
	}

	let { idea, jobs, defaultExpanded = false }: Props = $props();

	let expanded = $state(defaultExpanded);
	let authorProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		profileService.getProfile(idea.pubkey).then(p => authorProfile = p);
	});

	const openCount = $derived(jobs.filter(j => j.derivedStatus === 'open').length);
	const authorName = $derived(authorProfile?.name ?? 'Anonymous');
	const authorAvatar = $derived(authorProfile?.image);
</script>

<div class="idea-job-group">
	<button class="group-header" onclick={() => expanded = !expanded}>
		<Row justify="between" class="header-content">
			<Row gap={3}>
				<span class="chevron">
					{#if expanded}
						<ChevronDown size={18} />
					{:else}
						<ChevronRight size={18} />
					{/if}
				</span>
				<div class="idea-info">
					<span class="idea-title">{idea.title}</span>
					<span class="job-count">
						{openCount > 0 ? `${openCount} open job${openCount > 1 ? 's' : ''}` : 'No open jobs'}
					</span>
				</div>
			</Row>
			<Row gap={2} class="author-info">
				<Avatar src={authorAvatar} fallback={authorName[0]} size="xs" />
				<span class="author-name">{authorName}</span>
			</Row>
		</Row>
	</button>

	{#if expanded}
		<div class="jobs-list">
			{#each jobs as { job } (job.id)}
				<JobListItem {job} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.idea-job-group {
		background: var(--bg-glass);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.group-header {
		width: 100%;
		padding: var(--space-4);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s ease;
	}

	.group-header:hover {
		background: var(--bg-subtle);
	}

	:global(.header-content) {
		width: 100%;
	}

	.chevron {
		color: var(--text-muted);
		display: flex;
		align-items: center;
	}

	.idea-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.idea-title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.job-count {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	:global(.author-info) {
		flex-shrink: 0;
	}

	.author-name {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.jobs-list {
		padding: 0 var(--space-4) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
