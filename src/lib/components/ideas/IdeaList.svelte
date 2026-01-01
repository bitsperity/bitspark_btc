<!--
  IdeaList - Grid of IdeaCards with loading state
  
  Uses {#key} to force re-mount when category changes,
  which triggers a new subscription in IdeaListInner.
-->
<script lang="ts">
	import IdeaListInner from './IdeaListInner.svelte';

	interface Props {
		category?: string;
	}

	let { category }: Props = $props();
</script>

<!-- Key block forces re-mount when category changes -->
{#key category}
	<IdeaListInner {category} />
{/key}
