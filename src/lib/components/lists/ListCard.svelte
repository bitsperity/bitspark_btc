<!--
  ListCard - Display a list preview card
  
  Shows title, description, item count, and navigates to list detail.
-->
<script lang="ts">
	import { Card, Row, Badge } from '$lib/components';
	import type { List } from '$lib/services';
	import { FolderOpen, Lightbulb, Briefcase, MessageCircle, Trash2 } from 'lucide-svelte';

	interface Props {
		list: List;
		href?: string;
		ondelete?: (listId: string) => void;
	}

	let { list, href = `/lists/${list.id}`, ondelete }: Props = $props();

	// Count by type
	const ideaCount = $derived(list.items.filter(i => i.type === 'idea').length);
	const jobCount = $derived(list.items.filter(i => i.type === 'job').length);
	const commentCount = $derived(list.items.filter(i => i.type === 'comment').length);
	const totalCount = $derived(list.items.length);

	function handleDelete(e: MouseEvent) {
		console.log('[ListCard] Delete clicked for:', list.id, list.title);
		e.preventDefault();
		e.stopPropagation();
		if (ondelete) {
			console.log('[ListCard] Calling ondelete');
			ondelete(list.id);
		} else {
			console.error('[ListCard] ondelete is undefined!');
		}
	}
</script>

<a {href} class="list-card-link">
	<div class="card-wrapper">
		{#if ondelete}
			<button class="delete-btn" onclick={handleDelete} title="Delete list">
				<Trash2 size={14} />
			</button>
		{/if}
		<Card hover class="list-card">
			<Row justify="between" align="start">
				<div class="list-info">
					<Row gap={2}>
						<FolderOpen size={18} class="list-icon" />
						<h3 class="list-title">{list.title}</h3>
					</Row>
					{#if list.description}
						<p class="list-description">{list.description}</p>
					{/if}
				</div>
				<Badge variant="muted" size="sm">{totalCount} items</Badge>
			</Row>

			{#if totalCount > 0}
				<Row gap={3} class="item-counts">
					{#if ideaCount > 0}
						<span class="count-badge">
							<Lightbulb size={12} />
							{ideaCount}
						</span>
					{/if}
					{#if jobCount > 0}
						<span class="count-badge">
							<Briefcase size={12} />
							{jobCount}
						</span>
					{/if}
					{#if commentCount > 0}
						<span class="count-badge">
							<MessageCircle size={12} />
							{commentCount}
						</span>
					{/if}
				</Row>
			{/if}
		</Card>
	</div>
</a>

<style>
	.list-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	:global(.list-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		transition: all var(--duration-fast) var(--ease-out);
	}

	:global(.list-card:hover) {
		transform: translateY(-2px);
	}

	.list-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	:global(.list-icon) {
		color: var(--primary);
	}

	.list-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.list-description {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	:global(.item-counts) {
		padding-top: var(--space-2);
		border-top: 1px solid var(--border-subtle);
	}

	.count-badge {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.card-wrapper {
		position: relative;
	}

	.card-wrapper:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0;
		transition: all var(--duration-fast) var(--ease-out);
		z-index: 10;
	}

	.delete-btn:hover {
		background: rgba(220, 38, 38, 0.8);
		border-color: rgba(220, 38, 38, 0.5);
		color: white;
		transform: scale(1.1);
	}
</style>
