<!--
  Avatar Component
  
  Usage:
    <Avatar fallback="SN" />
    <Avatar src="/path/to/image.jpg" alt="User" size="lg" />
-->
<script lang="ts">
	import type { AvatarSize } from '$lib/types';

	interface Props {
		src?: string;
		alt?: string;
		fallback?: string;
		size?: AvatarSize;
		class?: string;
	}

	let {
		src,
		alt = '',
		fallback = '',
		size = 'md',
		class: className = ''
	}: Props = $props();

	const baseClass = 'avatar';

	const sizeClasses: Record<AvatarSize, string> = {
		sm: 'avatar-sm',
		md: '',
		lg: 'avatar-lg',
		xl: 'avatar-xl'
	};

	const classes = $derived(
		[baseClass, sizeClasses[size], className].filter(Boolean).join(' ')
	);

	// Generate initials from fallback text
	const initials = $derived(
		fallback
			.split(' ')
			.map((word) => word[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	let imgError = $state(false);
</script>

<div class={classes}>
	{#if src && !imgError}
		<img {src} {alt} onerror={() => (imgError = true)} />
	{:else}
		{initials}
	{/if}
</div>
