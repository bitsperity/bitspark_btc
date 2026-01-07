<!--
  BookmarkedCommentCard - Display a bookmarked comment with author and navigation
  
  Used in list detail to show comments with optional remove action.
-->
<script lang="ts">
	import { Avatar, Row } from '$lib/components';
	import { profileService } from '$lib/services';
	import { ndk } from '$lib/nostr';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import { goto } from '$app/navigation';
	import type { Comment } from '$lib/types/social';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { MessageCircle, X } from 'lucide-svelte';

	interface Props {
		comment: Comment;
		showRemove?: boolean;
		onRemove?: () => void;
	}

	let { comment, showRemove = false, onRemove }: Props = $props();

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

	function handleRemove(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (onRemove) onRemove();
	}

	const canNavigate = $derived(parentId !== null);
</script>

<div class="card-wrapper">
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

	{#if showRemove}
		<button class="remove-btn" onclick={handleRemove} title="Remove from list">
			<X size={14} />
		</button>
	{/if}
</div>

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
		border-color: rgba(255, 255, 255, 0.15);
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

	/* Wrapper for hover reveal */
	.card-wrapper {
		position: relative;
	}

	.card-wrapper:hover .remove-btn {
		opacity: 1;
	}

	.remove-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0;
		transition: all var(--duration-fast) var(--ease-out);
		z-index: 10;
	}

	.remove-btn:hover {
		background: rgba(220, 38, 38, 0.8);
		border-color: rgba(220, 38, 38, 0.5);
		color: white;
		transform: scale(1.1);
	}
</style>
