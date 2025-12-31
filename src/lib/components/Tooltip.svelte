<!--
  Tooltip Component - Hover information
  
  Usage:
    <Tooltip text="More information here">
      <Button>Hover me</Button>
    </Tooltip>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		class?: string;
		children: Snippet;
	}

	let {
		text,
		position = 'top',
		class: className = '',
		children
	}: Props = $props();
</script>

<div class="tooltip-wrapper {className}">
	{@render children()}
	<span class="tooltip tooltip-{position}" role="tooltip">
		{text}
	</span>
</div>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-flex;
	}

	.tooltip {
		position: absolute;
		z-index: var(--z-tooltip);
		padding: var(--space-2) var(--space-3);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		background: var(--space-700);
		border-radius: var(--radius-md);
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all var(--duration-fast) var(--ease-out);
		pointer-events: none;
	}

	.tooltip-wrapper:hover .tooltip {
		opacity: 1;
		visibility: visible;
	}

	.tooltip-top {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(-4px);
		margin-bottom: var(--space-2);
	}

	.tooltip-wrapper:hover .tooltip-top {
		transform: translateX(-50%) translateY(0);
	}

	.tooltip-bottom {
		top: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(4px);
		margin-top: var(--space-2);
	}

	.tooltip-wrapper:hover .tooltip-bottom {
		transform: translateX(-50%) translateY(0);
	}

	.tooltip-left {
		right: 100%;
		top: 50%;
		transform: translateY(-50%) translateX(-4px);
		margin-right: var(--space-2);
	}

	.tooltip-wrapper:hover .tooltip-left {
		transform: translateY(-50%) translateX(0);
	}

	.tooltip-right {
		left: 100%;
		top: 50%;
		transform: translateY(-50%) translateX(4px);
		margin-left: var(--space-2);
	}

	.tooltip-wrapper:hover .tooltip-right {
		transform: translateY(-50%) translateX(0);
	}
</style>
