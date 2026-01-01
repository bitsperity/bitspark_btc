<!--
  ContractCard - Contract summary display
-->
<script lang="ts">
	import { Card, Badge, Row, Stack, Avatar } from '$lib/components';
	import type { Contract } from '$lib/types/offer';
	import { profileService, authService } from '$lib/services';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { FileCheck, Coins, Shield, Users } from 'lucide-svelte';

	interface Props {
		contract: Contract;
		onclick?: () => void;
	}

	let { contract, onclick }: Props = $props();

	// Fetch profiles
	let devProfile = $state<NDKUserProfile | null>(null);
	let ioProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		profileService.getProfile(contract.developerPubkey).then(p => devProfile = p);
		profileService.getProfile(contract.ioPubkey).then(p => ioProfile = p);
	});

	const formattedBid = $derived(contract.agreedBid.toLocaleString());
	const proofCount = $derived(contract.proofs.length);
	const isVerified = $derived(proofCount >= 2);
</script>

<button class="contract-card" onclick={onclick}>
	<Card hover>
		<Stack gap={4}>
			<!-- Header -->
			<Row justify="between">
				<Row gap={2}>
					<FileCheck size={20} class="contract-icon" />
					<span class="contract-title">Contract</span>
				</Row>
				{#if isVerified}
					<Badge variant="success" size="sm">
						<Shield size={12} />
						{proofCount} Proofs
					</Badge>
				{/if}
			</Row>

			<!-- Parties -->
			<Row gap={4}>
				<div class="party">
					<Avatar 
						src={ioProfile?.image} 
						fallback={ioProfile?.name?.[0] ?? '?'} 
						size="xs" 
					/>
					<div class="party-info">
						<span class="party-role">Idea Owner</span>
						<span class="party-name">{ioProfile?.name ?? 'Anonymous'}</span>
					</div>
				</div>
				
				<span class="party-connector">↔</span>
				
				<div class="party">
					<Avatar 
						src={devProfile?.image} 
						fallback={devProfile?.name?.[0] ?? '?'} 
						size="xs" 
					/>
					<div class="party-info">
						<span class="party-role">Developer</span>
						<span class="party-name">{devProfile?.name ?? 'Anonymous'}</span>
					</div>
				</div>
			</Row>

			<!-- Agreed Bid -->
			<Row gap={1} class="bid-row">
				<Coins size={14} />
				<span class="bid-value">{formattedBid} sats</span>
			</Row>

			<!-- Message preview -->
			{#if contract.message}
				<p class="message-preview">{contract.message}</p>
			{/if}
		</Stack>
	</Card>
</button>

<style>
	.contract-card {
		width: 100%;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
	}

	:global(.contract-icon) {
		color: var(--orange-500);
	}

	.contract-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.party {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.party-info {
		display: flex;
		flex-direction: column;
	}

	.party-role {
		font-size: 0.625rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.party-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.party-connector {
		color: var(--text-muted);
		font-size: 1.25rem;
	}

	:global(.bid-row) {
		color: var(--text-muted);
	}

	.bid-value {
		font-weight: 600;
		color: var(--orange-500);
	}

	.message-preview {
		font-size: 0.875rem;
		color: var(--text-muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
