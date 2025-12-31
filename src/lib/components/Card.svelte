<!--
  Card Component
  
  Usage:
    <Card>Default card</Card>
    <Card variant="glow">Card with animated border on hover</Card>
-->
<script lang="ts">
	import type { CardVariant } from '$lib/types';

	interface Props {
		variant?: CardVariant;
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		variant = 'default',
		class: className = '',
		children
	}: Props = $props();

	const variantClasses: Record<CardVariant, string> = {
		default: 'glass-card',
		glow: 'glass-card-glow'
	};

	const classes = $derived(
		[variantClasses[variant], className].filter(Boolean).join(' ')
	);
</script>

<article class={classes}>
	{@render children()}
</article>
