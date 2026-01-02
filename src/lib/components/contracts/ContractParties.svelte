<!--
  ContractParties - Shows IO and Dev party cards with "You" badge
-->
<script lang="ts">
	import { Row, Badge } from '$lib/components';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { Users } from 'lucide-svelte';

	interface Props {
		ioProfile: NDKUserProfile | null;
		devProfile: NDKUserProfile | null;
		userRole: 'io' | 'dev' | null;
		agreedBid: number;
	}

	let { ioProfile, devProfile, userRole, agreedBid }: Props = $props();
</script>

<div class="parties-section">
	<Row gap={2} class="section-header">
		<Users size={16} />
		<h3>Parties</h3>
	</Row>

	<div class="parties-grid">
		<div class="party-card">
			<span class="party-role">Idea Owner</span>
			<span class="party-name">{ioProfile?.name ?? 'Anonymous'}</span>
			{#if userRole === 'io'}
				<Badge variant="secondary" size="sm">You</Badge>
			{/if}
		</div>

		<div class="party-card">
			<span class="party-role">Developer</span>
			<span class="party-name">{devProfile?.name ?? 'Anonymous'}</span>
			{#if userRole === 'dev'}
				<Badge variant="secondary" size="sm">You</Badge>
			{/if}
		</div>
	</div>

	<div class="bid-section">
		<span class="bid-label">Agreed Payment</span>
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
		gap: var(--space-1);
		padding: var(--space-3);
		background: var(--bg-subtle);
		border-radius: var(--radius-md);
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
