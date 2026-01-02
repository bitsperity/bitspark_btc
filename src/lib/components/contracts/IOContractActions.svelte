<!--
  IOContractActions - Actions for Idea Owner in contract detail
  
  Shows phase-appropriate content for IO perspective:
  - PENDING_CONFIRMATION: Waiting for Dev to sign
  - AWAITING_PR: Contract signed, waiting for PR
  - PR_UNDER_REVIEW: Review buttons (Approve/Request Changes)
  - COMPLETED: Done summary
-->
<script lang="ts">
	import { Button, Stack, Row, Badge, Card } from '$lib/components';
	import type { ContractPhase } from '$lib/composables';
	import type { ContractConfirmation, PullRequest } from '$lib/types/offer';
	import { Clock, CheckCircle, Check, MessageCircle, Zap } from 'lucide-svelte';

	interface Props {
		phase: ContractPhase;
		confirmation: ContractConfirmation | null;
		pr: PullRequest | null;
		isActioning: boolean;
		onapprovepr: () => void;
		onrequestchanges: () => void;
	}

	let { phase, confirmation, pr, isActioning, onapprovepr, onrequestchanges }: Props = $props();
</script>

<Card>
	<Stack gap={4}>
		<Row justify="between">
			<h3 class="section-title">Contract Status</h3>
			<Badge variant={phase === 'COMPLETED' ? 'success' : 'warning'}>
				{phase === 'PENDING_CONFIRMATION' ? 'Awaiting Signature' :
				 phase === 'AWAITING_PR' ? 'In Development' :
				 phase === 'PR_UNDER_REVIEW' ? 'Review Needed' :
				 phase === 'COMPLETED' ? 'Completed' : phase}
			</Badge>
		</Row>

		{#if phase === 'PENDING_CONFIRMATION'}
			<div class="status-box waiting">
				<Clock size={24} />
				<div>
					<strong>Waiting for Developer</strong>
					<p>Developer needs to sign the contract to confirm acceptance.</p>
				</div>
			</div>

		{:else if phase === 'AWAITING_PR'}
			<div class="status-box success">
				<CheckCircle size={24} />
				<div>
					<strong>Contract Signed</strong>
					<p>Developer has confirmed. Waiting for pull request submission...</p>
				</div>
			</div>

		{:else if phase === 'PR_UNDER_REVIEW'}
			<div class="action-section">
				<p class="description">
					Developer has submitted their work. Review the pull request and provide feedback.
				</p>
				<Row gap={2}>
					<Button variant="primary" onclick={onapprovepr} disabled={isActioning}>
						<Check size={16} />
						<span>Approve & Pay</span>
					</Button>
					<Button variant="secondary" onclick={onrequestchanges} disabled={isActioning}>
						<MessageCircle size={16} />
						<span>Request Changes</span>
					</Button>
				</Row>
			</div>

		{:else if phase === 'COMPLETED'}
			<div class="status-box success">
				<Zap size={24} />
				<div>
					<strong>Contract Completed</strong>
					<p>Work has been approved and payment processed.</p>
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

	.status-box p {
		color: var(--text-muted);
		margin: 0;
		font-size: 0.875rem;
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
	}
</style>
