<!--
  Spinner Component - Loading indicator
  
  Usage:
    <Spinner />
    <Spinner size="lg" />
-->
<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		size = 'md',
		class: className = ''
	}: Props = $props();

	const sizes: Record<string, string> = {
		sm: '16px',
		md: '24px',
		lg: '32px'
	};
</script>

<div 
	class="spinner {className}" 
	style="--spinner-size: {sizes[size]};"
	role="status"
	aria-label="Loading"
>
	<span class="sr-only">Loading...</span>
</div>

<style>
	.spinner {
		width: var(--spinner-size);
		height: var(--spinner-size);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-top-color: var(--orange-500);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
