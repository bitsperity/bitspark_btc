<!--
  ContractProofViewer - Display and verify contract proofs with full details
-->
<script lang="ts">
	import type { Contract, SignedEventProof } from '$lib/types/offer';
	import { contractService } from '$lib/services';
	import { Card, Stack, Row, Badge, Button } from '$lib/components';
	import { Shield, ShieldCheck, ShieldX, ChevronDown, ChevronUp, Check, Copy, CheckCircle } from 'lucide-svelte';

	interface Props {
		contract: Contract;
	}

	let { contract }: Props = $props();

	// Verify proofs
	const verification = $derived(contractService.verifyProofs(contract));
	
	let expandedProof = $state<number | null>(null);
	let copiedField = $state<string | null>(null);

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

	async function copyToClipboard(text: string, fieldName: string) {
		await navigator.clipboard.writeText(text);
		copiedField = fieldName;
		setTimeout(() => copiedField = null, 2000);
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
							<!-- Basic Info -->
							<div class="detail-section">
								<h4>Event Info</h4>
								<table>
								<tbody>
									<tr>
										<td>Event ID</td>
										<td>
											<code>{proof.id}</code>
											<button class="copy-btn" onclick={() => copyToClipboard(proof.id, `id-${i}`)}>
												{#if copiedField === `id-${i}`}
													<CheckCircle size={12} />
												{:else}
													<Copy size={12} />
												{/if}
											</button>
										</td>
									</tr>
									<tr>
										<td>Pubkey</td>
										<td>
											<code>{proof.pubkey}</code>
											<button class="copy-btn" onclick={() => copyToClipboard(proof.pubkey, `pub-${i}`)}>
												{#if copiedField === `pub-${i}`}
													<CheckCircle size={12} />
												{:else}
													<Copy size={12} />
												{/if}
											</button>
										</td>
									</tr>
									<tr>
										<td>Kind</td>
										<td>{proof.kind}</td>
									</tr>
									<tr>
										<td>Created</td>
										<td>{formatDate(proof.created_at)}</td>
									</tr>
								</tbody>
								</table>
							</div>

							<!-- Signature -->
							<div class="detail-section">
								<h4>Signature</h4>
								{#if proof.sig}
									<div class="sig-box">
										<code class="sig-value">{proof.sig}</code>
										<button class="copy-btn" onclick={() => copyToClipboard(proof.sig, `sig-${i}`)}>
											{#if copiedField === `sig-${i}`}
												<CheckCircle size={12} />
											{:else}
												<Copy size={12} />
											{/if}
										</button>
									</div>
								{:else}
									<span class="missing">Missing Signature</span>
								{/if}
							</div>

							<!-- Tags -->
							{#if proof.tags && proof.tags.length > 0}
								<div class="detail-section">
									<h4>Tags ({proof.tags.length})</h4>
									<div class="tags-list">
										{#each proof.tags as tag}
											<div class="tag-item">
												<span class="tag-key">{tag[0]}</span>
												<span class="tag-values">{tag.slice(1).join(', ')}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Content -->
							{#if proof.content}
								<div class="detail-section">
									<h4>Content</h4>
									<pre class="content-box">{proof.content}</pre>
								</div>
							{/if}

							<!-- Raw JSON -->
							<div class="detail-section">
								<Row justify="between">
									<h4>Raw Event</h4>
									<button 
										class="copy-raw-btn" 
										onclick={() => copyToClipboard(JSON.stringify(proof, null, 2), `raw-${i}`)}
									>
										{#if copiedField === `raw-${i}`}
											<CheckCircle size={12} />
											<span>Copied!</span>
										{:else}
											<Copy size={12} />
											<span>Copy JSON</span>
										{/if}
									</button>
								</Row>
							</div>
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
		border: 1px solid var(--border-subtle);
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
		padding: var(--space-4);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		background: rgba(0, 0, 0, 0.2);
	}

	.detail-section {
		margin-bottom: var(--space-4);
	}

	.detail-section:last-child {
		margin-bottom: 0;
	}

	.detail-section h4 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 0 0 var(--space-2) 0;
	}

	table {
		width: 100%;
		font-size: 0.8rem;
	}

	td {
		padding: var(--space-1) 0;
		vertical-align: top;
	}

	td:first-child {
		color: var(--text-muted);
		width: 80px;
		white-space: nowrap;
	}

	code {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--orange-400);
		word-break: break-all;
	}

	.copy-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px;
		margin-left: var(--space-2);
		opacity: 0.6;
	}

	.copy-btn:hover {
		opacity: 1;
		color: var(--orange-400);
	}

	.sig-box {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-2);
		background: rgba(0, 0, 0, 0.3);
		border-radius: var(--radius-sm);
	}

	.sig-value {
		flex: 1;
		word-break: break-all;
	}

	.missing {
		color: var(--error);
		font-size: 0.75rem;
	}

	.tags-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.tag-item {
		display: flex;
		gap: var(--space-2);
		font-size: 0.75rem;
		padding: var(--space-1) var(--space-2);
		background: rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-sm);
	}

	.tag-key {
		color: var(--orange-400);
		font-weight: 600;
		min-width: 24px;
	}

	.tag-values {
		color: var(--text-secondary);
		word-break: break-all;
	}

	.content-box {
		background: rgba(0, 0, 0, 0.3);
		padding: var(--space-3);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--text-secondary);
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
		margin: 0;
	}

	.copy-raw-btn {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		padding: var(--space-1) var(--space-2);
		font-size: 0.75rem;
		color: var(--text-muted);
		cursor: pointer;
	}

	.copy-raw-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}
</style>
