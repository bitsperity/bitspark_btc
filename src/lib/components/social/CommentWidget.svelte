<!--
  CommentWidget - Threaded comment section for any event
  
  Features:
  - Collapsible with comment count header
  - Threaded/nested comment display
  - New comment form
-->
<script lang="ts">
	import { Stack } from '$lib/components';
	import { commentService } from '$lib/services';
	import CommentItem from './CommentItem.svelte';
	import CommentForm from './CommentForm.svelte';
	import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import type { Comment } from '$lib/types/social';

	interface Props {
		eventId: string;
		collapsed?: boolean;
	}

	let { eventId, collapsed = true }: Props = $props();

	// State
	let isOpen = $state(!collapsed);

	// Subscribe to comments
	const comments = commentService.subscribeComments(eventId);
	const commentCount = commentService.subscribeCommentCount(eventId);

	// Build threaded comment tree
	const threadedComments = $derived(buildCommentTree($comments));

	function buildCommentTree(flatComments: Comment[]): { comment: Comment; replies: Comment[] }[] {
		// Map comments by ID
		const commentMap = new Map<string, Comment>();
		flatComments.forEach(c => commentMap.set(c.id, c));

		// Find top-level comments (no replyToCommentId or replyToCommentId is the event itself)
		const topLevel: Comment[] = [];
		const childrenMap = new Map<string, Comment[]>();

		for (const comment of flatComments) {
			if (!comment.replyToCommentId || !commentMap.has(comment.replyToCommentId)) {
				// Top-level comment
				topLevel.push(comment);
			} else {
				// Child comment
				const children = childrenMap.get(comment.replyToCommentId) || [];
				children.push(comment);
				childrenMap.set(comment.replyToCommentId, children);
			}
		}

		// Build tree structure
		return topLevel.map(comment => ({
			comment,
			replies: childrenMap.get(comment.id) || []
		}));
	}

	// Cleanup subscription on destroy
	onDestroy(() => {
		commentService.unsubscribe(eventId);
	});

	function toggleOpen() {
		isOpen = !isOpen;
	}
</script>

<div class="comment-widget">
	<!-- Header / Toggle -->
	<button class="comment-header" onclick={toggleOpen}>
		<MessageCircle size={16} />
		<span>Comments ({$commentCount})</span>
		{#if isOpen}
			<ChevronUp size={16} />
		{:else}
			<ChevronDown size={16} />
		{/if}
	</button>

	<!-- Collapsible Content -->
	{#if isOpen}
		<div class="comment-content">
			<Stack gap={0}>
				{#if threadedComments.length === 0}
					<p class="no-comments">No comments yet. Be the first!</p>
				{:else}
					{#each threadedComments as { comment, replies } (comment.id)}
						<CommentItem 
							{comment} 
							rootEventId={eventId}
							replies={replies}
						/>
					{/each}
				{/if}
			</Stack>

			<div class="comment-form-wrapper">
				<CommentForm {eventId} />
			</div>
		</div>
	{/if}
</div>

<style>
	.comment-widget {
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		margin-top: var(--space-4);
	}

	.comment-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3) 0;
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.comment-header:hover {
		color: var(--text-primary);
	}

	.comment-content {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.no-comments {
		color: var(--text-muted);
		font-size: 0.875rem;
		text-align: center;
		padding: var(--space-4) 0;
	}

	.comment-form-wrapper {
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}
</style>
