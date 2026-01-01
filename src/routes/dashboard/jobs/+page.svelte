<!--
  My Jobs Dashboard
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Row, Button, Skeleton } from '$lib/components';
	import { JobCard } from '$lib/components/jobs';
	import { authService, jobService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	// Subscribe to user's jobs
	let jobsStore = authService.user 
		? jobService.subscribeToUserJobs(authService.user.pubkey)
		: null;

	const jobs = $derived(
		jobsStore 
			? ($jobsStore as NDKEvent[]).map(event => jobService.parseJobEvent(event))
			: []
	);

	const isLoading = $derived(jobsStore ? $jobsStore.length === 0 : false);

	onDestroy(() => jobsStore?.unsubscribe());
</script>

<AuroraBackground />

<main class="page">
	<Container>
		{#if !authService.isLoggedIn}
			<Stack gap={4} class="not-logged-in">
				<h1 class="text-display-md">Login Required</h1>
				<p class="text-body">Please connect your wallet to view your jobs.</p>
				<Button variant="primary" onclick={() => goto('/')}>
					Go Home
				</Button>
			</Stack>
		{:else}
			<Stack gap={6}>
				<div>
					<h1 class="text-display-lg">My Jobs</h1>
					<p class="text-muted">Jobs you've created</p>
				</div>

				{#if isLoading}
					<div class="jobs-grid">
						{#each Array(3) as _}
							<div class="skeleton-card">
								<Skeleton width="70%" height="1.25rem" />
								<Skeleton width="100%" height="1rem" />
								<Skeleton width="50%" height="1rem" />
							</div>
						{/each}
					</div>
				{:else if jobs.length === 0}
					<div class="empty-state">
						<p class="text-muted">You haven't created any jobs yet.</p>
						<p class="text-body">Create jobs within your ideas to attract developers.</p>
						<Button variant="secondary" onclick={() => goto('/dashboard/ideas')}>
							View My Ideas
						</Button>
					</div>
				{:else}
					<div class="jobs-grid">
						{#each jobs as job (job.id)}
							<JobCard {job} />
						{/each}
					</div>
				{/if}
			</Stack>
		{/if}
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	:global(.not-logged-in) {
		align-items: center;
		text-align: center;
		padding: var(--space-16) 0;
	}

	.jobs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.skeleton-card {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-16);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}
</style>
