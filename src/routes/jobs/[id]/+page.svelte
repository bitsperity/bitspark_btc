<!--
  Job Detail Page
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Badge, Avatar, Button, Skeleton, Card } from '$lib/components';
	import { MarkdownRenderer } from '$lib/components';
	import { JobStatusBadge } from '$lib/components/jobs';
	import { jobService, ideaService, profileService } from '$lib/services';
	import type { Job } from '$lib/types/job';
	import type { Idea } from '$lib/types/idea';
	import { LANGUAGE_LABELS, type ProgrammingLanguage } from '$lib/types/job';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Briefcase, ExternalLink } from 'lucide-svelte';

	const jobId = $derived($page.params.id);

	let job = $state<Job | null>(null);
	let idea = $state<Idea | null>(null);
	let authorProfile = $state<NDKUserProfile | null>(null);
	let isLoading = $state(true);
	let notFound = $state(false);

	$effect(() => {
		loadJob();
	});

	async function loadJob() {
		isLoading = true;
		try {
			const fetchedJob = await jobService.getJob(jobId);
			if (!fetchedJob) {
				notFound = true;
				return;
			}
			job = fetchedJob;

			// Fetch parent idea
			if (job.ideaId) {
				idea = await ideaService.getIdea(job.ideaId);
			}

			// Fetch author profile
			authorProfile = await profileService.getProfile(job.pubkey);
		} catch (e) {
			console.error('[JobDetail] Load error:', e);
			notFound = true;
		} finally {
			isLoading = false;
		}
	}
</script>

<AuroraBackground />

<main class="page">
	<Container size="md">
		{#if isLoading}
			<Stack gap={6}>
				<Skeleton width="100px" height="1rem" />
				<Skeleton width="80%" height="2.5rem" />
				<Skeleton width="100%" height="200px" />
			</Stack>
		{:else if notFound || !job}
			<Stack gap={4} class="not-found">
				<h1 class="text-display-md">Job Not Found</h1>
				<p class="text-body">This job may have been deleted or doesn't exist.</p>
				<Button variant="primary" onclick={() => goto('/jobs')}>
					Browse Jobs
				</Button>
			</Stack>
		{:else}
			<Stack gap={6}>
				<!-- Back link -->
				<a href="/jobs" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Jobs</span>
				</a>

				<!-- Banner -->
				{#if job.bannerUrl}
					<div class="job-banner">
						<img src={job.bannerUrl} alt={job.title} />
					</div>
				{/if}

				<!-- Header -->
				<div class="job-header">
					<Row justify="between" gap={4}>
						<div>
							<Row gap={3}>
								<Briefcase size={24} class="text-muted" />
								<h1 class="text-display-lg">{job.title}</h1>
							</Row>
						</div>
						<JobStatusBadge status={job.status} />
					</Row>
				</div>

				<!-- Meta info -->
				<Card>
					<Stack gap={4}>
						<!-- Author -->
						<Row gap={3}>
							<Avatar 
								src={authorProfile?.image} 
								fallback={authorProfile?.name?.[0] ?? '?'} 
								size="md" 
							/>
							<div>
								<span class="author-name">{authorProfile?.name ?? 'Anonymous'}</span>
								<span class="author-label">Posted by</span>
							</div>
						</Row>

						<!-- Parent idea -->
						{#if idea}
							<a href="/ideas/{idea.id}" class="idea-link">
								<Row gap={2}>
									<span class="idea-label">Part of:</span>
									<span class="idea-name">{idea.title}</span>
									<ExternalLink size={14} />
								</Row>
							</a>
						{/if}

						<!-- Languages -->
						<div class="languages">
							<span class="meta-label">Languages:</span>
							<Row gap={2} wrap>
								{#each job.languages as lang}
									<Badge variant="secondary" size="sm">
										{LANGUAGE_LABELS[lang as ProgrammingLanguage] ?? lang}
									</Badge>
								{/each}
							</Row>
						</div>
					</Stack>
				</Card>

				<!-- Description -->
				{#if job.content}
					<Card>
						<h3 class="section-title">Description</h3>
						<p class="description-text">{job.content}</p>
					</Card>
				{/if}

				<!-- Definition of Done -->
				{#if job.requirements}
					<Card>
						<h3 class="section-title">Definition of Done</h3>
						<div class="dod-content">
							<MarkdownRenderer content={job.requirements} />
						</div>
					</Card>
				{/if}

				<!-- Apply button (Phase 4) -->
				<Row justify="center">
					<Button variant="primary" size="lg" disabled>
						Apply for Job (Coming Soon)
					</Button>
				</Row>
			</Stack>
		{/if}
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color var(--duration-fast);
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	.job-header {
		padding-bottom: var(--space-4);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.job-banner {
		aspect-ratio: 21/9;
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	.job-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.requirements-preview {
		color: var(--text-muted);
		margin-top: var(--space-2);
	}

	:global(.not-found) {
		align-items: center;
		text-align: center;
		padding: var(--space-16) 0;
	}

	.author-name {
		display: block;
		font-weight: 600;
		color: var(--text-primary);
	}

	.author-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.idea-link {
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background var(--duration-fast);
	}

	.idea-link:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.idea-label {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.idea-name {
		font-weight: 500;
		color: var(--orange-400);
	}

	.meta-label {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-right: var(--space-2);
	}

	.languages {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--space-4);
		color: var(--text-primary);
	}
</style>
