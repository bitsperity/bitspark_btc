<!--
  Offer Detail Page - Clean version using composable
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, Button } from '$lib/components';
	import { OfferChain, OfferForm } from '$lib/components/offers';
	import { useOfferDetail } from '$lib/composables';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Coins, Clock, Briefcase, FileCheck } from 'lucide-svelte';

	const offerId = $derived($page.params.id);
	
	// Use composable for all business logic
	const {
		offer, job, isLoading,
		isForMe, isIO, canIOCreateContract, acceptedOfferFromDev,
		handleDevAccept, handleCreateContract
	} = useOfferDetail(() => offerId);

	let showCounterForm = $state(false);

	// Derive the effective status - if chain has accepted, show that
	const effectiveStatus = $derived(() => {
		const accepted = acceptedOfferFromDev();
		if (accepted) return 'accepted';
		return offer()?.status ?? 'pending';
	});

	// Can show counter/decline only if pending AND no accepted offer in chain
	const canTakeAction = $derived(
		isForMe() && 
		offer()?.status === 'pending' && 
		!acceptedOfferFromDev()
	);
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

				<!-- Main Offer Details -->
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

						{#if o?.terms}
							<div class="content-section">
								<h3>Terms</h3>
								<p>{o.terms}</p>
							</div>
						{/if}

						{#if o?.message}
							<div class="content-section">
								<h3>Message</h3>
								<p>{o.message}</p>
							</div>
						{/if}

						<!-- Actions Section -->
						{#if canIOCreateContract()}
							<!-- IO can create contract after Dev accepted -->
							<div class="action-box success">
								<FileCheck size={24} />
								<div>
									<p class="action-title">Developer accepted!</p>
									<p class="action-desc">Ready to create the contract and start working.</p>
								</div>
								<Button variant="primary" onclick={handleCreateContract}>
									Create Contract
								</Button>
							</div>
						{:else if canTakeAction && j}
							<!-- Different actions based on role -->
							{#if isIO()}
								<!-- IO can only Decline or Counter -->
								<Row gap={3}>
									<Button variant="ghost" onclick={() => goto('/dashboard/offers')}>
										Decline
									</Button>
									<Button variant="primary" onclick={() => showCounterForm = true}>
										Send Counter
									</Button>
								</Row>
							{:else}
								<!-- Dev can Accept, Decline, or Counter -->
								<Row gap={3}>
									<Button variant="ghost" onclick={() => goto('/dashboard/offers')}>
										Decline
									</Button>
									<Button variant="secondary" onclick={() => showCounterForm = true}>
										Send Counter
									</Button>
									<Button variant="primary" onclick={handleDevAccept}>
										Accept
									</Button>
								</Row>
							{/if}
						{:else if status === 'accepted'}
							<!-- Already accepted, waiting -->
							<div class="action-box info">
								<p>Waiting for contract creation...</p>
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
	/* Unique styles only - common styles in pages.css */
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
</style>

