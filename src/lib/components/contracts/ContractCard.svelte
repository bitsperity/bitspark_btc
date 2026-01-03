<!--
  ContractCard - Contract summary with role, confirmation status, and integrity check
-->
<script lang="ts">
	import { Card, Badge, Row, Stack, Avatar } from '$lib/components';
	import type { Contract, ContractConfirmation } from '$lib/types/offer';
	import { profileService, authService, contractService } from '$lib/services';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { FileCheck, Coins, Shield, ShieldCheck, ShieldX, Clock, CheckCircle, AlertTriangle } from 'lucide-svelte';

	interface Props {
		contract: Contract;
		onclick?: () => void;
	}

	let { contract, onclick }: Props = $props();

	// Fetch profiles and confirmation
	let devProfile = $state<NDKUserProfile | null>(null);
	let ioProfile = $state<NDKUserProfile | null>(null);
	let confirmation = $state<ContractConfirmation | null>(null);
	let isIntegrityValid = $state<boolean | null>(null);

	$effect(() => {
		profileService.getProfile(contract.developerPubkey).then(p => devProfile = p ?? null);
		profileService.getProfile(contract.ioPubkey).then(p => ioProfile = p ?? null);
		loadConfirmation();
	});

	async function loadConfirmation() {
		confirmation = await contractService.getConfirmation(contract.id);
		if (confirmation) {
			// Verify integrity: confirmation.originalContract.id should match contract.id
			isIntegrityValid = confirmation.originalContract?.id === contract.id &&
				confirmation.originalContract?.pubkey === contract.ioPubkey;
		}
	}

	const formattedBid = $derived(contract.agreedBid.toLocaleString());
	const proofCount = $derived(contract.proofs.length);
	
	// Determine user's role in this contract
	const userRole = $derived(() => {
		const pubkey = authService.user?.pubkey;
		if (!pubkey) return null;
		if (pubkey === contract.ioPubkey) return 'io';
		if (pubkey === contract.developerPubkey) return 'dev';
		return null;
	});

	// Contract status
	const status = $derived(() => {
		if (!confirmation) return 'pending';
		if (isIntegrityValid === false) return 'invalid';
		return 'confirmed';
	});
</script>

<button class="contract-card" onclick={onclick}>
	<Card hover>
		<Stack gap={4}>
			<!-- Header with Role Badge -->
			<Row justify="between">
				<Row gap={2}>
					<FileCheck size={20} class="contract-icon" />
					<span class="contract-title">Contract</span>
				</Row>
				<Row gap={2}>
					{#if userRole() === 'io'}
						<Badge variant="info" size="sm">As IO</Badge>
					{:else if userRole() === 'dev'}
						<Badge variant="secondary" size="sm">As Dev</Badge>
					{/if}
				</Row>
			</Row>

			<!-- Confirmation Status -->
			<div class="status-row">
				{#if status() === 'pending'}
					<Row gap={2} class="status-pending">
						<Clock size={14} />
						<span>Awaiting Confirmation</span>
					</Row>
				{:else if status() === 'confirmed'}
					<Row gap={2} class="status-confirmed">
						<CheckCircle size={14} />
						<span>Confirmed</span>
						{#if isIntegrityValid}
							<ShieldCheck size={14} title="Integrity verified" />
						{/if}
					</Row>
				{:else if status() === 'invalid'}
					<Row gap={2} class="status-invalid">
						<AlertTriangle size={14} />
						<span>Integrity Error</span>
					</Row>
				{/if}
			</div>

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

			<!-- Agreed Bid & Proofs -->
			<Row justify="between">
				<Row gap={1} class="bid-row">
					<Coins size={14} />
					<span class="bid-value">{formattedBid} sats</span>
				</Row>
				{#if proofCount > 0}
					<Badge variant="success" size="sm">
						<Shield size={12} />
						{proofCount} Proofs
					</Badge>
				{/if}
			</Row>
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

	.status-row {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		background: rgba(0, 0, 0, 0.2);
	}

	:global(.status-pending) {
		color: var(--warning);
	}

	:global(.status-confirmed) {
		color: var(--success);
	}

	:global(.status-invalid) {
		color: var(--error);
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
</style>
