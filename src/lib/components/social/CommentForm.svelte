<!--
  CommentForm - Input for new comments or replies
-->
<script lang="ts">
	import { Button } from '$lib/components';
	import { commentService, authService } from '$lib/services';
	import { Send } from 'lucide-svelte';

	interface Props {
		eventId: string;
		replyToCommentId?: string;  // For threaded replies
		onSubmit?: () => void;
	}

	let { eventId, replyToCommentId, onSubmit }: Props = $props();

	let content = $state('');
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!content.trim() || isLoading) return;
		if (!authService.isLoggedIn) {
			console.warn('[CommentForm] Not logged in');
			return;
		}

		isLoading = true;

		try {
			await commentService.createComment(eventId, content.trim(), replyToCommentId);
			content = '';
			onSubmit?.();
		} catch (error) {
			console.error('[CommentForm] Error:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}
</script>

<form class="comment-form" onsubmit={handleSubmit}>
	<textarea
		bind:value={content}
		placeholder={authService.isLoggedIn ? 'Write a comment...' : 'Login to comment'}
		disabled={!authService.isLoggedIn || isLoading}
		onkeydown={handleKeydown}
		rows="2"
	></textarea>
	
	<Button 
		variant="primary" 
		size="sm" 
		disabled={!content.trim() || !authService.isLoggedIn || isLoading}
		type="submit"
	>
		<Send size={14} />
	</Button>
</form>

<style>
	.comment-form {
		display: flex;
		gap: var(--space-2);
		align-items: flex-end;
	}

	textarea {
		flex: 1;
		padding: var(--space-3);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-size: 0.875rem;
		font-family: inherit;
		resize: none;
		outline: none;
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	textarea::placeholder {
		color: var(--text-muted);
	}

	textarea:focus {
		border-color: var(--primary);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
