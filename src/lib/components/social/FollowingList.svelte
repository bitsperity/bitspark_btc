<!--
  FollowingList - Modal showing who a user follows
  
  Features:
  - Search filter
  - Profiles with avatar + name
  - Unfollow button (only for own list)
  - Click to view profile
-->
<script lang="ts">
	import { Modal, Row, Stack, Avatar, Button } from '$lib/components';
	import { FollowButton } from '$lib/components/social';
	import { socialService, profileService, authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Search, Users } from 'lucide-svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		open: boolean;
		pubkey: string;  // User whose following we're viewing
		onclose: () => void;
	}

	let { open = $bindable(), pubkey, onclose }: Props = $props();

	// State
	let searchQuery = $state('');
	let profiles = $state<Map<string, NDKUserProfile>>(new Map());
	let isLoading = $state(true);

	// Subscribe to following list
	const followingList = socialService.subscribeFollowing();

	// Check if viewing own profile
	const isOwnProfile = $derived(pubkey === authService.user?.pubkey);

	// Filtered list
	const filteredList = $derived(() => {
		const list = $followingList;
		if (!searchQuery.trim()) return list;
		
		const query = searchQuery.toLowerCase();
		return list.filter(pk => {
			const profile = profiles.get(pk);
			const name = profile?.name?.toLowerCase() || '';
			const displayName = profile?.displayName?.toLowerCase() || '';
			return name.includes(query) || displayName.includes(query) || pk.includes(query);
		});
	});

	// Load profiles on open
	$effect(() => {
		if (open && $followingList.length > 0) {
			loadProfiles();
		}
	});

	async function loadProfiles() {
		isLoading = true;
		const newProfiles = new Map<string, NDKUserProfile>();
		
		// Load in batches to not freeze UI
		for (const pk of $followingList) {
			const profile = await profileService.getProfile(pk);
			if (profile) {
				newProfiles.set(pk, profile);
			}
			// Update incrementally
			profiles = new Map(newProfiles);
		}
		
		isLoading = false;
	}

	function handleProfileClick(pk: string) {
		onclose();
		goto(`/profile/${pk}`);
	}

	function getDisplayName(pk: string): string {
		const profile = profiles.get(pk);
		return profile?.name ?? profile?.displayName ?? pk.slice(0, 12) + '...';
	}
</script>

<Modal bind:open title="Following ({$followingList.length})" onclose={onclose}>
	<Stack gap={4}>
		<!-- Search -->
		<div class="search-wrapper">
			<Search size={16} class="search-icon" />
			<input
				type="text"
				placeholder="Search..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>

		<!-- List -->
		<div class="following-list">
			{#if isLoading && $followingList.length === 0}
				<p class="empty-state">Loading...</p>
			{:else if filteredList().length === 0}
				<div class="empty-state">
					<Users size={32} />
					<p>No results found</p>
				</div>
			{:else}
				{#each filteredList() as pk (pk)}
					{@const profile = profiles.get(pk)}
					<button class="follow-item" onclick={() => handleProfileClick(pk)}>
						<Avatar 
							src={profile?.image ?? profile?.picture} 
							fallback={getDisplayName(pk)[0]} 
							size="md" 
						/>
						<div class="user-info">
							<span class="user-name">{getDisplayName(pk)}</span>
							{#if profile?.nip05}
								<span class="user-nip05">{profile.nip05}</span>
							{/if}
						</div>
						{#if isOwnProfile}
							<div class="action" onclick={(e) => e.stopPropagation()}>
								<FollowButton pubkey={pk} variant="compact" />
							</div>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	</Stack>
</Modal>

<style>
	.search-wrapper {
		position: relative;
	}

	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: var(--space-3);
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}

	.search-input {
		width: 100%;
		padding: var(--space-3) var(--space-3) var(--space-3) var(--space-10);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.search-input:focus {
		border-color: var(--primary);
	}

	.following-list {
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.follow-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-align: left;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.follow-item:hover {
		background: var(--bg-elevated);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		display: block;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-nip05 {
		display: block;
		font-size: 0.75rem;
		color: var(--success);
	}

	.action {
		flex-shrink: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-8);
		color: var(--text-muted);
		text-align: center;
	}
</style>
