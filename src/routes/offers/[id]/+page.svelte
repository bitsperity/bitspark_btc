<!--
  Offer Detail Page
  
  Actions:
  - Decline: Always at top (ends entire negotiation)
  - Accept/Counter: On each pending offer in chain
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, Button } from '$lib/components';
	import { OfferChain, OfferForm } from '$lib/components/offers';
	import { useOfferDetail } from '$lib/composables';
	import { offerService } from '$lib/services';
	import type { Offer } from '$lib/types/offer';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Coins, Clock, Briefcase, FileCheck, XCircle } from 'lucide-svelte';

	const offerId = $derived($page.params.id);
	
	const {
		offer, job, isLoading,
		isIO, canIOCreateContract, acceptedOfferFromDev,
		latestPendingOfferForMe,
		handleCreateContract
	} = useOfferDetail(() => offerId);

	let showCounterForm = $state(false);
	let counterForOffer = $state<Offer | null>(null);

	// Derive the effective status
	const effectiveStatus = $derived(() => {
		const accepted = acceptedOfferFromDev();
		if (accepted) return 'accepted';
		return offer()?.status ?? 'pending';
	});

	// Can decline the entire chain if there's a pending offer for me
	const canDecline = $derived(latestPendingOfferForMe() !== null && !acceptedOfferFromDev());

	// Handle decline - ends entire negotiation
	async function handleDecline() {
		const pendingOffer = latestPendingOfferForMe();
		if (pendingOffer) {
			await offerService.declineOffer(pendingOffer);
		}
		goto('/dashboard/offers');
	}

	// Handle accept - Dev accepts a specific counter-offer
	async function handleAccept(targetOffer: Offer) {
		await offerService.acceptOffer(targetOffer);
		// Reload to show updated status
		window.location.reload();
	}

	// Handle counter - show form for specific offer
	function handleCounter(targetOffer: Offer) {
		counterForOffer = targetOffer;
		showCounterForm = true;
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="md">
		{#if isLoading()}
			<Stack gap={6}>
				<Skeleton width="100px" height="1rem" />
				<Skeleton width="80%" height="2rem" />
				<Skeleton width="100%" height="200px" />
			</Stack>
		{:else if !offer()}
			<Card>
				<Stack gap={4} class="not-found">
					<h1>Offer Not Found</h1>
					<p class="text-muted">This offer may have been deleted or doesn't exist.</p>
					<Button variant="primary" onclick={() => goto('/dashboard/offers')}>Back to Offers</Button>
				</Stack>
			</Card>
		{:else}
			{@const o = offer()}
			{@const j = job()}
			{@const status = effectiveStatus()}
			<Stack gap={6}>
				<a href="/dashboard/offers" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Offers</span>
				</a>

				<!-- Job Reference -->
				{#if j}
					<a href="/jobs/{j.id}" class="job-link">
						<Card>
							<Row gap={3}>
								<Briefcase size={20} />
								<div>
									<span class="job-label">Offer for</span>
									<span class="job-title">{j.title}</span>
								</div>
							</Row>
						</Card>
					</a>
				{/if}

				<!-- Main Actions Card -->
				<Card>
					<Stack gap={5}>
						<Row justify="between">
							<h1 class="text-display-md">Offer Details</h1>
							<Badge variant={status === 'accepted' ? 'success' : status === 'declined' ? 'error' : 'warning'}>
								{status}
							</Badge>
						</Row>

						<div class="details-grid">
							<div class="detail-item">
								<Coins size={20} />
								<div>
									<span class="detail-label">Bid</span>
									<span class="detail-value">{o?.bid.toLocaleString()} sats</span>
								</div>
							</div>
							<div class="detail-item">
								<Clock size={20} />
								<div>
									<span class="detail-label">Duration</span>
									<span class="detail-value">{o?.duration} days</span>
								</div>
							</div>
						</div>

						<!-- Top Actions -->
						{#if canIOCreateContract()}
							<div class="action-box success">
								<FileCheck size={24} />
								<div>
									<p class="action-title">Developer accepted!</p>
									<p class="action-desc">Ready to create the contract.</p>
								</div>
								<Button variant="primary" onclick={handleCreateContract}>
									Create Contract
								</Button>
							</div>
						{:else if status === 'accepted'}
							<div class="action-box info">
								<p>Waiting for contract creation...</p>
							</div>
						{:else if status === 'declined'}
							<div class="action-box error">
								<p>This negotiation has been declined.</p>
							</div>
						{/if}
					</Stack>
				</Card>

				<!-- Counter Form -->
				{#if showCounterForm && counterForOffer && j}
					<OfferForm 
						jobId={counterForOffer.jobId}
						recipientPubkey={counterForOffer.pubkey}
						prevOffer={counterForOffer}
						oncancel={() => { showCounterForm = false; counterForOffer = null; }}
						onsent={() => goto('/dashboard/offers')}
					/>
				{/if}

				<!-- Negotiation History with inline actions -->
				<Card>
					<Stack gap={4}>
						<h2>Negotiation History</h2>
						<p class="chain-hint">Accept or counter offers below:</p>
						<OfferChain 
							{offerId} 
							showActions={!isIO()}
							onaccept={handleAccept}
							oncounter={handleCounter}
						/>

						<!-- Decline button at bottom -->
						{#if canDecline}
							<div class="decline-section">
								<Button variant="ghost" onclick={handleDecline}>
									<XCircle size={16} />
									Decline Negotiation
								</Button>
								<span class="decline-hint">Ends the entire negotiation</span>
							</div>
						{/if}
					</Stack>
				</Card>
			</Stack>
		{/if}
	</Container>
</main>

<style>
	.content-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	.action-box {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
	}

	.action-box.success {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		color: var(--success);
	}

	.action-box.info {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-subtle);
		color: var(--text-muted);
		justify-content: center;
	}

	.action-box.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--error);
		justify-content: center;
	}

	.action-title {
		font-weight: 600;
		margin: 0;
	}

	.action-desc {
		font-size: 0.875rem;
		margin: 0;
		opacity: 0.8;
	}

	.action-box :global(button) {
		margin-left: auto;
	}

	.decline-section {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.05);
		border-radius: var(--radius-md);
	}

	.decline-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.chain-hint {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}
</style>
