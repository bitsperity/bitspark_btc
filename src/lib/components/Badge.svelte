<!--
  Badge Component
  
  Usage:
    <Badge>Default</Badge>
    <Badge variant="primary"><Lightbulb size={10} /> Idea</Badge>
    <Badge variant="success">Completed</Badge>
-->
<script lang="ts">
	import type { BadgeVariant } from '$lib/types';

	interface Props {
		variant?: BadgeVariant;
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		variant = 'default',
		class: className = '',
		children
	}: Props = $props();

	const baseClass = 'badge';

	const variantClasses: Record<BadgeVariant, string> = {
		default: '',
		primary: 'badge-primary',
		gold: 'badge-gold',
		success: 'badge-success',
		error: 'badge-error'
	};

	const classes = $derived(
		[baseClass, variantClasses[variant], className].filter(Boolean).join(' ')
	);
</script>

<span class={classes}>
	{@render children()}
</span>
