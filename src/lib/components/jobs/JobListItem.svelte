<!--
  JobListItem - Compact list row for job display
  
  Shows: Status icon, Title, Description preview, Bid (if available)
-->
<script lang="ts">
	import { Row, Badge } from '$lib/components';
	import type { Job, JobStatus } from '$lib/types/job';
	import { JOB_STATUS_CONFIG, LANGUAGE_LABELS, type ProgrammingLanguage } from '$lib/types/job';
	import { jobService } from '$lib/services';
	import { CheckCircle, CircleDot, FileText, Circle, ChevronRight } from 'lucide-svelte';

	interface Props {
		job: Job;
	}

	let { job }: Props = $props();

	// Derive actual status
	let derivedStatus = $state<JobStatus>(job.status);

	$effect(() => {
		jobService.deriveJobStatus(job.id).then(s => derivedStatus = s);
	});

	const statusConfig = $derived(JOB_STATUS_CONFIG[derivedStatus]);
	
	const statusIcon = $derived({
		open: Circle,
		assigned: CircleDot,
		review: FileText,
		completed: CheckCircle
	}[derivedStatus]);

	const primaryLanguage = $derived(
		job.languages[0] ? LANGUAGE_LABELS[job.languages[0] as ProgrammingLanguage] : null
	);
</script>

<a href="/jobs/{job.id}" class="job-list-item">
	<div class="status-icon {derivedStatus}">
		<svelte:component this={statusIcon} size={16} />
	</div>

	<div class="job-info">
		<span class="job-title">{job.title}</span>
		<span class="job-desc">{job.content?.slice(0, 60) || 'No description'}...</span>
	</div>

	{#if primaryLanguage}
		<Badge variant="secondary" size="sm">{primaryLanguage}</Badge>
	{/if}

	<Badge variant={statusConfig?.color as 'success' | 'warning' | 'info' | 'muted'} size="sm">
		{statusConfig?.label}
	</Badge>

	<ChevronRight size={16} class="arrow" />
</a>

<style>
	.job-list-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--bg-subtle);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.job-list-item:hover {
		background: var(--bg-elevated);
		border-color: var(--border-subtle);
	}

	.status-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.status-icon.open {
		background: rgba(16, 185, 129, 0.15);
		color: var(--success);
	}

	.status-icon.assigned {
		background: rgba(251, 191, 36, 0.15);
		color: var(--warning);
	}

	.status-icon.review {
		background: rgba(59, 130, 246, 0.15);
		color: var(--info);
	}

	.status-icon.completed {
		background: rgba(107, 114, 128, 0.15);
		color: var(--text-muted);
	}

	.job-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.job-title {
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.job-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.arrow) {
		color: var(--text-muted);
		flex-shrink: 0;
	}
</style>
