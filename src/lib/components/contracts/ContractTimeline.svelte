<!--
  ContractTimeline - Shows chronological history of contract events
-->
<script lang="ts">
	import { Stack, Row, Card } from '$lib/components';
	import type { Contract, ContractConfirmation, PullRequest } from '$lib/types/offer';
	import { FileCheck, Shield, Send, MessageCircle, Check, Clock } from 'lucide-svelte';

	interface Props {
		contract: Contract;
		confirmation: ContractConfirmation | null;
		pr: PullRequest | null;
	}

	let { contract, confirmation, pr }: Props = $props();

	interface TimelineEvent {
		icon: typeof FileCheck;
		label: string;
		timestamp: number;
		status: 'completed' | 'current' | 'pending';
		actor?: 'io' | 'dev';
	}

	const events = $derived(() => {
		const items: TimelineEvent[] = [];

		// 1. Contract created
		items.push({
			icon: FileCheck,
			label: 'Contract created',
			timestamp: contract.createdAt,
			status: 'completed',
			actor: 'io'
		});

		// 2. Dev confirmation
		if (confirmation) {
			items.push({
				icon: Shield,
				label: 'Contract signed by Developer',
				timestamp: confirmation.confirmedAt,
				status: 'completed',
				actor: 'dev'
			});
		} else {
			items.push({
				icon: Shield,
				label: 'Awaiting Developer signature',
				timestamp: 0,
				status: 'current',
				actor: 'dev'
			});
			return items; // Stop here if not confirmed
		}

		// 3. PR submitted
		if (pr) {
			items.push({
				icon: Send,
				label: 'Pull Request submitted',
				timestamp: pr.createdAt,
				status: 'completed',
				actor: 'dev'
			});

			// 4. Review status
			if (pr.status === 'changes_requested') {
				items.push({
					icon: MessageCircle,
					label: 'Changes requested',
					timestamp: pr.createdAt + 1, // Slightly after
					status: 'current',
					actor: 'io'
				});
			} else if (pr.status === 'approved') {
				items.push({
					icon: Check,
					label: 'PR approved',
					timestamp: pr.createdAt + 1,
					status: 'completed',
					actor: 'io'
				});
			} else {
				items.push({
					icon: Clock,
					label: 'Awaiting review',
					timestamp: 0,
					status: 'current',
					actor: 'io'
				});
			}
		} else {
			items.push({
				icon: Send,
				label: 'Awaiting Pull Request',
				timestamp: 0,
				status: 'current',
				actor: 'dev'
			});
		}

		return items;
	});

	function formatTime(timestamp: number): string {
		if (timestamp === 0) return '';
		return new Date(timestamp * 1000).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Card>
	<Stack gap={4}>
		<h3 class="section-title">Contract History</h3>
		
		<div class="timeline">
			{#each events() as event, i}
				<div class="timeline-item {event.status}">
					<div class="timeline-line">
						<div class="timeline-dot">
							<svelte:component this={event.icon} size={14} />
						</div>
						{#if i < events().length - 1}
							<div class="timeline-connector"></div>
						{/if}
					</div>
					<div class="timeline-content">
						<span class="timeline-label">{event.label}</span>
						<Row gap={2}>
							{#if event.timestamp > 0}
								<span class="timeline-time">{formatTime(event.timestamp)}</span>
							{/if}
							{#if event.actor}
								<span class="timeline-actor">{event.actor === 'io' ? 'IO' : 'Dev'}</span>
							{/if}
						</Row>
					</div>
				</div>
			{/each}
		</div>
	</Stack>
</Card>

<style>
	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.timeline {
		display: flex;
		flex-direction: column;
	}

	.timeline-item {
		display: flex;
		gap: var(--space-3);
	}

	.timeline-line {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 28px;
	}

	.timeline-dot {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.timeline-item.completed .timeline-dot {
		background: rgba(16, 185, 129, 0.2);
		color: var(--success);
	}

	.timeline-item.current .timeline-dot {
		background: rgba(251, 191, 36, 0.2);
		color: var(--warning);
	}

	.timeline-item.pending .timeline-dot {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-muted);
	}

	.timeline-connector {
		width: 2px;
		flex: 1;
		min-height: 20px;
		background: var(--border-subtle);
		margin: var(--space-1) 0;
	}

	.timeline-content {
		padding-bottom: var(--space-4);
		flex: 1;
	}

	.timeline-label {
		font-weight: 500;
		color: var(--text-primary);
		display: block;
	}

	.timeline-time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.timeline-actor {
		font-size: 0.625rem;
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-muted);
		text-transform: uppercase;
	}
</style>
