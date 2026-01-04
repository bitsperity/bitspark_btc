<!--
  CommentItem - Single comment with infinite nesting support
  
  Recursively renders children using childrenMap lookup.
-->
<script lang="ts">
	import { Avatar, Row, Button } from '$lib/components';
	import { profileService, commentService } from '$lib/services';
	import { LikeButton } from '$lib/components/social';
	import CommentForm from './CommentForm.svelte';
	import type { Comment } from '$lib/types/social';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { MessageCircle, ChevronDown, ChevronRight } from 'lucide-svelte';

	interface Props {
		comment: Comment;
		rootEventId: string;         // Original event (idea/job) for reply context
		childrenMap: Map<string, Comment[]>;  // Full map of parent -> children
		depth?: number;              // Nesting depth for indentation
	}

	let { comment, rootEventId, childrenMap, depth = 0 }: Props = $props();

	// State
	let showReplyForm = $state(false);
	let showReplies = $state(depth < 2); // Auto-expand first 2 levels

	// Get direct children of this comment
	const replies = $derived(childrenMap.get(comment.id) || []);
	const hasReplies = $derived(replies.length > 0);

	// Fetch author profile
	let authorProfile = $state<NDKUserProfile | undefined>(undefined);
	
	$effect(() => {
		loadProfile();
	});

	async function loadProfile() {
		authorProfile = await profileService.getProfile(comment.pubkey);
	}

	const authorName = $derived(authorProfile?.name ?? authorProfile?.displayName ?? 'Anonymous');
	const authorAvatar = $derived(authorProfile?.image ?? authorProfile?.picture);

	// Relative time
	function getRelativeTime(createdAt: Date | number): string {
		const now = Date.now();
		const timestamp = typeof createdAt === 'number' ? createdAt * 1000 : createdAt.getTime();
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

	function handleReplySubmit() {
		showReplyForm = false;
	}

	function toggleReplies() {
		showReplies = !showReplies;
	}
</script>

<div class="comment-item" class:nested={depth > 0}>
	<Avatar src={authorAvatar} fallback={authorName[0]} size="sm" />
	
	<div class="comment-body">
		<Row gap={2} class="comment-header">
			<span class="author-name">{authorName}</span>
			<span class="time">• {relativeTime}</span>
		</Row>
		
		<p class="comment-content">{comment.content}</p>
		
		<div class="comment-actions">
			<LikeButton eventId={comment.id} size="sm" />
			<button class="reply-btn" onclick={() => showReplyForm = !showReplyForm}>
				<MessageCircle size={14} />
				<span>Reply</span>
			</button>
		</div>

		<!-- Reply Form -->
		{#if showReplyForm}
			<div class="reply-form-wrapper">
				<CommentForm 
					eventId={rootEventId} 
					replyToCommentId={comment.id}
					onSubmit={handleReplySubmit}
				/>
			</div>
		{/if}

		<!-- Replies (recursive) -->
		{#if hasReplies}
			<button class="toggle-replies-btn" onclick={toggleReplies}>
				{#if showReplies}
					<ChevronDown size={14} />
				{:else}
					<ChevronRight size={14} />
				{/if}
				<span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
			</button>
			
			{#if showReplies}
				<div class="replies">
					{#each replies as reply (reply.id)}
						<!-- Recursive call with same childrenMap -->
						<svelte:self 
							comment={reply} 
							rootEventId={rootEventId}
							childrenMap={childrenMap}
							depth={depth + 1}
						/>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.comment-item {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3) 0;
	}

	.comment-item:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.comment-item.nested {
		margin-left: var(--space-4);
		padding-left: var(--space-3);
		border-left: 2px solid rgba(255, 255, 255, 0.1);
		border-bottom: none;
	}

	.comment-body {
		flex: 1;
		min-width: 0;
	}

	:global(.comment-header) {
		margin-bottom: var(--space-1);
	}

	.author-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.comment-content {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.comment-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.reply-btn,
	.toggle-replies-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: 0.8rem;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: color var(--duration-fast) var(--ease-out);
	}

	.reply-btn:hover,
	.toggle-replies-btn:hover {
		color: var(--primary);
	}

	.toggle-replies-btn {
		margin-top: var(--space-2);
		padding-left: 0;
	}

	.reply-form-wrapper {
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.replies {
		margin-top: var(--space-2);
	}
</style>
