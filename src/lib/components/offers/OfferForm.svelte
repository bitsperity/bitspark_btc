<!--
  OfferForm - Create or counter an offer
-->
<script lang="ts">
	import { offerService, authService } from '$lib/services';
	import type { CreateOfferInput, Offer } from '$lib/types/offer';
	import { Card, Stack, Row, Input, Textarea, Button, Spinner } from '$lib/components';
	import { Send, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		jobId: string;
		recipientPubkey: string;
		prevOffer?: Offer;  // For counter-offers
		oncancel?: () => void;
		onsent?: () => void;
	}

	let { jobId, recipientPubkey, prevOffer, oncancel, onsent }: Props = $props();

	let isSubmitting = $state(false);
	let error = $state<string | undefined>(undefined);

	// Form fields - pre-fill from previous offer if counter
	let bid = $state(prevOffer?.bid ?? 0);
	let duration = $state(prevOffer?.duration ?? 7);
	let startDate = $state(prevOffer?.startDate ?? '');
	let terms = $state(prevOffer?.terms ?? '');
	let message = $state('');

	const isCounter = $derived(!!prevOffer);

	async function handleSubmit() {
		if (bid <= 0) {
			error = 'Bid must be greater than 0';
			return;
		}
		if (duration <= 0) {
			error = 'Duration must be at least 1 day';
			return;
		}

		isSubmitting = true;
		error = undefined;

		try {
			const input: CreateOfferInput = {
				jobId,
				recipientPubkey,
				bid,
				duration,
				startDate: startDate || undefined,
				terms,
				message,
				prevOfferId: prevOffer?.id
			};

			await offerService.sendOffer(input);
			onsent?.();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send offer';
			console.error('[OfferForm] Error:', e);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<Stack gap={5}>
			<Row justify="between">
				<h3 class="text-display-sm">{isCounter ? 'Counter Offer' : 'Apply for Job'}</h3>
				{#if oncancel}
					<Button variant="ghost" type="button" onclick={oncancel}>
						<X size={16} />
					</Button>
				{/if}
			</Row>

			<div class="form-grid">
				<Input 
					label="Bid (sats) *" 
					type="number"
					placeholder="50000"
					bind:value={bid}
				/>

				<Input 
					label="Duration (days) *" 
					type="number"
					placeholder="7"
					bind:value={duration}
				/>
			</div>

			<Input 
				label="Start Date" 
				type="date"
				bind:value={startDate}
			/>

			<Textarea 
				label="Terms of Agreement"
				placeholder="Payment on PR approval, 50% upfront..."
				rows={3}
				bind:value={terms}
			/>

			<Textarea 
				label="Message"
				placeholder="Tell them why you're the right fit..."
				rows={4}
				bind:value={message}
			/>

			<!-- Actions -->
			<Row justify="end" gap={3}>
				{#if error}
					<span class="error-message">{error}</span>
				{/if}
				<Button variant="primary" type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Spinner size="sm" />
					{:else}
						<Send size={16} />
					{/if}
					<span>{isSubmitting ? 'Sending...' : (isCounter ? 'Send Counter' : 'Send Offer')}</span>
				</Button>
			</Row>
		</Stack>
	</form>
</Card>

<style>
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error);
	}
</style>
