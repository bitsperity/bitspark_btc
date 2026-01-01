<!--
  Offer Detail Page - Clean version using composable
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, Button } from '$lib/components';
	import { OfferActions, OfferChain, OfferForm } from '$lib/components/offers';
	import { useOfferDetail } from '$lib/composables';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Coins, Clock, Briefcase } from 'lucide-svelte';

	const offerId = $derived($page.params.id);
	
	// Use composable for all business logic
	const {
		offer, job, isLoading,
		isForMe, canIOCreateContract,
		handleDevAccept, handleCreateContract
	} = useOfferDetail(() => offerId);

	let showCounterForm = $state(false);
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

				<!-- Main Offer Details -->
				<Card>
					<Stack gap={5}>
						<Row justify="between">
							<h1 class="text-display-md">Offer Details</h1>
							<Badge variant={o?.status === 'accepted' ? 'success' : o?.status === 'declined' ? 'error' : 'warning'}>
								{o?.status}
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

						{#if o?.terms}
							<div class="section">
								<h3>Terms</h3>
								<p>{o.terms}</p>
							</div>
						{/if}

						{#if o?.message}
							<div class="section">
								<h3>Message</h3>
								<p>{o.message}</p>
							</div>
						{/if}

						<!-- Actions -->
						{#if isForMe() && o?.status === 'pending' && j}
							<OfferActions 
								offer={o}
								job={j}
								onaccept={handleDevAccept}
								ondecline={() => goto('/dashboard/offers')}
								oncounter={() => showCounterForm = true}
							/>
						{/if}
						
						{#if canIOCreateContract()}
							<div class="contract-prompt">
								<p>Developer has accepted your counter-offer!</p>
								<Button variant="primary" onclick={handleCreateContract}>Create Contract</Button>
							</div>
						{/if}
					</Stack>
				</Card>

				<!-- Counter Form -->
				{#if showCounterForm && o && j}
					<OfferForm 
						jobId={o.jobId}
						recipientPubkey={o.pubkey}
						prevOffer={o}
						oncancel={() => showCounterForm = false}
						onsent={() => goto('/dashboard/offers')}
					/>
				{/if}

				<!-- Offer Chain -->
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

<style>
	/* Unique styles only - common styles are in pages.css */
	.content-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}
</style>
