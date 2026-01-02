<!--
  CounterOfferModal - Modal wrapper for counter-offer form
-->
<script lang="ts">
	import { Button, Card, Stack, Row } from '$lib/components';
	import { OfferForm } from '$lib/components/offers';
	import type { Offer } from '$lib/types/offer';
	import { X } from 'lucide-svelte';

	interface Props {
		targetOffer: Offer;
		onclose: () => void;
		onsent: () => void;
	}

	let { targetOffer, onclose, onsent }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}
</script>

<div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
	<div class="modal-content">
		<Card>
			<Stack gap={4}>
				<Row justify="between">
					<h2>Counter Offer</h2>
					<Button variant="ghost" size="sm" onclick={onclose}>
						<X size={20} />
					</Button>
				</Row>

				<div class="original-offer">
					<span class="label">Responding to:</span>
					<span class="value">{targetOffer.bid.toLocaleString()} sats • {targetOffer.duration} days</span>
				</div>

				<OfferForm
					jobId={targetOffer.jobId}
					recipientPubkey={targetOffer.pubkey}
					prevOffer={targetOffer}
					oncancel={onclose}
					onsent={onsent}
				/>
			</Stack>
		</Card>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-4);
	}

	.modal-content {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.original-offer {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.03);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.label {
		color: var(--text-muted);
	}

	.value {
		color: var(--text-secondary);
		font-weight: 500;
	}
</style>
