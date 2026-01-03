<!--
  ContractParties - Shows IO and Dev party cards with profile pictures
  
  Design principles:
  - No redundant labels
  - Badge IN the card, not floating
  - Agreed Payment as stat display (number big, label small)
-->
<script lang="ts">
	import { Row, Badge, UserAvatar } from '$lib/components';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { Coins } from 'lucide-svelte';

	interface Props {
		ioProfile: NDKUserProfile | null;
		devProfile: NDKUserProfile | null;
		ioPubkey: string;
		devPubkey: string;
		userRole: 'io' | 'dev' | null;
		agreedBid: number;
	}

	let { ioProfile, devProfile, ioPubkey, devPubkey, userRole, agreedBid }: Props = $props();
</script>

<div class="parties-section">
	<!-- Party Cards Grid -->
	<div class="parties-grid">
		<a href="/profile/{ioPubkey}" class="party-card">
			<div class="party-header">
				<span class="party-role">Idea Owner</span>
				{#if userRole === 'io'}
					<Badge variant="info" size="sm">You</Badge>
				{/if}
			</div>
			<div class="party-info">
				<UserAvatar pubkey={ioPubkey} size="md" />
				<span class="party-name">{ioProfile?.name ?? 'Anonymous'}</span>
			</div>
		</a>

		<a href="/profile/{devPubkey}" class="party-card">
			<div class="party-header">
				<span class="party-role">Developer</span>
				{#if userRole === 'dev'}
					<Badge variant="info" size="sm">You</Badge>
				{/if}
			</div>
			<div class="party-info">
				<UserAvatar pubkey={devPubkey} size="md" />
				<span class="party-name">{devProfile?.name ?? 'Anonymous'}</span>
			</div>
		</a>
	</div>

	<!-- Agreed Payment as Stat Display -->
	<div class="payment-stat">
		<Row gap={2} class="payment-icon">
			<Coins size={20} />
		</Row>
		<div class="payment-content">
			<span class="payment-value">{agreedBid.toLocaleString()} sats</span>
			<span class="payment-label">Agreed Payment</span>
		</div>
	</div>
</div>

<style>
	.parties-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.parties-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	.party-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.party-card:hover {
		background: var(--bg-elevated);
		border-color: var(--border-default);
		transform: translateY(-2px);
	}

	.party-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.party-role {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.party-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.party-name {
		font-weight: 600;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.payment-stat {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
	}

	:global(.payment-icon) {
		color: var(--orange-500);
	}

	.payment-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.payment-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--orange-400);
	}

	.payment-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
</style>
