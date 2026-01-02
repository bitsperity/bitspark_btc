<!--
  ContractPhaseCard - Renders phase-specific content for contract detail
  
  Unified component for both IO and Dev views based on current phase.
-->
<script lang="ts">
	import { Button, Stack, Row, Badge } from '$lib/components';
	import type { ContractPhase, ContractAction } from '$lib/composables';
	import type { ContractConfirmation, PullRequest } from '$lib/types/offer';
	import { Shield, Send, Check, MessageCircle, RefreshCw, Clock, CheckCircle } from 'lucide-svelte';

	interface Props {
		phase: ContractPhase;
		userRole: 'io' | 'dev' | null;
		confirmation: ContractConfirmation | null;
		pr: PullRequest | null;
		isActioning: boolean;
		onconfirm: () => void;
		onsubmitpr: () => void;
		onapprovepr: () => void;
		onrequestchanges: () => void;
	}

	let { phase, userRole, confirmation, pr, isActioning, onconfirm, onsubmitpr, onapprovepr, onrequestchanges }: Props = $props();

	const phaseLabels: Record<ContractPhase, string> = {
		'PENDING_CONFIRMATION': 'Contract Signing',
		'AWAITING_PR': 'Development',
		'PR_UNDER_REVIEW': 'Code Review',
		'COMPLETED': 'Completed',
		'DISPUTED': 'Disputed'
	};
</script>

<div class="phase-card phase-{phase.toLowerCase().replace('_', '-')}">
	<Stack gap={4}>
		<!-- Phase Header -->
		<Row justify="between" class="phase-header">
			<h3 class="phase-title">{phaseLabels[phase]}</h3>
			<Badge variant={phase === 'COMPLETED' ? 'success' : phase === 'DISPUTED' ? 'error' : 'warning'}>
				{phase.replace('_', ' ')}
			</Badge>
		</Row>

		<!-- Phase Content based on role and phase -->
		<div class="phase-content">
			{#if phase === 'PENDING_CONFIRMATION'}
				{#if userRole === 'dev'}
					<div class="action-section">
						<p class="phase-description">
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
				{:else if userRole === 'io'}
					<div class="waiting-section">
						<Clock size={24} class="waiting-icon" />
						<p class="waiting-text">Waiting for developer to sign the contract...</p>
					</div>
				{/if}
			
			{:else if phase === 'AWAITING_PR'}
				{#if userRole === 'dev'}
					<div class="action-section">
						<p class="phase-description">
							Contract signed! Submit your pull request when the work is complete.
						</p>
						<Button variant="primary" onclick={onsubmitpr} disabled={isActioning}>
							<Send size={16} />
							<span>Submit PR</span>
						</Button>
					</div>
				{:else if userRole === 'io'}
					<div class="status-section">
						<CheckCircle size={24} class="success-icon" />
						<div>
							<strong>Contract Signed</strong>
							<p class="status-text">Developer has confirmed. Waiting for PR submission...</p>
						</div>
					</div>
				{/if}
			
			{:else if phase === 'PR_UNDER_REVIEW'}
				{#if userRole === 'io'}
					<div class="action-section">
						<p class="phase-description">
							Review the submitted pull request and provide feedback.
						</p>
						<Row gap={2}>
							<Button variant="primary" onclick={onapprovepr} disabled={isActioning}>
								<Check size={16} />
								<span>Approve</span>
							</Button>
							<Button variant="secondary" onclick={onrequestchanges} disabled={isActioning}>
								<MessageCircle size={16} />
								<span>Request Changes</span>
							</Button>
						</Row>
					</div>
				{:else if userRole === 'dev'}
					<div class="status-section">
						<Clock size={24} class="waiting-icon" />
						<div>
							<strong>PR Submitted</strong>
							<p class="status-text">Waiting for review from Idea Owner...</p>
						</div>
					</div>
				{/if}

			{:else if phase === 'COMPLETED'}
				<div class="completed-section">
					<CheckCircle size={32} class="success-icon" />
					<div>
						<strong>Contract Completed</strong>
						<p class="status-text">Work has been approved.</p>
					</div>
				</div>
			{/if}
		</div>
	</Stack>
</div>

<style>
	.phase-card {
		background: var(--bg-glass);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.phase-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.phase-description {
		color: var(--text-muted);
		font-size: 0.875rem;
		line-height: 1.5;
		margin-bottom: var(--space-3);
	}

	.action-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.waiting-section {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(251, 191, 36, 0.1);
		border-radius: var(--radius-md);
	}

	:global(.waiting-icon) {
		color: var(--warning);
		flex-shrink: 0;
	}

	.waiting-text {
		color: var(--text-secondary);
		margin: 0;
	}

	.status-section {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(16, 185, 129, 0.1);
		border-radius: var(--radius-md);
	}

	:global(.success-icon) {
		color: var(--success);
		flex-shrink: 0;
	}

	.status-text {
		color: var(--text-muted);
		margin: 0;
		font-size: 0.875rem;
	}

	.completed-section {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background: rgba(16, 185, 129, 0.15);
		border-radius: var(--radius-md);
		text-align: left;
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
