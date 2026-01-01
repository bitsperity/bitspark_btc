<!--
  My Offers Dashboard - Modern tabbed design with collapsible ideas and avatars
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, UserAvatar } from '$lib/components';
	import { offerService, authService, jobService, ideaService } from '$lib/services';
	import type { Offer } from '$lib/types/offer';
	import type { Job } from '$lib/types/job';
	import type { Idea } from '$lib/types/idea';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Inbox, Send, Lightbulb, Briefcase, Coins, Clock, ArrowRight, ChevronDown, ChevronRight } from 'lucide-svelte';

	// State
	let activeTab = $state<'received' | 'sent'>('received');
	let receivedOffers = $state<Offer[]>([]);
	let sentOffers = $state<Offer[]>([]);
	let jobs = $state<Map<string, Job>>(new Map());
	let ideas = $state<Map<string, Idea>>(new Map());
	let offerStatuses = $state<Map<string, string>>(new Map());
	let collapsedIdeas = $state<Set<string>>(new Set());
	let isLoading = $state(true);

	let receivedUnsub: (() => void) | undefined;
	let sentUnsub: (() => void) | undefined;

	async function startSubscriptions() {
		cleanupSubscriptions();
		
		if (!authService.isLoggedIn) {
			isLoading = false;
			return;
		}

		isLoading = true;

		const receivedStore = offerService.subscribeToMyOffers();
		receivedUnsub = receivedStore.subscribe(async offers => {
			receivedOffers = offers;
			await loadMetadata(offers);
			isLoading = false;
		});

		const sentStore = offerService.subscribeToMySentOffers();
		sentUnsub = sentStore.subscribe(async offers => {
			sentOffers = offers;
			await loadMetadata(offers);
		});

		setTimeout(() => { isLoading = false; }, 5000);
	}

	async function loadMetadata(offers: Offer[]) {
		for (const offer of offers) {
			if (!jobs.has(offer.jobId)) {
				const job = await jobService.getJob(offer.jobId);
				if (job) {
					jobs.set(offer.jobId, job);
					jobs = new Map(jobs);
					
					if (job.ideaId && !ideas.has(job.ideaId)) {
						const idea = await ideaService.getIdea(job.ideaId);
						if (idea) {
							ideas.set(job.ideaId, idea);
							ideas = new Map(ideas);
						}
					}
				}
			}
			
			if (!offerStatuses.has(offer.id)) {
				const status = await offerService.getLatestStatus(offer.id);
				offerStatuses.set(offer.id, status);
				offerStatuses = new Map(offerStatuses);
			}
		}
	}

	function cleanupSubscriptions() {
		receivedUnsub?.();
		sentUnsub?.();
		receivedOffers = [];
		sentOffers = [];
		jobs = new Map();
		ideas = new Map();
		offerStatuses = new Map();
		collapsedIdeas = new Set();
	}

	$effect(() => {
		const _ = authService.isLoggedIn;
		startSubscriptions();
	});

	onDestroy(() => cleanupSubscriptions());

	function groupOffers(offers: Offer[]): Map<string, { idea: Idea | undefined; jobs: Map<string, { job: Job | undefined; offers: Offer[] }> }> {
		const result = new Map<string, { idea: Idea | undefined; jobs: Map<string, { job: Job | undefined; offers: Offer[] }> }>();
		
		for (const offer of offers) {
			const job = jobs.get(offer.jobId);
			const ideaId = job?.ideaId ?? 'unknown';
			
			if (!result.has(ideaId)) {
				result.set(ideaId, { idea: ideas.get(ideaId), jobs: new Map() });
			}
			
			const ideaGroup = result.get(ideaId)!;
			if (!ideaGroup.jobs.has(offer.jobId)) {
				ideaGroup.jobs.set(offer.jobId, { job, offers: [] });
			}
			
			ideaGroup.jobs.get(offer.jobId)!.offers.push(offer);
		}
		
		return result;
	}

	const currentOffers = $derived(activeTab === 'received' ? receivedOffers : sentOffers);
	const groupedOffers = $derived(groupOffers(currentOffers));

	function getStatusBadge(offerId: string): { label: string; variant: 'success' | 'warning' | 'error' | 'muted' } {
		const status = offerStatuses.get(offerId) ?? 'pending';
		switch (status) {
			case 'accepted': return { label: 'Accepted', variant: 'success' };
			case 'declined': return { label: 'Declined', variant: 'error' };
			default: return { label: 'Pending', variant: 'warning' };
		}
	}

	function toggleIdea(ideaId: string) {
		if (collapsedIdeas.has(ideaId)) {
			collapsedIdeas.delete(ideaId);
		} else {
			collapsedIdeas.add(ideaId);
		}
		collapsedIdeas = new Set(collapsedIdeas);
	}

	function handleOfferClick(offer: Offer) {
		goto(`/offers/${offer.id}`);
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="lg">
		<Stack gap={6}>
			<h1 class="page-title">My Offers</h1>

			{#if !authService.isLoggedIn}
				<Card>
					<p class="text-muted text-center">Please log in to view your offers.</p>
				</Card>
			{:else}
				<!-- Tabs -->
				<div class="tabs">
					<button 
						class="tab" 
						class:active={activeTab === 'received'}
						onclick={() => activeTab = 'received'}
					>
						<Inbox size={18} />
						<span>Received</span>
						{#if receivedOffers.length > 0}
							<span class="tab-count">{receivedOffers.length}</span>
						{/if}
					</button>
					<button 
						class="tab"
						class:active={activeTab === 'sent'}
						onclick={() => activeTab = 'sent'}
					>
						<Send size={18} />
						<span>Sent</span>
						{#if sentOffers.length > 0}
							<span class="tab-count">{sentOffers.length}</span>
						{/if}
					</button>
				</div>

				<!-- Content -->
				<div class="content">
					{#if isLoading}
						<Stack gap={4}>
							{#each Array(2) as _}
								<Skeleton width="100%" height="120px" />
							{/each}
						</Stack>
					{:else if currentOffers.length === 0}
						<Card>
							<div class="empty-state">
								{#if activeTab === 'received'}
									<Inbox size={48} />
									<p>No offers received yet</p>
								{:else}
									<Send size={48} />
									<p>You haven't sent any offers yet</p>
								{/if}
							</div>
						</Card>
					{:else}
						<Stack gap={4}>
							{#each [...groupedOffers.entries()] as [ideaId, { idea, jobs: jobGroups }]}
								{@const isCollapsed = collapsedIdeas.has(ideaId)}
								{@const offerCount = [...jobGroups.values()].reduce((sum, g) => sum + g.offers.length, 0)}
								
								<div class="idea-section">
									<button class="idea-header" onclick={() => toggleIdea(ideaId)}>
										<div class="idea-toggle">
											{#if isCollapsed}
												<ChevronRight size={18} />
											{:else}
												<ChevronDown size={18} />
											{/if}
										</div>
										<Lightbulb size={20} class="idea-icon" />
										<span class="idea-name">{idea?.title ?? 'Unknown Project'}</span>
										<span class="idea-count">{offerCount}</span>
									</button>
									
									{#if !isCollapsed}
										<div class="idea-content">
											<Stack gap={3}>
												{#each [...jobGroups.entries()] as [jobId, { job, offers }]}
													<div class="job-card">
														<div class="job-header">
															<Briefcase size={16} />
															<span class="job-name">{job?.title ?? 'Unknown Job'}</span>
														</div>
														
														<div class="offers-list">
															{#each offers as offer (offer.id)}
																{@const statusBadge = getStatusBadge(offer.id)}
																<!-- Use div with onclick, not nested buttons -->
																<div 
																	class="offer-row" 
																	onclick={() => handleOfferClick(offer)}
																	onkeydown={(e) => e.key === 'Enter' && handleOfferClick(offer)}
																	role="button"
																	tabindex="0"
																>
																	<!-- UserAvatar handles its own click -->
																	<UserAvatar pubkey={offer.pubkey} size="sm" />
																	
																	<div class="offer-info">
																		<div class="offer-details">
																			<span class="offer-amount">
																				<Coins size={12} />
																				{offer.bid.toLocaleString()} sats
																			</span>
																			<span class="offer-duration">
																				<Clock size={12} />
																				{offer.duration}d
																			</span>
																		</div>
																	</div>
																	
																	<div class="offer-status">
																		<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
																		<ArrowRight size={16} class="arrow" />
																	</div>
																</div>
															{/each}
														</div>
													</div>
												{/each}
											</Stack>
										</div>
									{/if}
								</div>
							{/each}
						</Stack>
					{/if}
				</div>
			{/if}
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: var(--space-2);
		background: rgba(255, 255, 255, 0.03);
		padding: var(--space-2);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab:hover {
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.03);
	}

	.tab.active {
		background: var(--orange-500);
		color: white;
	}

	.tab-count {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
	}

	.tab.active .tab-count {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-8);
		color: var(--text-muted);
	}

	/* Idea Section */
	.idea-section {
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: rgba(0, 0, 0, 0.2);
	}

	.idea-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.02);
		border: none;
		cursor: pointer;
		color: var(--text-primary);
		text-align: left;
		transition: background 0.2s ease;
	}

	.idea-header:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.idea-toggle {
		color: var(--text-muted);
	}

	:global(.idea-icon) {
		color: var(--orange-400);
	}

	.idea-name {
		flex: 1;
		font-size: 1rem;
		font-weight: 600;
	}

	.idea-count {
		background: var(--orange-500);
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.idea-content {
		padding: var(--space-4);
		padding-top: 0;
	}

	/* Job Card */
	.job-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}

	.job-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-3);
		margin-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.job-name {
		font-weight: 500;
		color: var(--text-secondary);
	}

	/* Offers List */
	.offers-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.offer-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.offer-row:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--orange-400);
	}

	.offer-info {
		flex: 1;
	}

	.offer-details {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.offer-amount,
	.offer-duration {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.offer-amount {
		color: var(--text-primary);
		font-weight: 500;
	}

	.offer-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	:global(.arrow) {
		color: var(--text-muted);
		transition: transform 0.2s ease;
	}

	.offer-row:hover :global(.arrow) {
		transform: translateX(4px);
		color: var(--orange-400);
	}

	.text-center {
		text-align: center;
	}
</style>
