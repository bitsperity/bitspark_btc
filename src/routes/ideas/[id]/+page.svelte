<!--
  Idea Detail Page
-->
<script lang="ts">
	import { Container, Stack, Row, AuroraBackground, Badge, Avatar, Button, Skeleton } from '$lib/components';
	import { MarkdownRenderer } from '$lib/components';
	import { ideaService, profileService } from '$lib/services';
	import type { Idea } from '$lib/types/idea';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Github, Zap, ExternalLink } from 'lucide-svelte';

	const eventId = $derived($page.params.id);

	let idea = $state<Idea | null>(null);
	let authorProfile = $state<NDKUserProfile | undefined>(undefined);
	let isLoading = $state(true);

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
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<a href="/ideas" class="back-link">
				<ArrowLeft size={16} />
				<span>Back to Ideas</span>
			</a>

			{#if isLoading}
				<Stack gap={4}>
					<Skeleton width="60%" height="2.5rem" />
					<Skeleton width="40%" height="1.5rem" />
					<Skeleton width="100%" height="200px" />
				</Stack>
			{:else if idea}
				<!-- Banner -->
				{#if idea.bannerUrl}
					<div class="idea-banner">
						<img src={idea.bannerUrl} alt={idea.title} />
					</div>
				{/if}

				<!-- Header -->
				<div class="idea-header">
					<h1 class="idea-title">{idea.title}</h1>
					<p class="idea-summary">{idea.summary}</p>
					
					<Row gap={2} wrap>
						{#each idea.categories as category}
							<Badge variant="default">{category}</Badge>
						{/each}
					</Row>
				</div>

				<!-- Author & Meta -->
				<Row justify="between" class="idea-meta">
					<Row gap={3}>
						<Avatar src={authorAvatar} fallback={authorName[0]} size="md" />
						<Stack gap={0}>
							<span class="author-name">{authorName}</span>
							<span class="date">Published {formattedDate}</span>
						</Stack>
					</Row>
					<Row gap={3}>
						{#if idea.githubRepo}
							<a href={idea.githubRepo} target="_blank" rel="noopener" class="meta-link">
								<Github size={16} />
								<span>GitHub</span>
							</a>
						{/if}
						{#if idea.lnAddress}
							<Button variant="primary" size="sm">
								<Zap size={14} />
								<span>Zap</span>
							</Button>
						{/if}
					</Row>
				</Row>

				<!-- Content -->
				<div class="idea-content">
					<MarkdownRenderer content={idea.content} />
				</div>

				<!-- Jobs Section (Phase 3) -->
				<div class="jobs-section">
					<h2 class="section-title">Jobs</h2>
					<p class="text-muted">No jobs yet. Check back later!</p>
				</div>
			{:else}
				<Stack gap={4} class="not-found">
					<h1 class="text-display-md">Idea Not Found</h1>
					<p class="text-body">This idea may have been deleted or doesn't exist.</p>
						<Button variant="primary" onclick={() => goto('/ideas')}>
						Browse Ideas
					</Button>
				</Stack>
			{/if}
		</Stack>
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
		transition: color var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	.idea-banner {
		aspect-ratio: 21/9;
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	.idea-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.idea-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.idea-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.idea-summary {
		font-size: 1.25rem;
		color: var(--text-muted);
		margin: 0;
	}

	:global(.idea-meta) {
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
	}

	.author-name {
		font-weight: 500;
		color: var(--text-secondary);
	}

	.date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.meta-link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.meta-link:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}

	.idea-content {
		padding: var(--space-6);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
	}

	.jobs-section {
		padding: var(--space-6);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-4);
	}

	:global(.not-found) {
		align-items: center;
		text-align: center;
		padding: var(--space-16) 0;
	}
</style>
