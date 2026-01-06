<!--
  BookmarkedCommentCard - Display a bookmarked comment with author and navigation
  
  Consistent styling with ActivityItem in Feed.
-->
<script lang="ts">
	import { Avatar, Row } from '$lib/components';
	import { BookmarkButton } from '$lib/components/social';
	import { profileService } from '$lib/services';
	import { ndk } from '$lib/nostr';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import { goto } from '$app/navigation';
	import type { Comment } from '$lib/types/social';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { MessageCircle } from 'lucide-svelte';

	interface Props {
		comment: Comment;
	}

	let { comment }: Props = $props();

	// Load author profile
	let authorProfile = $state<NDKUserProfile | undefined>(undefined);
	
	$effect(() => {
		loadProfile();
		resolveParent();
	});

	async function loadProfile() {
		authorProfile = await profileService.getProfile(comment.pubkey);
	}

	const authorName = $derived(authorProfile?.name ?? authorProfile?.displayName ?? 'Anonymous');
	const authorAvatar = $derived(authorProfile?.image ?? authorProfile?.picture);

	// Relative time
	function getRelativeTime(createdAt: number): string {
		const now = Date.now();
		const timestamp = createdAt * 1000;
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		
		if (days > 0) return `${days}d`;
		if (hours > 0) return `${hours}h`;
		if (minutes > 0) return `${minutes}m`;
		return 'now';
	}

	const relativeTime = $derived(getRelativeTime(comment.createdAt));

	// Resolve parent Idea/Job for navigation
	let parentId = $state<string | null>(null);
	let parentType = $state<'idea' | 'job' | null>(null);
	let parentTitle = $state<string | null>(null);

	async function resolveParent() {
		// Get root event tag from comment
		const rootEventId = comment.rootEventId;
		if (!rootEventId) return;

		try {
			const event = await ndk.fetchEvent(rootEventId);
			if (!event) return;

			if (event.kind === NOSTR_KINDS.IDEA) {
				parentId = event.id;
				parentType = 'idea';
				const titleTag = event.tags.find(t => t[0] === 'title');
				parentTitle = titleTag?.[1] ?? 'an idea';
			} else if (event.kind === NOSTR_KINDS.JOB) {
				parentId = event.id;
				parentType = 'job';
				const titleTag = event.tags.find(t => t[0] === 'title');
				parentTitle = titleTag?.[1] ?? 'a job';
			}
		} catch (error) {
			console.error('[BookmarkedComment] Failed to resolve parent:', error);
		}
	}

	function handleClick() {
		if (parentId && parentType) {
			const route = parentType === 'idea' ? 'ideas' : 'jobs';
			goto(`/${route}/${parentId}?tab=comments&comment=${comment.id}`);
		}
	}

	const canNavigate = $derived(parentId !== null);
</script>

<button 
	class="bookmarked-comment-card"
	class:clickable={canNavigate}
	onclick={handleClick}
	disabled={!canNavigate}
>
	<Avatar src={authorAvatar} fallback={authorName[0]} size="sm" />
	
	<div class="content">
		<Row justify="between" class="header">
			<Row gap={2}>
				<span class="author">{authorName}</span>
				<span class="time">• {relativeTime}</span>
			</Row>
			<BookmarkButton eventId={comment.id} type="comment" size="sm" />
		</Row>
		
		<p class="comment-text">{comment.content}</p>
		
		{#if parentTitle}
			<span class="parent-link">
				<MessageCircle size={12} />
				on {parentTitle}
			</span>
		{/if}
	</div>
</button>

<style>
	.bookmarked-comment-card {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		text-align: left;
		width: 100%;
		cursor: default;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.bookmarked-comment-card.clickable {
		cursor: pointer;
	}

	.bookmarked-comment-card.clickable:hover {
		background: var(--bg-glass-hover);
		border-color: rgba(255, 255, 255, 0.15);
		transform: translateY(-1px);
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	:global(.header) {
		width: 100%;
	}

	.author {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.time {
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.comment-text {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.parent-link {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.75rem;
	}
</style>
