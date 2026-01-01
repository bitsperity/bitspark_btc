<!--
  OfferCard - Display offer in list
-->
<script lang="ts">
	import { Card, Badge, Row, Stack, Avatar } from '$lib/components';
	import { OFFER_STATUS_CONFIG, type Offer, type OfferStatus } from '$lib/types/offer';
	import { profileService, authService } from '$lib/services';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { ArrowRight, Clock, Coins } from 'lucide-svelte';

	interface Props {
		offer: Offer;
		onclick?: () => void;
	}

	let { offer, onclick }: Props = $props();

	// Fetch sender profile
	let senderProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		profileService.getProfile(offer.pubkey).then(p => senderProfile = p);
	});

	const statusConfig = $derived(OFFER_STATUS_CONFIG[offer.status]);
	const formattedBid = $derived(offer.bid.toLocaleString());
	const isFromMe = $derived(authService.user?.pubkey === offer.pubkey);
	const isToMe = $derived(authService.user?.pubkey === offer.recipientPubkey);
</script>

<button class="offer-card" onclick={onclick}>
	<Card hover>
		<Stack gap={3}>
			<!-- Header -->
			<Row justify="between">
				<Row gap={2}>
					<Avatar 
						src={senderProfile?.image} 
						fallback={senderProfile?.name?.[0] ?? '?'} 
						size="sm" 
					/>
					<div class="sender-info">
						<span class="sender-name">{senderProfile?.name ?? 'Anonymous'}</span>
						{#if isFromMe}
							<Badge variant="secondary" size="sm">You</Badge>
						{/if}
					</div>
				</Row>
				<Badge variant={statusConfig.color as 'success' | 'warning' | 'error'} size="sm">
					{statusConfig.label}
				</Badge>
			</Row>

			<!-- Bid & Duration -->
			<Row gap={4}>
				<Row gap={1} class="stat">
					<Coins size={14} />
					<span class="stat-value">{formattedBid} sats</span>
				</Row>
				<Row gap={1} class="stat">
					<Clock size={14} />
					<span class="stat-value">{offer.duration} days</span>
				</Row>
			</Row>

			<!-- Message preview -->
			{#if offer.message}
				<p class="message-preview">{offer.message}</p>
			{/if}

			<!-- Direction indicator -->
			{#if isFromMe || isToMe}
				<Row gap={1} class="direction">
					<ArrowRight size={12} />
					<span>{isFromMe ? 'Sent' : 'Received'}</span>
				</Row>
			{/if}
		</Stack>
	</Card>
</button>

<style>
	.offer-card {
		width: 100%;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
	}

	.sender-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.sender-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	:global(.stat) {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.stat-value {
		font-weight: 500;
		color: var(--text-secondary);
	}

	.message-preview {
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.direction) {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
</style>
