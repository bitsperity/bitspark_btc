<!--
  Idea Detail Page - Redesigned
  
  Layout:
  - Full-width banner (outside container)
  - Title + Actions row
  - Inline metadata: Categories, Author, Date
  - Description (no card wrapper)
  - Jobs section
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Badge, Avatar, Button, Skeleton, Modal } from '$lib/components';
	import { MarkdownRenderer } from '$lib/components';
	import { JobList, JobForm } from '$lib/components/jobs';
	import { CommentWidget, LikeButton } from '$lib/components/social';
	import { ideaService, profileService, authService } from '$lib/services';
	import type { Idea } from '$lib/types/idea';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Github, Zap, Plus, Briefcase } from 'lucide-svelte';

	const eventId = $derived($page.params.id);

	let idea = $state<Idea | null>(null);
	let authorProfile = $state<NDKUserProfile | undefined>(undefined);
	let isLoading = $state(true);
	let showJobForm = $state(false);

	$effect(() => {
		if (eventId) {
			loadIdea(eventId);
		}
	});

	async function loadIdea(id: string) {
		isLoading = true;
		try {
			idea = await ideaService.getIdea(id);
			if (idea) {
				authorProfile = await profileService.getProfile(idea.pubkey);
			}
		} catch (error) {
			console.error('[IdeaDetail] Failed to load:', error);
		} finally {
			isLoading = false;
		}
	}

	const authorName = $derived(authorProfile?.name ?? authorProfile?.displayName ?? 'Anonymous');
	const authorAvatar = $derived(authorProfile?.image ?? authorProfile?.picture);
	const formattedDate = $derived(idea ? new Date(idea.createdAt * 1000).toLocaleDateString() : '');
	
	// Check if current user is the owner
	const isOwner = $derived(
		authService.isLoggedIn && 
		idea && 
		authService.user?.pubkey === idea.pubkey
	);
</script>

<AuroraBackground />

<main class="page">
	{#if isLoading}
		<Container>
			<Stack gap={4}>
				<Skeleton width="100px" height="1rem" />
				<Skeleton width="100%" height="200px" />
				<Skeleton width="60%" height="2.5rem" />
				<Skeleton width="40%" height="1.5rem" />
			</Stack>
		</Container>
	{:else if idea}
		<!-- Full-width Banner -->
		{#if idea.bannerUrl}
			<div class="banner-wrapper">
				<img src={idea.bannerUrl} alt={idea.title} class="banner-image" />
			</div>
		{/if}

		<Container>
			<Stack gap={5}>
				<!-- Back Link -->
				<a href="/ideas" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Ideas</span>
				</a>

				<!-- Title + Actions Row -->
				<Row justify="between" class="title-row">
					<h1 class="idea-title">{idea.title}</h1>
					<Row gap={2}>
						{#if idea.githubRepo}
							<a href={idea.githubRepo} target="_blank" rel="noopener" class="action-btn">
								<Github size={18} />
								<span>GitHub</span>
							</a>
						{/if}
						{#if idea.lnAddress}
							<Button variant="primary" size="sm">
								<Zap size={16} />
								<span>Zap</span>
							</Button>
						{/if}
					</Row>
				</Row>

				<!-- Summary -->
				<p class="idea-summary">{idea.summary}</p>

				<!-- Inline Metadata: Categories • Author • Date -->
				<Row gap={3} wrap class="metadata-row">
					{#each idea.categories as category}
						<Badge variant="default">{category}</Badge>
					{/each}
					<span class="divider">•</span>
					<Row gap={2} class="author-inline">
						<Avatar src={authorAvatar} fallback={authorName[0]} size="xs" />
						<span class="author-name">{authorName}</span>
					</Row>
					<span class="divider">•</span>
					<span class="date-inline">{formattedDate}</span>
				</Row>

				<!-- Description (no card) -->
				<div class="description-section">
					<MarkdownRenderer content={idea.content} />
				</div>

				<!-- Jobs Section -->
				<section class="jobs-section">
					<Row justify="between">
						<Row gap={2}>
							<Briefcase size={20} class="jobs-icon" />
							<h2 class="section-title">Jobs</h2>
						</Row>
						{#if isOwner}
							<Button 
								variant="secondary" 
								size="sm"
								onclick={() => showJobForm = true}
							>
								<Plus size={14} />
								<span>Create Job</span>
							</Button>
						{/if}
					</Row>

					<!-- Create Job Modal -->
					<Modal bind:open={showJobForm} title="Create New Job">
						<JobForm 
							ideaId={idea.id} 
							oncancel={() => showJobForm = false}
						/>
					</Modal>

					<JobList ideaId={idea.id} />
				</section>

				<!-- Comments Section -->
				<section class="comments-section">
					<CommentWidget eventId={idea.id} collapsed={false} />
				</section>
			</Stack>
		</Container>
	{:else}
		<Container>
			<Stack gap={4} class="not-found">
				<h1 class="text-display-md">Idea Not Found</h1>
				<p class="text-body">This idea may have been deleted or doesn't exist.</p>
				<Button variant="primary" onclick={() => goto('/ideas')}>
					Browse Ideas
				</Button>
			</Stack>
		</Container>
	{/if}
</main>

<style>
	.page {
		min-height: 100vh;
	}

	/* Full-width banner */
	.banner-wrapper {
		width: 100%;
		max-height: 300px;
		overflow: hidden;
		margin-bottom: var(--space-6);
	}

	.banner-image {
		width: 100%;
		height: 300px;
		object-fit: cover;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: var(--space-2);
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	:global(.title-row) {
		flex-wrap: wrap;
		gap: var(--space-4);
	}

	.idea-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.idea-summary {
		font-size: 1.125rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.6;
	}

	:global(.metadata-row) {
		align-items: center;
	}

	.divider {
		color: var(--text-muted);
	}

	:global(.author-inline) {
		align-items: center;
	}

	.author-name {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.date-inline {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.description-section {
		padding: var(--space-5);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
	}

	.jobs-section {
		padding: var(--space-5);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	:global(.jobs-icon) {
		color: var(--text-muted);
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.job-form-wrapper {
		margin-top: var(--space-2);
	}

	:global(.not-found) {
		text-align: center;
		padding: var(--space-12) 0;
	}
</style>
