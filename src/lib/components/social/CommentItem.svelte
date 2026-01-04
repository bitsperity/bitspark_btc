<!--
  CommentItem - Single comment with reply button and nested replies
  
  Twitter/Instagram-style threaded comments.
-->
<script lang="ts">
	import { Avatar, Row, Button } from '$lib/components';
	import { profileService, commentService } from '$lib/services';
	import { LikeButton } from '$lib/components/social';
	import CommentForm from './CommentForm.svelte';
	import type { Comment } from '$lib/types/social';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { MessageCircle } from 'lucide-svelte';

	interface Props {
		comment: Comment;
		rootEventId: string;  // Original event (idea/job) for reply context
		depth?: number;       // Nesting depth for indentation
		replies?: Comment[];  // Child comments
	}

	let { comment, rootEventId, depth = 0, replies = [] }: Props = $props();

	// State
	let showReplyForm = $state(false);
	let showReplies = $state(depth < 2); // Auto-expand first 2 levels

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
	const hasReplies = $derived(replies.length > 0);

	function handleReplySubmit() {
		showReplyForm = false;
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

		<!-- Replies -->
		{#if hasReplies}
			{#if !showReplies}
				<button class="show-replies-btn" onclick={() => showReplies = true}>
					View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
				</button>
			{:else}
				<div class="replies">
					{#each replies as reply (reply.id)}
						<svelte:self 
							comment={reply} 
							rootEventId={rootEventId}
							depth={depth + 1}
							replies={[]}
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
		margin-left: var(--space-6);
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

	.reply-btn {
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

	.reply-btn:hover {
		color: var(--primary);
	}

	.reply-form-wrapper {
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.show-replies-btn {
		margin-top: var(--space-2);
		padding: var(--space-1) 0;
		background: transparent;
		border: none;
		color: var(--primary);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.show-replies-btn:hover {
		text-decoration: underline;
	}

	.replies {
		margin-top: var(--space-2);
	}
</style>
