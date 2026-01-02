<!--
  ContractProofViewer - Display and verify contract proofs
-->
<script lang="ts">
	import type { Contract, SignedEventProof } from '$lib/types/offer';
	import { contractService } from '$lib/services';
	import { Card, Stack, Row, Badge, Button } from '$lib/components';
	import { Shield, ShieldCheck, ShieldX, ChevronDown, ChevronUp, Check } from 'lucide-svelte';

	interface Props {
		contract: Contract;
	}

	let { contract }: Props = $props();

	// Verify proofs
	const verification = $derived(contractService.verifyProofs(contract));
	
	let expandedProof = $state<number | null>(null);

	function toggleProof(index: number) {
		expandedProof = expandedProof === index ? null : index;
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleString();
	}

	function shortenId(id: string): string {
		if (!id) return '—';
		return `${id.slice(0, 8)}...${id.slice(-8)}`;
	}
</script>

<Card>
	<Stack gap={4}>
		<Row justify="between">
			<Row gap={2}>
				{#if verification.valid}
					<ShieldCheck size={20} class="icon-success" />
					<span class="title">Proofs Verified</span>
				{:else}
					<ShieldX size={20} class="icon-error" />
					<span class="title">Proof Errors</span>
				{/if}
			</Row>
			<Badge variant={verification.valid ? 'success' : 'error'}>
				{contract.proofs.length} Proofs
			</Badge>
		</Row>

		<!-- Errors -->
		{#if verification.errors.length > 0}
			<div class="errors">
				{#each verification.errors as error}
					<p class="error-item">⚠️ {error}</p>
				{/each}
			</div>
		{/if}

		<Stack gap={2}>
			{#each contract.proofs as proof, i}
				<div class="proof-item">
					<button class="proof-header" onclick={() => toggleProof(i)}>
						<Row justify="between" gap={2}>
							<Row gap={2}>
								{#if proof.sig}
									<Check size={14} class="icon-success" />
								{:else}
									<Shield size={14} />
								{/if}
								<span class="proof-label">Proof {i + 1}</span>
								<span class="proof-id">{shortenId(proof.id)}</span>
							</Row>
							{#if expandedProof === i}
								<ChevronUp size={14} />
							{:else}
								<ChevronDown size={14} />
							{/if}
						</Row>
					</button>

					{#if expandedProof === i}
						<div class="proof-details">
							<table>
							<tbody>
								<tr>
									<td>Event ID</td>
									<td><code>{proof.id}</code></td>
								</tr>
								<tr>
									<td>Pubkey</td>
									<td><code>{shortenId(proof.pubkey)}</code></td>
								</tr>
								<tr>
									<td>Created</td>
									<td>{formatDate(proof.created_at)}</td>
								</tr>
								<tr>
									<td>Kind</td>
									<td>{proof.kind}</td>
								</tr>
								<tr>
									<td>Signature</td>
									<td>
										{#if proof.sig}
											<code>{shortenId(proof.sig)}</code>
										{:else}
											<span class="missing">Missing</span>
										{/if}
									</td>
								</tr>
							</tbody>
						</table>
						</div>
					{/if}
				</div>
			{/each}
		</Stack>
	</Stack>
</Card>

<style>
	.title {
		font-weight: 600;
		color: var(--text-primary);
	}

	:global(.icon-success) {
		color: var(--success);
	}

	:global(.icon-error) {
		color: var(--error);
	}

	.errors {
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.1);
		border-radius: var(--radius-md);
	}

	.error-item {
		font-size: 0.875rem;
		color: var(--error);
		margin: 0;
	}

	.proof-item {
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.proof-header {
		width: 100%;
		padding: var(--space-3);
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
		text-align: left;
	}

	.proof-header:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.proof-label {
		font-weight: 500;
		color: var(--text-secondary);
	}

	.proof-id {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.proof-details {
		padding: var(--space-3);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		background: rgba(0, 0, 0, 0.2);
	}

	table {
		width: 100%;
		font-size: 0.75rem;
	}

	td {
		padding: var(--space-1) 0;
	}

	td:first-child {
		color: var(--text-muted);
		width: 80px;
	}

	code {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--orange-400);
		word-break: break-all;
	}

	.missing {
		color: var(--error);
		font-size: 0.75rem;
	}
</style>
