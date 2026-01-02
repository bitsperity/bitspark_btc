<!--
  ContractHeader - Contract header with status and job link
-->
<script lang="ts">
	import { Row, Badge } from '$lib/components';
	import type { Contract } from '$lib/types/offer';
	import type { Job } from '$lib/types/job';
	import type { ContractPhase } from '$lib/composables';
	import { FileCheck, Briefcase } from 'lucide-svelte';

	interface Props {
		contract: Contract;
		job: Job | null;
		phase: ContractPhase;
	}

	let { contract, job, phase }: Props = $props();

	const statusConfig = $derived({
		PENDING_CONFIRMATION: { label: 'Signing', variant: 'warning' as const },
		AWAITING_PR: { label: 'In Progress', variant: 'warning' as const },
		PR_UNDER_REVIEW: { label: 'Under Review', variant: 'warning' as const },
		COMPLETED: { label: 'Completed', variant: 'success' as const },
		DISPUTED: { label: 'Disputed', variant: 'error' as const }
	}[phase]);
</script>

<header class="contract-header">
	<Row justify="between">
		<Row gap={3}>
			<FileCheck size={28} class="contract-icon" />
			<h1 class="title">Contract</h1>
		</Row>
		<Badge variant={statusConfig.variant}>
			{statusConfig.label}
		</Badge>
	</Row>

	{#if job}
		<a href="/jobs/{job.id}" class="job-link">
			<Briefcase size={16} />
			<span>{job.title}</span>
		</a>
	{/if}
</header>

<style>
	.contract-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	:global(.contract-icon) {
		color: var(--orange-500);
	}

	.job-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		padding: var(--space-2) var(--space-3);
		background: var(--bg-glass);
		border-radius: var(--radius-md);
		transition: all 0.2s ease;
	}

	.job-link:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}
</style>
