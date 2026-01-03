<!--
  My Contracts Dashboard
  
  Features:
  - Tabs: "As IO" | "As Dev"
  - List view with status grouping
  - Active vs Archive sections
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Button } from '$lib/components';
	import { ContractListItem } from '$lib/components/offers';
	import { contractService, authService } from '$lib/services';
	import type { Contract } from '$lib/types/offer';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { FileCheck, Briefcase, Code } from 'lucide-svelte';

	let contracts = $state<Contract[]>([]);
	let isLoading = $state(true);
	let activeTab = $state<'io' | 'dev'>('io');
	let unsub: (() => void) | undefined;

	// React to login state
	$effect(() => {
		const loggedIn = authService.isLoggedIn;
		
		if (loggedIn) {
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

		setTimeout(() => { isLoading = false; }, 5000);
	}

	function cleanup() {
		unsub?.();
		contracts = [];
	}

	onDestroy(cleanup);

	// Filter by role
	const ioContracts = $derived(
		contracts.filter(c => c.ioPubkey === authService.user?.pubkey)
			.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
	);

	const devContracts = $derived(
		contracts.filter(c => c.developerPubkey === authService.user?.pubkey)
			.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
	);

	const currentContracts = $derived(
		activeTab === 'io' ? ioContracts : devContracts
	);

	// TODO: Add archive logic when completed status is tracked
	const activeContracts = $derived(currentContracts);
	const archivedContracts = $derived<Contract[]>([]);

	function handleContractClick(contract: Contract) {
		goto(`/contracts/${contract.id}`);
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="lg">
		<Stack gap={6}>
			<!-- Header -->
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
			{:else}
				<!-- Tabs -->
				<div class="tabs">
					<button 
						class="tab" 
						class:active={activeTab === 'io'}
						onclick={() => activeTab = 'io'}
					>
						<Briefcase size={16} />
						<span>As IO</span>
						{#if ioContracts.length > 0}
							<span class="tab-count">{ioContracts.length}</span>
						{/if}
					</button>
					<button 
						class="tab" 
						class:active={activeTab === 'dev'}
						onclick={() => activeTab = 'dev'}
					>
						<Code size={16} />
						<span>As Dev</span>
						{#if devContracts.length > 0}
							<span class="tab-count">{devContracts.length}</span>
						{/if}
					</button>
				</div>

				{#if isLoading}
					<Stack gap={2}>
						{#each Array(3) as _}
							<Skeleton width="100%" height="64px" />
						{/each}
					</Stack>
				{:else if currentContracts.length === 0}
					<Card>
						<Stack gap={4} class="empty-state">
							<FileCheck size={48} class="text-muted" />
							<h2>No Contracts {activeTab === 'io' ? 'as Idea Owner' : 'as Developer'}</h2>
							<p class="text-muted">
								{#if activeTab === 'io'}
									Accept offers on your jobs to create contracts.
								{:else}
									Get your offers accepted to start working on contracts.
								{/if}
							</p>
							<Button variant="primary" onclick={() => goto(activeTab === 'io' ? '/ideas' : '/jobs')}>
								{activeTab === 'io' ? 'Post an Idea' : 'Browse Jobs'}
							</Button>
						</Stack>
					</Card>
				{:else}
					<!-- Active Contracts -->
					<Stack gap={3}>
						<h2 class="section-title">Active ({activeContracts.length})</h2>
						<div class="contracts-list">
							{#each activeContracts as contract (contract.id)}
								<ContractListItem 
									{contract} 
									role={activeTab}
									onclick={() => handleContractClick(contract)} 
								/>
							{/each}
						</div>
					</Stack>

					<!-- Archive (if any) -->
					{#if archivedContracts.length > 0}
						<Stack gap={3}>
							<h2 class="section-title text-muted">Archive ({archivedContracts.length})</h2>
							<div class="contracts-list">
								{#each archivedContracts as contract (contract.id)}
									<ContractListItem 
										{contract} 
										role={activeTab}
										onclick={() => handleContractClick(contract)} 
									/>
								{/each}
							</div>
						</Stack>
					{/if}
				{/if}
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

	.tabs {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-1);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: var(--text-primary);
		background: var(--bg-card);
	}

	.tab-count {
		font-size: 0.75rem;
		padding: 2px 6px;
		background: var(--orange-500);
		color: white;
		border-radius: var(--radius-full);
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-primary);
	}

	.contracts-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	:global(.empty-state) {
		align-items: center;
		text-align: center;
		padding: var(--space-8);
	}
</style>
