<!--
  Row Component - Horizontal flex layout
  
  Usage:
    <Row gap={4} justify="between">
      <Button>Left</Button>
      <Button>Right</Button>
    </Row>
-->
<script lang="ts">
	interface Props {
		gap?: 1 | 2 | 3 | 4 | 6;
		align?: 'start' | 'center' | 'end' | 'stretch';
		justify?: 'start' | 'center' | 'end' | 'between' | 'around';
		wrap?: boolean;
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		gap = 2,
		align = 'center',
		justify = 'start',
		wrap = false,
		class: className = '',
		children
	}: Props = $props();

	const gapClasses: Record<number, string> = {
		1: 'row-1',
		2: 'row-2',
		3: 'row-3',
		4: 'row-4',
		6: 'row-6'
	};

	const classes = $derived(
		['row', gapClasses[gap], className].filter(Boolean).join(' ')
	);

	const style = $derived(
		[
			align !== 'center' ? `align-items: ${align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align}` : '',
			justify !== 'start' ? `justify-content: ${justify === 'between' ? 'space-between' : justify === 'around' ? 'space-around' : justify === 'end' ? 'flex-end' : justify}` : '',
			wrap ? 'flex-wrap: wrap' : ''
		].filter(Boolean).join('; ')
	);
</script>

<div class={classes} {style}>
	{@render children()}
</div>

<style>
	.row-1 { gap: var(--space-1); }
	.row-3 { gap: var(--space-3); }
</style>
