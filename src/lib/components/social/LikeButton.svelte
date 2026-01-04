<!--
  LikeButton - Event-agnostic like button
  
  Works on any event ID. Shows heart icon and count.
-->
<script lang="ts">
	import { socialService } from '$lib/services';
	import { authService } from '$lib/services';
	import { Heart } from 'lucide-svelte';

	interface Props {
		eventId: string;
		showCount?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { eventId, showCount = true, size = 'md' }: Props = $props();

	// Subscribe to reactive stores
	const likeCount = socialService.subscribeLikeCount(eventId);
	const isLiked = socialService.subscribeIsLiked(eventId);

	let isLoading = $state(false);

	async function handleClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!authService.isLoggedIn) {
			console.warn('[LikeButton] Not logged in');
			return;
		}

		if (isLoading) return;
		isLoading = true;

		try {
			if ($isLiked) {
				await socialService.unlikeEvent(eventId);
			} else {
				await socialService.likeEvent(eventId);
			}
		} catch (error) {
			console.error('[LikeButton] Error:', error);
		} finally {
			isLoading = false;
		}
	}

	const iconSize = $derived(size === 'sm' ? 14 : size === 'lg' ? 20 : 16);
</script>

<button
	class="like-button"
	class:liked={$isLiked}
	class:loading={isLoading}
	class:size-sm={size === 'sm'}
	class:size-lg={size === 'lg'}
	onclick={handleClick}
	disabled={!authService.isLoggedIn}
	title={$isLiked ? 'Unlike' : 'Like'}
>
	<Heart size={iconSize} fill={$isLiked ? 'currentColor' : 'none'} />
	{#if showCount && $likeCount > 0}
		<span class="count">{$likeCount}</span>
	{/if}
</button>

<style>
	.like-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--duration-fast) var(--ease-out);
	}

	.like-button:hover:not(:disabled) {
		color: var(--error);
		background: rgba(239, 68, 68, 0.1);
	}

	.like-button.liked {
		color: var(--error);
	}

	.like-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.like-button.loading {
		opacity: 0.7;
		pointer-events: none;
	}

	.count {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.size-sm {
		padding: var(--space-1);
		font-size: 0.75rem;
	}

	.size-lg {
		padding: var(--space-2) var(--space-3);
		font-size: 1rem;
	}
</style>
