<!--
  Job Explorer - Browse all open jobs grouped by idea
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground } from '$lib/components';
	import { JobsExplorer } from '$lib/components/jobs';
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<div>
				<h1 class="text-display-lg">Jobs</h1>
				<p class="text-muted">Find work on exciting projects</p>
			</div>

			<JobsExplorer />
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}
</style>
