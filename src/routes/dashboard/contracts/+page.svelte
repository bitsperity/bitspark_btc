<!--
  My Contracts Dashboard
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Button } from '$lib/components';
	import { ContractCard } from '$lib/components/offers';
	import { contractService, authService } from '$lib/services';
	import type { Contract } from '$lib/types/offer';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { FileCheck } from 'lucide-svelte';

	let contracts = $state<Contract[]>([]);
	let isLoading = $state(true);
	let unsub: (() => void) | undefined;

	// React to login state
	$effect(() => {
		const loggedIn = authService.isLoggedIn;
		
		if (loggedIn) {
			// Small delay to let services initialize
			setTimeout(() => startSubscription(), 500);
		} else {
			cleanup();
		}
	});

	function startSubscription() {
		cleanup();
		isLoading = true;

		const store = contractService.subscribeToMyContracts();
		if (!store) {
			isLoading = false;
			return;
		}

		unsub = store.subscribe(events => {
			contracts = (events as NDKEvent[]).map(e => contractService.parseContractEvent(e));
			isLoading = false;
		});

		// Timeout for loading state
		setTimeout(() => { isLoading = false; }, 5000);
	}

	function cleanup() {
		unsub?.();
		contracts = [];
	}

	onDestroy(cleanup);

	function handleContractClick(contract: Contract) {
		goto(`/contracts/${contract.id}`);
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="lg">
		<Stack gap={6}>
			<Row justify="between">
				<Row gap={2}>
					<FileCheck size={28} class="page-icon" />
					<h1 class="text-display-lg">My Contracts</h1>
				</Row>
			</Row>

			{#if !authService.isLoggedIn}
				<Card>
					<p class="text-muted">Please log in to view your contracts.</p>
				</Card>
			{:else if isLoading}
				<div class="contracts-grid">
					{#each Array(3) as _}
						<Skeleton width="100%" height="180px" />
					{/each}
				</div>
			{:else if contracts.length === 0}
				<Card>
					<Stack gap={4} class="empty-state">
						<FileCheck size={48} class="text-muted" />
						<h2>No Contracts Yet</h2>
						<p class="text-muted">
							Contracts are created when offers are accepted. Browse jobs and start applying!
						</p>
						<Button variant="primary" onclick={() => goto('/jobs')}>
							Browse Jobs
						</Button>
					</Stack>
				</Card>
			{:else}
				<div class="contracts-grid">
					{#each contracts as contract (contract.id)}
						<ContractCard {contract} onclick={() => handleContractClick(contract)} />
					{/each}
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

	:global(.page-icon) {
		color: var(--orange-500);
	}

	.contracts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-4);
	}

	:global(.empty-state) {
		align-items: center;
		text-align: center;
		padding: var(--space-8);
	}
</style>
