<!--
  Skeleton Component - Loading placeholder
  
  Usage:
    <Skeleton width="100%" height="20px" />
    <Skeleton width="200px" height="40px" rounded />
    <Skeleton circle size="48px" />
-->
<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		size?: string;  // For circles
		rounded?: boolean;
		circle?: boolean;
		class?: string;
	}

	let {
		width = '100%',
		height = '1rem',
		size,
		rounded = false,
		circle = false,
		class: className = ''
	}: Props = $props();

	const style = $derived(
		circle && size
			? `width: ${size}; height: ${size}; border-radius: 50%;`
			: `width: ${width}; height: ${height}; ${rounded ? 'border-radius: var(--radius-full);' : ''}`
	);
</script>

<div class="skeleton {className}" {style}></div>
