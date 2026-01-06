<!--
  BookmarkButton - Toggle bookmark on Ideas/Jobs/Comments
  
  Uses NIP-51 Kind 10003 bookmarks via bookmarkService.
-->
<script lang="ts">
	import { bookmarkService } from '$lib/services';
	import { Bookmark } from 'lucide-svelte';

	interface Props {
		eventId: string;
		type: 'idea' | 'job' | 'comment';
		size?: 'sm' | 'md';
	}

	let { eventId, type, size = 'md' }: Props = $props();

	// Subscribe to bookmark state
	const isBookmarked = bookmarkService.isBookmarked(eventId);
	
	let isLoading = $state(false);

	async function handleClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		
		if (isLoading) return;
		
		isLoading = true;
		try {
			await bookmarkService.toggleBookmark(eventId, type);
		} catch (error) {
			console.error('[Bookmark] Toggle failed:', error);
		} finally {
			isLoading = false;
		}
	}

	const iconSize = $derived(size === 'sm' ? 14 : 18);
</script>

<button 
	class="bookmark-btn" 
	class:active={$isBookmarked}
	class:loading={isLoading}
	class:sm={size === 'sm'}
	onclick={handleClick}
	title={$isBookmarked ? 'Remove bookmark' : 'Bookmark'}
>
	<Bookmark size={iconSize} fill={$isBookmarked ? 'currentColor' : 'none'} />
</button>

<style>
	.bookmark-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.bookmark-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.bookmark-btn.active {
		color: var(--amber-400);
	}

	.bookmark-btn.active:hover {
		color: var(--amber-300);
	}

	.bookmark-btn.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.bookmark-btn.sm {
		padding: var(--space-1);
	}
</style>
