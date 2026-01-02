<!--
  DevContractActions - Actions for Developer in contract detail
  
  Shows phase-appropriate content for Dev perspective:
  - PENDING_CONFIRMATION: Confirm & Sign button
  - AWAITING_PR: Submit PR button
  - PR_UNDER_REVIEW: Waiting for IO review
  - COMPLETED: Done summary
-->
<script lang="ts">
	import { Button, Stack, Row, Badge, Card } from '$lib/components';
	import type { ContractPhase } from '$lib/composables';
	import type { ContractConfirmation, PullRequest } from '$lib/types/offer';
	import { Shield, Send, Clock, CheckCircle, Zap, RefreshCw } from 'lucide-svelte';

	interface Props {
		phase: ContractPhase;
		confirmation: ContractConfirmation | null;
		pr: PullRequest | null;
		isActioning: boolean;
		onconfirm: () => void;
		onsubmitpr: () => void;
	}

	let { phase, confirmation, pr, isActioning, onconfirm, onsubmitpr }: Props = $props();
</script>

<Card>
	<Stack gap={4}>
		<Row justify="between">
			<h3 class="section-title">Your Actions</h3>
			<Badge variant={phase === 'COMPLETED' ? 'success' : 'warning'}>
				{phase === 'PENDING_CONFIRMATION' ? 'Signature Required' :
				 phase === 'AWAITING_PR' ? 'Submit Work' :
				 phase === 'PR_UNDER_REVIEW' ? 'Under Review' :
				 phase === 'COMPLETED' ? 'Completed' : phase}
			</Badge>
		</Row>

		{#if phase === 'PENDING_CONFIRMATION'}
			<div class="action-section">
				<p class="description">
					Sign this contract to confirm you accept the terms. 
					Your signature creates a cryptographic proof of agreement.
				</p>
				<Button variant="primary" onclick={onconfirm} disabled={isActioning}>
					{#if isActioning}
						<RefreshCw size={16} class="spinning" />
					{:else}
						<Shield size={16} />
					{/if}
					<span>Confirm & Sign</span>
				</Button>
			</div>

		{:else if phase === 'AWAITING_PR'}
			<div class="action-section">
				<div class="status-box success">
					<CheckCircle size={20} />
					<span>Contract signed successfully!</span>
				</div>
				<p class="description">
					Submit your pull request when the work is complete.
				</p>
				<Button variant="primary" onclick={onsubmitpr} disabled={isActioning}>
					<Send size={16} />
					<span>Submit PR</span>
				</Button>
			</div>

		{:else if phase === 'PR_UNDER_REVIEW'}
			<div class="status-box waiting">
				<Clock size={24} />
				<div>
					<strong>PR Under Review</strong>
					<p>Waiting for Idea Owner to review your submission...</p>
				</div>
			</div>

		{:else if phase === 'COMPLETED'}
			<div class="status-box success">
				<Zap size={24} />
				<div>
					<strong>Contract Completed</strong>
					<p>Your work has been approved!</p>
				</div>
			</div>
		{/if}
	</Stack>
</Card>

<style>
	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.action-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.description {
		color: var(--text-muted);
		font-size: 0.875rem;
		margin: 0;
		line-height: 1.5;
	}

	.status-box {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
	}

	.status-box.waiting {
		background: rgba(251, 191, 36, 0.1);
		color: var(--warning);
	}

	.status-box.success {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
	}

	.status-box div {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.status-box strong {
		color: var(--text-primary);
	}

	.status-box p, .status-box span {
		color: var(--text-muted);
		margin: 0;
		font-size: 0.875rem;
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
