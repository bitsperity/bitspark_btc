<!--
  Stack Component - Vertical flex layout
  
  Usage:
    <Stack gap={4}>
      <Card>Item 1</Card>
      <Card>Item 2</Card>
    </Stack>
-->
<script lang="ts">
	interface Props {
		gap?: 1 | 2 | 3 | 4 | 6 | 8;
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		gap = 4,
		class: className = '',
		children
	}: Props = $props();

	const gapClasses: Record<number, string> = {
		1: 'stack-1',
		2: 'stack-2',
		3: 'stack-3',
		4: 'stack-4',
		6: 'stack-6',
		8: 'stack-8'
	};

	const classes = $derived(
		['stack', gapClasses[gap], className].filter(Boolean).join(' ')
	);
</script>

<div class={classes}>
	{@render children()}
</div>

<style>
	.stack-1 { gap: var(--space-1); }
	.stack-3 { gap: var(--space-3); }
</style>
