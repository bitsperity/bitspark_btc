<!--
  My Offers Dashboard - Clean version using composables and components
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Skeleton, Card } from '$lib/components';
	import { OffersTabs, OffersIdeaGroup } from '$lib/components/offers';
	import { useOffers } from '$lib/composables';
	import { authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Inbox, Send } from 'lucide-svelte';
	import type { Offer } from '$lib/types/offer';

	// Use composable for all business logic
	const { receivedOffers, sentOffers, isLoading, groupOffersByIdea, getStatusBadge } = useOffers();

	let activeTab = $state<'received' | 'sent'>('received');

	const currentOffers = $derived(activeTab === 'received' ? receivedOffers() : sentOffers());
	const groupedOffers = $derived(groupOffersByIdea(currentOffers));

	function handleOfferClick(offer: Offer) {
		goto(`/offers/${offer.id}`);
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="lg">
		<Stack gap={6}>
			<h1 class="text-display-lg">My Offers</h1>

			{#if !authService.isLoggedIn}
				<Card>
					<p class="text-muted text-center">Please log in to view your offers.</p>
				</Card>
			{:else}
				<OffersTabs 
					{activeTab}
					receivedCount={receivedOffers().length}
					sentCount={sentOffers().length}
					onTabChange={(tab) => activeTab = tab}
				/>

				<div class="content">
					{#if isLoading()}
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
							{#each [...groupedOffers.entries()] as [ideaId, { idea, jobs }]}
								<OffersIdeaGroup 
									{idea} 
									{jobs} 
									{getStatusBadge}
									onOfferClick={handleOfferClick}
								/>
							{/each}
						</Stack>
					{/if}
				</div>
			{/if}
		</Stack>
	</Container>
</main>

<!-- All styles now in $lib/styles/pages.css -->
