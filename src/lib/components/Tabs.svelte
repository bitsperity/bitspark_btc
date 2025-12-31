<!--
  Tabs Component - Tabbed navigation
  
  Usage:
    <Tabs items={[
      { id: 'overview', label: 'Overview' },
      { id: 'jobs', label: 'Jobs' },
      { id: 'activity', label: 'Activity' }
    ]} bind:active />
-->
<script lang="ts">
	interface TabItem {
		id: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		items: TabItem[];
		active?: string;
		class?: string;
	}

	let {
		items,
		active = $bindable(items[0]?.id ?? ''),
		class: className = ''
	}: Props = $props();
</script>

<div class="tabs {className}" role="tablist">
	{#each items as item}
		<button
			class="tab"
			class:active={active === item.id}
			disabled={item.disabled}
			role="tab"
			aria-selected={active === item.id}
			onclick={() => active = item.id}
		>
			{item.label}
		</button>
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.tab {
		flex: 1;
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.tab:hover:not(:disabled) {
		color: var(--text-secondary);
	}

	.tab.active {
		color: var(--text-primary);
		background: var(--bg-elevated);
		box-shadow: var(--shadow-sm);
	}

	.tab:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
