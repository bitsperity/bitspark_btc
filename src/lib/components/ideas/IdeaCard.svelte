<!--
  IdeaCard - Displays an idea in a card format
-->
<script lang="ts">
	import type { Idea } from '$lib/types/idea';
	import { Card, Badge, Avatar, Row, Stack } from '$lib/components';
	import { profileService } from '$lib/services';
	import { Github, Zap } from 'lucide-svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		idea: Idea;
	}

	let { idea }: Props = $props();

	// Fetch author profile
	let authorProfile = $state<NDKUserProfile | undefined>(undefined);
	
	$effect(() => {
		loadAuthorProfile();
	});

	async function loadAuthorProfile() {
		authorProfile = await profileService.getProfile(idea.pubkey);
	}

	const authorName = $derived(authorProfile?.name ?? authorProfile?.displayName ?? 'Anonymous');
	const authorAvatar = $derived(authorProfile?.image ?? authorProfile?.picture);

	// Format date
	const formattedDate = $derived(new Date(idea.createdAt * 1000).toLocaleDateString());
</script>

<a href="/ideas/{idea.id}" class="idea-card-link">
	<Card variant="glow" class="idea-card">
		<!-- Banner -->
		{#if idea.bannerUrl}
			<div class="idea-banner">
				<img src={idea.bannerUrl} alt={idea.title} />
			</div>
		{/if}

		<Stack gap={3}>
			<!-- Title -->
			<h3 class="idea-title">{idea.title}</h3>

			<!-- Summary -->
			<p class="idea-summary">{idea.summary}</p>

			<!-- Categories -->
			{#if idea.categories.length > 0}
				<Row gap={2} wrap>
					{#each idea.categories as category}
						<Badge variant="default">{category}</Badge>
					{/each}
				</Row>
			{/if}

			<!-- Footer -->
			<Row justify="between" class="idea-footer">
				<Row gap={2}>
					<Avatar src={authorAvatar} fallback={authorName[0]} size="sm" />
					<span class="author-name">{authorName}</span>
				</Row>
				<Row gap={3}>
					{#if idea.githubRepo}
						<Github size={14} class="icon-muted" />
					{/if}
					<span class="date">{formattedDate}</span>
				</Row>
			</Row>
		</Stack>
	</Card>
</a>

<style>
	.idea-card-link {
		text-decoration: none;
		display: block;
	}

	:global(.idea-card) {
		transition: transform var(--duration-normal) var(--ease-out);
	}

	.idea-card-link:hover :global(.idea-card) {
		transform: translateY(-4px);
	}

	.idea-banner {
		margin: calc(var(--space-4) * -1);
		margin-bottom: var(--space-4);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		overflow: hidden;
		aspect-ratio: 16/9;
	}

	.idea-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.idea-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.idea-summary {
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
	}

	:global(.idea-footer) {
		padding-top: var(--space-3);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.author-name {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	:global(.icon-muted) {
		color: var(--text-muted);
	}
</style>
