<!--
  Container Component - Centered max-width container
  
  Usage:
    <Container>
      <h1>Page content</h1>
    </Container>
-->
<script lang="ts">
	interface Props {
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		class: className = '',
		children
	}: Props = $props();

	const classes = $derived(['container', className].filter(Boolean).join(' '));
</script>

<div class={classes}>
	{@render children()}
</div>
