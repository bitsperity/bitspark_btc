<!--
  CommentItem - Single comment with lazy-loaded replies
  
  Fetches replies on-demand when user clicks to expand.
-->
<script lang="ts">
	import { Avatar, Row, Button } from '$lib/components';
	import { profileService, commentService } from '$lib/services';
	import { LikeButton } from '$lib/components/social';
	import CommentForm from './CommentForm.svelte';
	import type { Comment } from '$lib/types/social';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { MessageCircle, ChevronDown, ChevronRight, Loader } from 'lucide-svelte';
	import { get } from 'svelte/store';

	interface Props {
		comment: Comment;
		rootEventId: string;  // Original event (idea/job)
		depth?: number;
		highlightCommentId?: string | null;
	}

	let { comment, rootEventId, depth = 0, highlightCommentId = null }: Props = $props();

	// Check if this comment should be highlighted
	const isHighlighted = $derived(highlightCommentId === comment.id);

	// Reference for scrolling
	let commentElement: HTMLElement | undefined = $state();

	// Scroll into view if highlighted
	$effect(() => {
		if (isHighlighted && commentElement) {
			setTimeout(() => {
				commentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 300);
		}
	});

	// State
	let showReplyForm = $state(false);
	let showReplies = $state(false);
	let isLoadingReplies = $state(false);
	let replyCount = $state(0);

	// Subscribe to replies for this comment
	const replies = commentService.subscribeReplies(comment.id);
	const hasLoaded = commentService.hasLoadedReplies(comment.id);

	// Auto-expand replies ONLY if highlighted comment is in our subtree
	$effect(() => {
		if (highlightCommentId && !isHighlighted) {
			// First load replies to check the subtree
			checkAndExpandIfNeeded();
		}
	});

	async function checkAndExpandIfNeeded() {
		// Check if the highlighted comment is in our subtree (this also loads replies)
		const isInSubtree = await commentService.isCommentInSubtree(comment.id, highlightCommentId!);
		if (isInSubtree) {
			showReplies = true;
		}
	}

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
		// After posting a reply, load replies to show it
		loadReplies();
	}

	async function toggleReplies() {
		if (!showReplies) {
			await loadReplies();
		}
		showReplies = !showReplies;
	}

	async function loadReplies() {
		if (!get(hasLoaded)) {
			isLoadingReplies = true;
			await commentService.fetchReplies(comment.id);
			isLoadingReplies = false;
		}
	}
</script>

<div 
	bind:this={commentElement}
	id="comment-{comment.id}"
	class="comment-item" 
	class:nested={depth > 0}
	class:highlighted={isHighlighted}
>
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

		<!-- Replies Toggle & List -->
		{#if $replies.length > 0 || $hasLoaded}
			<button class="toggle-replies-btn" onclick={toggleReplies} disabled={isLoadingReplies}>
				{#if isLoadingReplies}
					<Loader size={14} class="spinner" />
					<span>Loading...</span>
				{:else if showReplies}
					<ChevronDown size={14} />
					<span>Hide {$replies.length} {$replies.length === 1 ? 'reply' : 'replies'}</span>
				{:else}
					<ChevronRight size={14} />
					<span>{$replies.length} {$replies.length === 1 ? 'reply' : 'replies'}</span>
				{/if}
			</button>
			
			{#if showReplies && $replies.length > 0}
				<div class="replies">
					{#each $replies as reply (reply.id)}
						<svelte:self 
							comment={reply} 
							rootEventId={rootEventId}
							depth={depth + 1}
							{highlightCommentId}
						/>
					{/each}
				</div>
			{/if}
		{:else if !$hasLoaded}
			<!-- Show "Load replies" button if we haven't checked yet -->
			<button class="toggle-replies-btn" onclick={toggleReplies} disabled={isLoadingReplies}>
				{#if isLoadingReplies}
					<Loader size={14} class="spinner" />
					<span>Loading...</span>
				{:else}
					<ChevronRight size={14} />
					<span>Load replies</span>
				{/if}
			</button>
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

	.comment-item.highlighted {
		background: rgba(249, 115, 22, 0.1);
		border-left: 3px solid var(--orange-500);
		margin-left: 0;
		padding-left: var(--space-3);
		border-radius: var(--radius-md);
		animation: highlightPulse 2s ease-out;
	}

	@keyframes highlightPulse {
		0% {
			background: rgba(249, 115, 22, 0.3);
		}
		100% {
			background: rgba(249, 115, 22, 0.1);
		}
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

	.toggle-replies-btn:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	:global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
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
