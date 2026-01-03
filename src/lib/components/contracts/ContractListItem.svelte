<!--
  ContractListItem - Compact list row for contract display
  
  Shows: Status icon, Job title, Partner, Amount, Action button
-->
<script lang="ts">
	import { Row, Badge, Avatar } from '$lib/components';
	import type { Contract, ContractConfirmation, PullRequest } from '$lib/types/offer';
	import { profileService, contractService, jobService, authService } from '$lib/services';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import type { Job } from '$lib/types/job';
	import { Clock, CheckCircle, FileText, CircleDot, ChevronRight } from 'lucide-svelte';

	interface Props {
		contract: Contract;
		role: 'io' | 'dev';
		onclick?: () => void;
	}

	let { contract, role, onclick }: Props = $props();

	// Fetch related data
	let partnerProfile = $state<NDKUserProfile | null>(null);
	let job = $state<Job | null>(null);
	let confirmation = $state<ContractConfirmation | null>(null);
	let pr = $state<PullRequest | null>(null);

	$effect(() => {
		const partnerPubkey = role === 'io' ? contract.developerPubkey : contract.ioPubkey;
		profileService.getProfile(partnerPubkey).then(p => partnerProfile = p ?? null);
		jobService.getJob(contract.jobId).then(j => job = j ?? null);
		contractService.getConfirmation(contract.id).then(c => confirmation = c ?? null);
		contractService.getLatestPR(contract.id).then(p => pr = p ?? null);
	});

	// Determine status
	const status = $derived.by(() => {
		if (!confirmation) return 'pending';
		if (!pr) return 'awaiting_pr';
		if (pr.status === 'approved') return 'completed';
		return 'review';
	});

	const statusConfig = $derived.by(() => {
		switch (status) {
			case 'pending': return { icon: Clock, label: 'Awaiting Sign', class: 'status-pending' };
			case 'awaiting_pr': return { icon: CircleDot, label: 'In Progress', class: 'status-progress' };
			case 'review': return { icon: FileText, label: 'Review', class: 'status-review' };
			case 'completed': return { icon: CheckCircle, label: 'Done', class: 'status-done' };
			default: return { icon: Clock, label: 'Unknown', class: '' };
		}
	});

	const formattedBid = $derived(contract.agreedBid.toLocaleString());
</script>

<button class="contract-list-item" onclick={onclick}>
	<Row gap={3} class="item-content">
		<!-- Status Icon -->
		<div class="status-icon {statusConfig.class}">
			<svelte:component this={statusConfig.icon} size={16} />
		</div>

		<!-- Job Title -->
		<div class="job-info">
			<span class="job-title">{job?.title ?? 'Loading...'}</span>
			<span class="job-status">{statusConfig.label}</span>
		</div>

		<!-- Partner -->
		<div class="partner">
			<Avatar 
				src={partnerProfile?.image} 
				fallback={partnerProfile?.name?.[0] ?? '?'} 
				size="xs" 
			/>
			<span class="partner-name">@{partnerProfile?.name ?? 'Anonymous'}</span>
		</div>

		<!-- Amount -->
		<div class="amount">
			<span class="amount-value">{formattedBid}</span>
			<span class="amount-unit">sats</span>
		</div>

		<!-- Action Arrow -->
		<ChevronRight size={20} class="arrow" />
	</Row>
</button>

<style>
	.contract-list-item {
		width: 100%;
		background: var(--bg-glass);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.contract-list-item:hover {
		background: var(--bg-glass-hover);
		border-color: var(--border-default);
	}

	:global(.item-content) {
		align-items: center;
	}

	.status-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.status-pending {
		background: rgba(251, 191, 36, 0.15);
		color: var(--warning);
	}

	.status-progress {
		background: rgba(59, 130, 246, 0.15);
		color: var(--info);
	}

	.status-review {
		background: rgba(249, 115, 22, 0.15);
		color: var(--orange-500);
	}

	.status-done {
		background: rgba(16, 185, 129, 0.15);
		color: var(--success);
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

	.job-status {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.partner {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 120px;
	}

	.partner-name {
		font-size: 0.875rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.amount {
		display: flex;
		align-items: baseline;
		gap: 4px;
		min-width: 100px;
		justify-content: flex-end;
	}

	.amount-value {
		font-weight: 600;
		color: var(--orange-500);
	}

	.amount-unit {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	:global(.arrow) {
		color: var(--text-muted);
		flex-shrink: 0;
	}
</style>
