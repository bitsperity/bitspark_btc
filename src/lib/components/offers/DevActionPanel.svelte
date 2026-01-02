<!--
  DevActionPanel - Actions available to Developer (not job owner)
  
  Actions:
  - Accept: Accepts a specific counter-offer from IO
  - Counter: Opens modal to send counter-offer
  - Decline: Ends negotiation (confirm first)
-->
<script lang="ts">
	import { Button, Row, Stack } from '$lib/components';
	import type { Offer } from '$lib/types/offer';
	import { Check, Send } from 'lucide-svelte';

	interface Props {
		pendingOffersForMe: Offer[];
		onaccept: (offer: Offer) => void;
		oncounter: (offer: Offer) => void;
		ondecline: (offer: Offer) => void;
	}

	let { pendingOffersForMe, onaccept, oncounter, ondecline }: Props = $props();
</script>

<div class="dev-action-panel">
	{#if pendingOffersForMe.length > 0}
		<Stack gap={3}>
			<p class="section-label">Respond to counter-offers:</p>
			{#each pendingOffersForMe as offer (offer.id)}
				<div class="offer-action-card">
					<div class="offer-details">
						<span class="offer-bid">{offer.bid.toLocaleString()} sats</span>
						<span class="offer-duration">{offer.duration} days</span>
					</div>
					<Row gap={2}>
						<Button variant="ghost" size="sm" onclick={() => ondecline(offer)}>
							Decline
						</Button>
						<Button variant="secondary" size="sm" onclick={() => oncounter(offer)}>
							<Send size={14} />
							Counter
						</Button>
						<Button variant="primary" size="sm" onclick={() => onaccept(offer)}>
							<Check size={14} />
							Accept
						</Button>
					</Row>
				</div>
			{/each}
		</Stack>
	{:else}
		<p class="no-actions">Waiting for IO response...</p>
	{/if}
</div>

<style>
	.dev-action-panel {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.section-label {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.offer-action-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.offer-details {
		display: flex;
		gap: var(--space-3);
	}

	.offer-bid {
		font-weight: 600;
		color: var(--orange-400);
	}

	.offer-duration {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.no-actions {
		color: var(--text-muted);
		font-size: 0.875rem;
		text-align: center;
		margin: 0;
	}
</style>
