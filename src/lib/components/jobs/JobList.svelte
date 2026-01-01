<!--
  JobList - Grid of JobCards with reactive filtering
  
  Uses {#key} to force re-mount when filters change.
-->
<script lang="ts">
	import JobListInner from './JobListInner.svelte';

	interface Props {
		language?: string;
		ideaId?: string;
	}

	let { language, ideaId }: Props = $props();

	// Create a combined key for re-mounting
	const filterKey = $derived(`${language ?? 'all'}-${ideaId ?? 'all'}`);
</script>

{#key filterKey}
	<JobListInner {language} {ideaId} />
{/key}
