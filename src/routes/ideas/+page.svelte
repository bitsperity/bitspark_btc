<!--
  Ideas Page - Browse all ideas
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Row, Button } from '$lib/components';
	import { IdeaList } from '$lib/components/ideas';
	import { authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Plus } from 'lucide-svelte';
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<!-- Header -->
			<Row justify="between">
				<div>
					<h1 class="text-display-lg">Ideas</h1>
					<p class="text-muted">Discover projects looking for developers</p>
				</div>
				{#if authService.isLoggedIn}
					<Button variant="primary" onclick={() => goto('/ideas/create')}>
						<Plus size={16} />
						<span>New Idea</span>
					</Button>
				{/if}
			</Row>

			<!-- Ideas Grid with integrated filters -->
			<IdeaList />
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}
</style>
