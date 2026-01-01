<!--
  Offer Detail Page
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, Button } from '$lib/components';
	import { OfferCard, OfferActions, OfferChain, OfferForm } from '$lib/components/offers';
	import { offerService, jobService, profileService, authService, contractService } from '$lib/services';
	import type { Offer } from '$lib/types/offer';
	import type { Job } from '$lib/types/job';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Coins, Clock, FileText, Briefcase } from 'lucide-svelte';

	const offerId = $derived($page.params.id);

	let offer = $state<Offer | null>(null);
	let job = $state<Job | null>(null);
	let senderProfile = $state<NDKUserProfile | null>(null);
	let isLoading = $state(true);
	let showCounterForm = $state(false);

	$effect(() => {
		loadOffer();
	});

	async function loadOffer() {
		isLoading = true;
		try {
			offer = await offerService.getOffer(offerId);
			if (offer) {
				job = await jobService.getJob(offer.jobId);
				senderProfile = await profileService.getProfile(offer.pubkey);
			}
		} catch (e) {
			console.error('[OfferDetail] Load error:', e);
		} finally {
			isLoading = false;
		}
	}

	const isForMe = $derived(offer && authService.user?.pubkey === offer.recipientPubkey);
	const isFromMe = $derived(offer && authService.user?.pubkey === offer.pubkey);
	const isIO = $derived(job && authService.user?.pubkey === job.pubkey);
	
	// IO can create contract when they see an accepted offer from Dev
	// (Dev accepted IO's counter-offer)
	const canIOCreateContract = $derived(
		isIO && 
		offer?.status === 'accepted' &&
		offer?.pubkey !== job?.pubkey  // Offer was made by Dev, not IO
	);

	// Dev's accept handler (doesn't create contract)
	async function handleDevAccept() {
		if (!offer) return;
		
		await offerService.acceptOffer(offer);
		goto('/dashboard/offers');
	}
	
	// IO creates contract after seeing Dev's accept
	async function handleCreateContract() {
		if (!offer || !job) return;
		
		// Get the offer chain to find IO's counter-offer
		const chain = await offerService.getOfferChain(offer.id);
		const ioCounter = chain.find(o => o.pubkey === job.pubkey);
		
		if (ioCounter?.event && offer.event) {
			await contractService.createContract({
				jobId: offer.jobId,
				acceptedOfferId: offer.id,
				developerPubkey: offer.pubkey,
				counterOffer: ioCounter.event,
				acceptOffer: offer.event,
				agreedBid: offer.bid,
				message: `Contract for job: ${job.title}`
			});
		}
		
		goto('/dashboard/contracts');
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="md">
		{#if isLoading}
			<Stack gap={6}>
				<Skeleton width="100px" height="1rem" />
				<Skeleton width="80%" height="2rem" />
				<Skeleton width="100%" height="200px" />
			</Stack>
		{:else if !offer}
			<Card>
				<Stack gap={4} class="not-found">
					<h1>Offer Not Found</h1>
					<p class="text-muted">This offer may have been deleted or doesn't exist.</p>
					<Button variant="primary" onclick={() => goto('/dashboard/offers')}>
						Back to Offers
					</Button>
				</Stack>
			</Card>
		{:else}
			<Stack gap={6}>
				<a href="/dashboard/offers" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Offers</span>
				</a>

				<!-- Job Reference -->
				{#if job}
					<a href="/jobs/{job.id}" class="job-link">
						<Card>
							<Row gap={3}>
								<Briefcase size={20} />
								<div>
									<span class="job-label">Offer for</span>
									<span class="job-title">{job.title}</span>
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
							<Badge 
								variant={offer.status === 'accepted' ? 'success' : offer.status === 'declined' ? 'error' : 'warning'}
							>
								{offer.status}
							</Badge>
						</Row>

						<div class="details-grid">
							<div class="detail-item">
								<Coins size={20} />
								<div>
									<span class="detail-label">Bid</span>
									<span class="detail-value">{offer.bid.toLocaleString()} sats</span>
								</div>
							</div>
							<div class="detail-item">
								<Clock size={20} />
								<div>
									<span class="detail-label">Duration</span>
									<span class="detail-value">{offer.duration} days</span>
								</div>
							</div>
						</div>

						{#if offer.terms}
							<div class="terms-section">
								<h3>Terms</h3>
								<p>{offer.terms}</p>
							</div>
						{/if}

						{#if offer.message}
							<div class="message-section">
								<h3>Message</h3>
								<p>{offer.message}</p>
							</div>
						{/if}

						<!-- Actions -->
						{#if isForMe && offer.status === 'pending' && job}
							<OfferActions 
								{offer}
								{job}
								onaccept={handleDevAccept}
								ondecline={() => goto('/dashboard/offers')}
								oncounter={() => showCounterForm = true}
							/>
						{/if}
						
						<!-- IO: Create Contract when Dev has accepted -->
						{#if canIOCreateContract}
							<div class="contract-prompt">
								<p>Developer has accepted your counter-offer!</p>
								<Button variant="primary" onclick={handleCreateContract}>
									Create Contract
								</Button>
							</div>
						{/if}
					</Stack>
				</Card>

				<!-- Counter Form -->
				{#if showCounterForm && offer && job}
					<OfferForm 
						jobId={offer.jobId}
						recipientPubkey={offer.pubkey}
						prevOffer={offer}
						oncancel={() => showCounterForm = false}
						onsent={() => goto('/dashboard/offers')}
					/>
				{/if}

				<!-- Offer Chain -->
				<Card>
					<Stack gap={4}>
						<h2>Negotiation History</h2>
						<OfferChain offerId={offerId} />
					</Stack>
				</Card>
			</Stack>
		{/if}
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	.job-link {
		text-decoration: none;
	}

	.job-label {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.job-title {
		font-weight: 600;
		color: var(--orange-400);
	}

	:global(.not-found) {
		align-items: center;
		text-align: center;
		padding: var(--space-8);
	}

	.details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
	}

	.detail-label {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.detail-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.terms-section, .message-section {
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
	}

	.terms-section h3, .message-section h3 {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	.terms-section p, .message-section p {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.contract-prompt {
		padding: var(--space-4);
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
		border-radius: var(--radius-md);
		border: 1px solid rgba(34, 197, 94, 0.2);
		text-align: center;
	}

	.contract-prompt p {
		color: var(--success);
		font-weight: 500;
		margin-bottom: var(--space-3);
	}
</style>
