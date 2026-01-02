<!--
  Offer Detail Page
  
  Clean role-based structure:
  - userRole === 'io' → IOActionPanel
  - userRole === 'dev' → DevActionPanel
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, Button } from '$lib/components';
	import { OfferChain, IOActionPanel, DevActionPanel, CounterOfferModal } from '$lib/components/offers';
	import { useOfferDetail } from '$lib/composables';
	import type { Offer } from '$lib/types/offer';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Coins, Clock, Briefcase } from 'lucide-svelte';

	const offerId = $derived($page.params.id);
	
	const {
		offer, job, isLoading,
		userRole, effectiveStatus, canCreateContract, pendingOffersForMe,
		acceptOffer, declineOffer, createContract
	} = useOfferDetail(() => offerId);

	// Modal state
	let showCounterModal = $state(false);
	let counterTargetOffer = $state<Offer | null>(null);

	// ========== HANDLERS ==========

	function handleCounter(targetOffer: Offer) {
		counterTargetOffer = targetOffer;
		showCounterModal = true;
	}

	function handleCloseModal() {
		showCounterModal = false;
		counterTargetOffer = null;
	}

	function handleCounterSent() {
		handleCloseModal();
		goto('/dashboard/offers');
	}

	async function handleDecline(targetOffer: Offer) {
		const confirmed = confirm('Decline this negotiation? This ends the entire offer chain.');
		if (confirmed) {
			await declineOffer(targetOffer);
		}
	}

	async function handleAccept(targetOffer: Offer) {
		await acceptOffer(targetOffer);
	}

	function handleCreateContract() {
		createContract();
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
				<Stack gap={4}>
					<h1>Offer Not Found</h1>
					<p class="text-muted">This offer may have been deleted or doesn't exist.</p>
					<Button variant="primary" onclick={() => goto('/dashboard/offers')}>Back to Offers</Button>
				</Stack>
			</Card>
		{:else}
			{@const o = offer()}
			{@const j = job()}
			{@const role = userRole()}
			{@const status = effectiveStatus()}
			
			<Stack gap={6}>
				<!-- Back link -->
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

				<!-- Offer Summary -->
				<Card>
					<Stack gap={4}>
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
					</Stack>
				</Card>

				<!-- Role-Based Action Panel -->
				{#if role === 'io'}
					<IOActionPanel
						pendingOffersForMe={pendingOffersForMe()}
						canCreateContract={canCreateContract()}
						oncounter={handleCounter}
						ondecline={handleDecline}
						oncreatecontract={handleCreateContract}
					/>
				{:else if role === 'dev'}
					<DevActionPanel
						pendingOffersForMe={pendingOffersForMe()}
						onaccept={handleAccept}
						oncounter={handleCounter}
						ondecline={handleDecline}
					/>
				{/if}

				<!-- Negotiation History -->
				<Card>
					<Stack gap={4}>
						<h2>Negotiation History</h2>
						<OfferChain {offerId} />
					</Stack>
				</Card>
			</Stack>
		{/if}
	</Container>
</main>

<!-- Counter Offer Modal -->
{#if showCounterModal && counterTargetOffer}
	<CounterOfferModal
		targetOffer={counterTargetOffer}
		onclose={handleCloseModal}
		onsent={handleCounterSent}
	/>
{/if}

<style>
	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--space-4);
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--text-muted);
	}

	.detail-item div {
		display: flex;
		flex-direction: column;
	}

	.detail-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}
</style>
