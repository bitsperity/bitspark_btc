<!--
  FollowButton - Follow/Unfollow toggle for any user
-->
<script lang="ts">
	import { socialService } from '$lib/services';
	import { authService } from '$lib/services';
	import { UserPlus, UserCheck } from 'lucide-svelte';

	interface Props {
		pubkey: string;
		variant?: 'default' | 'compact';
	}

	let { pubkey, variant = 'default' }: Props = $props();

	// Subscribe to reactive follow status
	const isFollowing = socialService.subscribeIsFollowing(pubkey);

	let isLoading = $state(false);

	async function handleClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		if (!authService.isLoggedIn) {
			console.warn('[FollowButton] Not logged in');
			return;
		}

		// Don't follow yourself
		if (pubkey === authService.currentUser?.pubkey) {
			return;
		}

		if (isLoading) return;
		isLoading = true;

		try {
			if ($isFollowing) {
				await socialService.unfollowUser(pubkey);
			} else {
				await socialService.followUser(pubkey);
			}
		} catch (error) {
			console.error('[FollowButton] Error:', error);
		} finally {
			isLoading = false;
		}
	}

	// Hide if viewing own profile
	const isOwnProfile = $derived(pubkey === authService.currentUser?.pubkey);
</script>

{#if !isOwnProfile}
	<button
		class="follow-button"
		class:following={$isFollowing}
		class:loading={isLoading}
		class:compact={variant === 'compact'}
		onclick={handleClick}
		disabled={!authService.isLoggedIn}
	>
		{#if $isFollowing}
			<UserCheck size={16} />
			{#if variant !== 'compact'}
				<span>Following</span>
			{/if}
		{:else}
			<UserPlus size={16} />
			{#if variant !== 'compact'}
				<span>Follow</span>
			{/if}
		{/if}
	</button>
{/if}

<style>
	.follow-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--primary);
		border: 1px solid var(--primary);
		color: white;
		cursor: pointer;
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.follow-button:hover:not(:disabled) {
		background: var(--primary-hover);
		transform: translateY(-1px);
	}

	.follow-button.following {
		background: transparent;
		border-color: var(--success);
		color: var(--success);
	}

	.follow-button.following:hover {
		border-color: var(--error);
		color: var(--error);
		background: rgba(239, 68, 68, 0.1);
	}

	.follow-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.follow-button.loading {
		opacity: 0.7;
		pointer-events: none;
	}

	.follow-button.compact {
		padding: var(--space-1) var(--space-2);
	}
</style>
