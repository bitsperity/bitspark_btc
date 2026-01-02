<!--
  OfferChain - Show negotiation history (display-only)
-->
<script lang="ts">
	import { offerService } from '$lib/services';
	import type { Offer } from '$lib/types/offer';
	import { Stack, Skeleton } from '$lib/components';
	import OfferCard from './OfferCard.svelte';

	interface Props {
		offerId: string;
	}

	let { offerId }: Props = $props();

	let chain = $state<Offer[]>([]);
	let isLoading = $state(true);

	$effect(() => {
		loadChain();
	});

	async function loadChain() {
		isLoading = true;
		try {
			chain = await offerService.getOfferChain(offerId);
		} catch (e) {
			console.error('[OfferChain] Load error:', e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="offer-chain">
	{#if isLoading}
		<Stack gap={3}>
			{#each Array(2) as _}
				<div class="skeleton-item">
					<Skeleton width="100%" height="80px" />
				</div>
			{/each}
		</Stack>
	{:else if chain.length === 0}
		<p class="text-muted">No offers in chain</p>
	{:else}
		<Stack gap={3}>
			{#each chain as offer, i (offer.id)}
				<div class="chain-item">
					<div class="chain-line" class:first={i === 0} class:last={i === chain.length - 1}></div>
					<OfferCard {offer} />
				</div>
			{/each}
		</Stack>
	{/if}
</div>

<style>
	.offer-chain {
		position: relative;
	}

	.chain-item {
		position: relative;
		padding-left: var(--space-6);
	}

	.chain-line {
		position: absolute;
		left: var(--space-2);
		top: 0;
		bottom: 0;
		width: 2px;
		background: rgba(255, 255, 255, 0.1);
	}

	.chain-line.first {
		top: 50%;
	}

	.chain-line.last {
		bottom: 50%;
	}

	.chain-line.first.last {
		display: none;
	}

	.chain-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 8px;
		height: 8px;
		background: var(--orange-500);
		border-radius: 50%;
		transform: translateY(-50%);
	}

	.skeleton-item {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
	}
</style>
