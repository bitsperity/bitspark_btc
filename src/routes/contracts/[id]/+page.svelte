<!--
  Contract Detail Page
  
  Clean architecture using:
  - useContractDetail composable (state machine)
  - ContractPhaseCard (phase-based rendering)
  - ContractHeader & ContractParties (shared UI)
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Skeleton, Card, Button, Modal, Textarea } from '$lib/components';
	import { ContractHeader, ContractParties, IOContractActions, DevContractActions, ContractTimeline } from '$lib/components/contracts';
	import { ContractProofViewer } from '$lib/components/contracts';
	import { PRCard, PRSubmitForm } from '$lib/components/offers';
	import { useContractDetail } from '$lib/composables';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';

	const contractId = $derived($page.params.id);
	
	const detail = useContractDetail(() => contractId);

	// Local UI state
	let showPRForm = $state(false);
	let showFeedbackForm = $state(false);
	let feedbackText = $state('');

	// Action handlers
	function handleSubmitPR() {
		showPRForm = true;
	}

	async function handlePRSubmitted(prUrl: string, message: string) {
		await detail.submitPR(prUrl, message);
		showPRForm = false;
		await detail.refresh();
	}

	function handleRequestChanges() {
		showFeedbackForm = true;
	}

	async function submitFeedback() {
		if (!feedbackText.trim()) return;
		await detail.requestChanges(feedbackText);
		feedbackText = '';
		showFeedbackForm = false;
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="md">
		{#if detail.isLoading()}
			<Stack gap={6}>
				<Skeleton width="100px" height="1rem" />
				<Skeleton width="80%" height="2rem" />
				<Skeleton width="100%" height="300px" />
			</Stack>
		{:else if !detail.contract()}
			<Card>
				<Stack gap={4}>
					<h1>Contract Not Found</h1>
					<p class="text-muted">This contract may have been deleted or doesn't exist.</p>
					<Button variant="primary" onclick={() => goto('/dashboard/contracts')}>
						Back to Contracts
					</Button>
				</Stack>
			</Card>
		{:else}
			{@const contract = detail.contract()!}
			{@const phase = detail.phase()}
			{@const userRole = detail.userRole()}

			<Stack gap={5}>
				<!-- Back link -->
				<a href="/dashboard/contracts" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Contracts</span>
				</a>

				<!-- Header Card -->
				<Card>
					<Stack gap={5}>
						<ContractHeader 
							{contract} 
							job={detail.job()} 
							{phase} 
						/>
						
						<ContractParties
							ioProfile={detail.ioProfile()}
							devProfile={detail.devProfile()}
							ioPubkey={contract.ioPubkey}
							devPubkey={contract.developerPubkey}
							{userRole}
							agreedBid={contract.agreedBid}
						/>
					</Stack>
				</Card>

				<!-- Role-Based Action Card -->
				{#if userRole === 'io'}
					<IOContractActions
						{phase}
						confirmation={detail.confirmation()}
						pr={detail.pr()}
						isActioning={detail.isActioning()}
						onapprovepr={detail.approvePR}
						onrequestchanges={handleRequestChanges}
					/>
				{:else if userRole === 'dev'}
					<DevContractActions
						{phase}
						confirmation={detail.confirmation()}
						pr={detail.pr()}
						isActioning={detail.isActioning()}
						onconfirm={detail.confirmContract}
						onsubmitpr={handleSubmitPR}
					/>
				{/if}

				<!-- PR Form (shown when submitting) -->
				{#if showPRForm && detail.contract()}
					<Card>
						<PRSubmitForm 
							contract={detail.contract()!}
							onsubmit={handlePRSubmitted}
							oncancel={() => showPRForm = false}
						/>
					</Card>
				{/if}

				<!-- PR Card (shown when PR exists) -->
				{#if detail.pr() && !showPRForm}
					<Card>
						<Stack gap={4}>
							<h2 class="section-title">Pull Request</h2>
							<PRCard 
								pr={detail.pr()!} 
								contract={detail.contract()!}
								onupdate={detail.refresh}
							/>
						</Stack>
					</Card>
				{/if}

				<!-- Request Changes Modal -->
				<Modal bind:open={showFeedbackForm} title="Request Changes">
					<Stack gap={4}>
						<p class="modal-description">Describe the changes needed for the developer to address.</p>
						<Textarea
							bind:value={feedbackText}
							placeholder="Please update the error handling in..."
							rows={4}
						/>
					</Stack>
					{#snippet footer()}
						<Button variant="ghost" onclick={() => showFeedbackForm = false}>
							Cancel
						</Button>
						<Button variant="primary" onclick={submitFeedback}>
							Submit Feedback
						</Button>
					{/snippet}
				</Modal>

				<!-- Timeline -->
				<ContractTimeline 
					{contract}
					confirmation={detail.confirmation()}
					allPRs={detail.allPRs()}
				/>

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
		margin-bottom: var(--space-2);
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.feedback-input {
		width: 100%;
		min-height: 100px;
		padding: var(--space-3);
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		resize: vertical;
	}

	.feedback-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}
</style>
