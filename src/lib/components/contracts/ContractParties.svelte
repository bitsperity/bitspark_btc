<!--
  ContractParties - Shows IO and Dev party cards with profile pictures
-->
<script lang="ts">
	import { Row, Badge, UserAvatar } from '$lib/components';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { Users, Coins } from 'lucide-svelte';

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
	<Row gap={2} class="section-header">
		<Users size={16} />
		<h3>Parties</h3>
	</Row>

	<div class="parties-grid">
		<a href="/profile/{ioPubkey}" class="party-card">
			<span class="party-role">Idea Owner</span>
			<div class="party-info">
				<UserAvatar pubkey={ioPubkey} size="sm" />
				<span class="party-name">{ioProfile?.name ?? 'Anonymous'}</span>
			</div>
			{#if userRole === 'io'}
				<Badge variant="secondary" size="sm">You</Badge>
			{/if}
		</a>

		<a href="/profile/{devPubkey}" class="party-card">
			<span class="party-role">Developer</span>
			<div class="party-info">
				<UserAvatar pubkey={devPubkey} size="sm" />
				<span class="party-name">{devProfile?.name ?? 'Anonymous'}</span>
			</div>
			{#if userRole === 'dev'}
				<Badge variant="secondary" size="sm">You</Badge>
			{/if}
		</a>
	</div>

	<div class="bid-section">
		<Row gap={2}>
			<Coins size={18} />
			<span class="bid-label">Agreed Payment</span>
		</Row>
		<span class="bid-value">{agreedBid.toLocaleString()} sats</span>
	</div>
</div>

<style>
	.parties-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	:global(.section-header) {
		color: var(--text-muted);
	}

	.section-header h3 {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0;
	}

	.parties-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}

	.party-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--bg-subtle);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.party-card:hover {
		background: var(--bg-elevated);
		transform: translateY(-1px);
	}

	.party-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.party-role {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.party-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.bid-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3);
		background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(245, 158, 11, 0.1));
		border-radius: var(--radius-md);
	}

	.bid-label {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.bid-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--orange-400);
	}
</style>
