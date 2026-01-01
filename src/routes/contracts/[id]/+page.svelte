<!--
  Contract Detail Page
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Skeleton, Card, Badge, Button } from '$lib/components';
	import { ContractProofViewer } from '$lib/components/offers';
	import { contractService, jobService, profileService, authService } from '$lib/services';
	import type { Contract } from '$lib/types/offer';
	import type { Job } from '$lib/types/job';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, FileCheck, Coins, Briefcase, Users, RefreshCw, Shield } from 'lucide-svelte';

	const contractId = $derived($page.params.id);

	let contract = $state<Contract | null>(null);
	let job = $state<Job | null>(null);
	let devProfile = $state<NDKUserProfile | null>(null);
	let ioProfile = $state<NDKUserProfile | null>(null);
	let isLoading = $state(true);
	let isRepublishing = $state(false);

	$effect(() => {
		loadContract();
	});

	async function loadContract() {
		isLoading = true;
		try {
			contract = await contractService.getContract(contractId);
			if (contract) {
				job = await jobService.getJob(contract.jobId);
				devProfile = await profileService.getProfile(contract.developerPubkey);
				ioProfile = await profileService.getProfile(contract.ioPubkey);
			}
		} catch (e) {
			console.error('[ContractDetail] Load error:', e);
		} finally {
			isLoading = false;
		}
	}

	const isDev = $derived(contract && authService.user?.pubkey === contract.developerPubkey);
	const isIO = $derived(contract && authService.user?.pubkey === contract.ioPubkey);

	async function handleRepublish() {
		if (!contract) return;
		isRepublishing = true;
		try {
			await contractService.republishContract(contract);
			// Reload to show updated state
			await loadContract();
		} catch (e) {
			console.error('[ContractDetail] Republish error:', e);
		} finally {
			isRepublishing = false;
		}
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="md">
		{#if isLoading}
			<Stack gap={6}>
				<Skeleton width="100px" height="1rem" />
				<Skeleton width="80%" height="2rem" />
				<Skeleton width="100%" height="300px" />
			</Stack>
		{:else if !contract}
			<Card>
				<Stack gap={4} class="not-found">
					<h1>Contract Not Found</h1>
					<p class="text-muted">This contract may have been deleted or doesn't exist.</p>
					<Button variant="primary" onclick={() => goto('/dashboard/contracts')}>
						Back to Contracts
					</Button>
				</Stack>
			</Card>
		{:else}
			<Stack gap={6}>
				<a href="/dashboard/contracts" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Contracts</span>
				</a>

				<!-- Header -->
				<Card>
					<Stack gap={5}>
						<Row justify="between">
							<Row gap={3}>
								<FileCheck size={28} class="contract-icon" />
								<h1 class="text-display-md">Contract</h1>
							</Row>
							<Badge variant="success">Active</Badge>
						</Row>

						<!-- Job Reference -->
						{#if job}
							<a href="/jobs/{job.id}" class="job-link">
								<Row gap={2}>
									<Briefcase size={16} />
									<span>{job.title}</span>
								</Row>
							</a>
						{/if}

						<!-- Parties -->
						<div class="parties-section">
							<h3>
								<Users size={16} />
								Parties
							</h3>
							<div class="parties-grid">
								<div class="party-card">
									<span class="party-role">Idea Owner</span>
									<span class="party-name">{ioProfile?.name ?? 'Anonymous'}</span>
									{#if isIO}
										<Badge variant="secondary" size="sm">You</Badge>
									{/if}
								</div>
								<div class="party-card">
									<span class="party-role">Developer</span>
									<span class="party-name">{devProfile?.name ?? 'Anonymous'}</span>
									{#if isDev}
										<Badge variant="secondary" size="sm">You</Badge>
									{/if}
								</div>
							</div>
						</div>

						<!-- Agreed Bid -->
						<div class="bid-section">
							<Row gap={2}>
								<Coins size={20} />
								<span class="bid-label">Agreed Payment</span>
							</Row>
							<span class="bid-value">{contract.agreedBid.toLocaleString()} sats</span>
						</div>

						<!-- Dev Actions -->
						{#if isDev && !contract.isRepublished}
							<div class="action-section">
								<p class="action-hint">Republish this contract to confirm you received it:</p>
								<Button variant="primary" onclick={handleRepublish} disabled={isRepublishing}>
									{#if isRepublishing}
										<RefreshCw size={16} class="spinning" />
									{:else}
										<Shield size={16} />
									{/if}
									<span>Confirm & Republish</span>
								</Button>
							</div>
						{/if}
					</Stack>
				</Card>

				<!-- Proofs -->
				<ContractProofViewer {contract} />
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

	:global(.contract-icon) {
		color: var(--orange-500);
	}

	.job-link {
		display: inline-flex;
		padding: var(--space-3) var(--space-4);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--orange-400);
		font-weight: 500;
	}

	.job-link:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.parties-section h3 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-bottom: var(--space-3);
	}

	.parties-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.party-card {
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.party-role {
		font-size: 0.625rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.party-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.bid-section {
		padding: var(--space-4);
		background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05));
		border-radius: var(--radius-lg);
		border: 1px solid rgba(249, 115, 22, 0.2);
	}

	.bid-label {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.bid-value {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		color: var(--orange-500);
		margin-top: var(--space-2);
	}

	.action-section {
		padding: var(--space-4);
		background: rgba(34, 197, 94, 0.1);
		border-radius: var(--radius-md);
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.action-hint {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: var(--space-3);
	}

	:global(.not-found) {
		align-items: center;
		text-align: center;
		padding: var(--space-8);
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
