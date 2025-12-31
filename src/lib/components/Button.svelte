<!--
  Button Component
  
  Usage:
    <Button variant="primary" size="lg">Click me</Button>
    <Button variant="ghost" icon><Search size={18} /></Button>
-->
<script lang="ts">
	import type { ButtonVariant, ButtonSize } from '$lib/types';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		icon?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: import('svelte').Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		icon = false,
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const baseClass = 'btn';
	
	const variantClasses: Record<ButtonVariant, string> = {
		primary: 'btn-primary',
		ghost: 'btn-ghost',
		glass: 'btn-glass'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

	const classes = $derived(
		[
			baseClass,
			variantClasses[variant],
			sizeClasses[size],
			icon ? 'btn-icon' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<button class={classes} {disabled} {type} {onclick}>
	{@render children()}
</button>
