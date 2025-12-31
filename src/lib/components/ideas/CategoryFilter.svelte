<!--
  CategoryFilter - Horizontal category chip filter
-->
<script lang="ts">
	import { IDEA_CATEGORIES, type IdeaCategory } from '$lib/types/idea';
	import { Badge } from '$lib/components';

	interface Props {
		selected?: string;
		onchange?: (category: string | undefined) => void;
	}

	let { selected, onchange }: Props = $props();

	function handleClick(category: string | undefined) {
		onchange?.(category);
	}

	const categoryLabels: Record<string, string> = {
		defi: '💰 DeFi',
		gaming: '🎮 Gaming',
		social: '💬 Social',
		tools: '🔧 Tools',
		infrastructure: '🏗️ Infrastructure',
		other: '📦 Other'
	};
</script>

<div class="category-filter">
	<button 
		class="category-chip" 
		class:active={!selected}
		onclick={() => handleClick(undefined)}
	>
		All
	</button>
	{#each IDEA_CATEGORIES as category}
		<button 
			class="category-chip" 
			class:active={selected === category}
			onclick={() => handleClick(category)}
		>
			{categoryLabels[category] ?? category}
		</button>
	{/each}
</div>

<style>
	.category-filter {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		padding: var(--space-2) 0;
	}

	.category-chip {
		padding: var(--space-2) var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.category-chip:hover {
		background: var(--bg-elevated);
		color: var(--text-secondary);
	}

	.category-chip.active {
		background: var(--orange-500);
		border-color: var(--orange-500);
		color: white;
	}
</style>
