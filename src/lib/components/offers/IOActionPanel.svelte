<!--
  IOActionPanel - Actions available to Issue Owner (job creator)
  
  Actions:
  - Counter: Opens modal to send counter-offer
  - Decline: Ends negotiation (confirm first)
  - Create Contract: When Dev has accepted
-->
<script lang="ts">
	import { Button, Row, Stack } from '$lib/components';
	import type { Offer } from '$lib/types/offer';
	import { Send, X, FileCheck } from 'lucide-svelte';

	interface Props {
		pendingOffersForMe: Offer[];
		canCreateContract: boolean;
		oncounter: (offer: Offer) => void;
		ondecline: (offer: Offer) => void;
		oncreatecontract: () => void;
	}

	let { pendingOffersForMe, canCreateContract, oncounter, ondecline, oncreatecontract }: Props = $props();
</script>

<div class="io-action-panel">
	{#if canCreateContract}
		<!-- Dev accepted, IO can create contract -->
		<div class="action-box success">
			<FileCheck size={20} />
			<div class="action-text">
				<span class="action-title">Developer accepted!</span>
				<span class="action-desc">Ready to create the contract.</span>
			</div>
			<Button variant="primary" onclick={oncreatecontract}>
				Create Contract
			</Button>
		</div>
	{:else if pendingOffersForMe.length > 0}
		<!-- Pending offers to respond to -->
		<Stack gap={3}>
			<p class="section-label">Respond to offers:</p>
			{#each pendingOffersForMe as offer (offer.id)}
				<div class="offer-action-row">
					<span class="offer-info">{offer.bid.toLocaleString()} sats • {offer.duration}d</span>
					<Row gap={2}>
						<Button variant="secondary" size="sm" onclick={() => oncounter(offer)}>
							<Send size={14} />
							Counter
						</Button>
						<Button variant="ghost" size="sm" onclick={() => ondecline(offer)}>
							Decline
						</Button>
					</Row>
				</div>
			{/each}
		</Stack>
	{:else}
		<p class="no-actions">Waiting for developer response...</p>
	{/if}
</div>

<style>
	.io-action-panel {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.action-box {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border-radius: var(--radius-md);
	}

	.action-box.success {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
	}

	.action-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.action-title {
		font-weight: 600;
	}

	.action-desc {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.section-label {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.offer-action-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
	}

	.offer-info {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.no-actions {
		color: var(--text-muted);
		font-size: 0.875rem;
		text-align: center;
		margin: 0;
	}
</style>
