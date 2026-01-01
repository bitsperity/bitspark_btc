<!--
  Job Explorer - Browse all open jobs
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Row } from '$lib/components';
	import { JobList, LanguageFilter } from '$lib/components/jobs';

	let selectedLanguage = $state<string | undefined>(undefined);
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<div>
				<h1 class="text-display-lg">Jobs</h1>
				<p class="text-muted">Find work on exciting projects</p>
			</div>

			<LanguageFilter 
				selected={selectedLanguage}
				onchange={(lang) => selectedLanguage = lang}
			/>

			<JobList language={selectedLanguage} />
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}
</style>
