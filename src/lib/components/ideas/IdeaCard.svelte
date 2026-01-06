<!--
  IdeaCard - Displays an idea with job stats
  
  Shows: title, summary, categories, job count, bounty, hot badge, relative time
-->
<script lang="ts">
	import type { IdeaWithStats } from '$lib/stores';
	import { Card, Badge, Avatar, Row, Stack } from '$lib/components';
	import { LikeButton, BookmarkButton } from '$lib/components/social';
	import { profileService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Github, Zap, Briefcase, Flame } from 'lucide-svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		idea: IdeaWithStats;
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

	// Relative time (e.g., "2d ago")
	function getRelativeTime(createdAt: Date | number): string {
		const now = Date.now();
		// Handle both Date and Unix timestamp
		const timestamp = typeof createdAt === 'number' ? createdAt * 1000 : createdAt.getTime();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30);
		
		if (months > 0) return `${months}mo`;
		if (weeks > 0) return `${weeks}w`;
		if (days > 0) return `${days}d`;
		if (hours > 0) return `${hours}h`;
		if (minutes > 0) return `${minutes}m`;
		return 'now';
	}

	const relativeTime = $derived(getRelativeTime(idea.createdAt));
	
	// Format bounty (e.g., "45k sats")
	function formatBounty(sats: number): string {
		if (sats >= 1000000) return `${(sats / 1000000).toFixed(1)}M sats`;
		if (sats >= 1000) return `${(sats / 1000).toFixed(0)}k sats`;
		return `${sats} sats`;
	}

	function handleCardClick(e: MouseEvent) {
		// Only navigate if click wasn't stopped by a child component
		if (!e.defaultPrevented) {
			goto(`/ideas/${idea.id}`);
		}
	}
</script>

<div class="idea-card-link" onclick={handleCardClick} role="button" tabindex="0">
	<Card variant="glow" class="idea-card">
		<!-- Banner + Hot Badge -->
		{#if idea.bannerUrl}
			<div class="idea-banner">
				<img src={idea.bannerUrl} alt={idea.title} />
				{#if idea.isHot}
					<div class="hot-badge">
						<Flame size={12} />
						<span>Hot</span>
					</div>
				{/if}
			</div>
		{:else if idea.isHot}
			<div class="hot-badge-standalone">
				<Flame size={12} />
				<span>Hot</span>
			</div>
		{/if}

		<Stack gap={3}>
			<!-- Categories -->
			{#if idea.categories.length > 0}
				<Row gap={2} wrap>
					{#each idea.categories.slice(0, 2) as category}
						<Badge variant="default" size="sm">{category}</Badge>
					{/each}
				</Row>
			{/if}

			<!-- Title -->
			<h3 class="idea-title">{idea.title}</h3>

			<!-- Job Stats Line -->
			<Row gap={3} class="job-stats">
				<span class="stat">
					<Briefcase size={14} />
					{idea.openJobCount} open job{idea.openJobCount !== 1 ? 's' : ''}
				</span>
				{#if idea.totalBounty > 0}
					<span class="stat bounty">
						<Zap size={14} />
						{formatBounty(idea.totalBounty)}
					</span>
				{/if}
			</Row>

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
					<LikeButton eventId={idea.id} size="sm" />
					<BookmarkButton eventId={idea.id} type="idea" size="sm" />
					<span class="date">{relativeTime}</span>
				</Row>
			</Row>
		</Stack>
	</Card>
</div>

<style>
	.idea-card-link {
		text-decoration: none;
		display: block;
		cursor: pointer;
	}

	:global(.idea-card) {
		transition: transform var(--duration-normal) var(--ease-out);
		position: relative;
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
		position: relative;
	}

	.idea-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hot-badge {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: linear-gradient(135deg, var(--warning) 0%, #ff6b35 100%);
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		text-transform: uppercase;
	}

	.hot-badge-standalone {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: linear-gradient(135deg, var(--warning) 0%, #ff6b35 100%);
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		text-transform: uppercase;
	}

	.idea-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	:global(.job-stats) {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.stat.bounty {
		color: var(--warning);
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
