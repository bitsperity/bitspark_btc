<!--
  Ideas Page - Browse all ideas
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Row, Button } from '$lib/components';
	import { CategoryFilter, IdeaList } from '$lib/components/ideas';
	import { authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Plus } from 'lucide-svelte';

	let selectedCategory = $state<string | undefined>(undefined);
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

			<!-- Category Filter -->
			<CategoryFilter 
				selected={selectedCategory}
				onchange={(cat) => selectedCategory = cat}
			/>

			<!-- Ideas Grid -->
			<IdeaList category={selectedCategory} />
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}
</style>
