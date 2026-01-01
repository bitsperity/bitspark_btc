<!--
  UserAvatar Component
  
  A clickable avatar that loads profile from pubkey.
  
  Usage:
    <UserAvatar pubkey="abc123" />
    <UserAvatar pubkey="abc123" size="lg" showName />
-->
<script lang="ts">
	import { Avatar } from '$lib/components';
	import { profileService } from '$lib/services';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { goto } from '$app/navigation';
	import type { AvatarSize } from '$lib/types';

	interface Props {
		pubkey: string;
		size?: AvatarSize;
		showName?: boolean;
		clickable?: boolean;
		class?: string;
	}

	let {
		pubkey,
		size = 'md',
		showName = false,
		clickable = true,
		class: className = ''
	}: Props = $props();

	let profile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		loadProfile();
	});

	async function loadProfile() {
		if (pubkey) {
			profile = await profileService.getProfile(pubkey);
		}
	}

	function handleClick(e: Event) {
		if (clickable) {
			e.stopPropagation();
			goto(`/profile/${pubkey}`);
		}
	}

	const displayName = $derived(profile?.name ?? profile?.displayName ?? 'Anonymous');
</script>

{#if clickable}
	<button class="user-avatar {className}" onclick={handleClick} title={displayName}>
		<Avatar 
			src={profile?.image} 
			fallback={displayName} 
			{size} 
		/>
		{#if showName}
			<span class="user-name">{displayName}</span>
		{/if}
	</button>
{:else}
	<div class="user-avatar {className}">
		<Avatar 
			src={profile?.image} 
			fallback={displayName} 
			{size} 
		/>
		{#if showName}
			<span class="user-name">{displayName}</span>
		{/if}
	</div>
{/if}

<style>
	.user-avatar {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: var(--radius-full);
		transition: transform 0.15s ease, opacity 0.15s ease;
	}

	button.user-avatar:hover {
		transform: scale(1.05);
	}

	button.user-avatar:active {
		transform: scale(0.98);
	}

	.user-name {
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}
</style>
