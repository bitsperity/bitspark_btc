<!--
  ProfileCard - Displays user profile information
  
  Uses NDK getUser and fetchProfile for profile data.
  Shows following count with modal.
-->
<script lang="ts">
	import { ndk } from '$lib/nostr';
	import { Card, Avatar, Badge, Skeleton, Stack, Row, Button } from '$lib/components';
	import { FollowButton, FollowingList } from '$lib/components/social';
	import { socialService, authService } from '$lib/services';
	import { Zap, ExternalLink, Users } from 'lucide-svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		pubkey: string;
		showActions?: boolean;
	}

	let { pubkey, showActions = true }: Props = $props();

	let profile = $state<NDKUserProfile | undefined>(undefined);
	let npub = $state<string>('');
	let isLoading = $state(true);
	let showFollowingModal = $state(false);

	// Subscribe to following list (for count)
	const followingList = socialService.subscribeFollowing();

	// Check if viewing own profile
	const isOwnProfile = $derived(pubkey === authService.user?.pubkey);

	// Fetch profile when pubkey changes
	$effect(() => {
		if (pubkey) {
			loadProfile(pubkey);
		}
	});

	async function loadProfile(pk: string) {
		isLoading = true;
		try {
			const user = ndk.getUser({ pubkey: pk });
			npub = user.npub;
			await user.fetchProfile();
			profile = user.profile;
		} catch (error) {
			console.error('[ProfileCard] Failed to load profile:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<Card variant="glow">
	{#if isLoading}
		<!-- Skeleton loading state -->
		<Stack gap={4}>
			<Row gap={4}>
				<Skeleton circle size="64px" />
				<Stack gap={2}>
					<Skeleton width="150px" height="1.5rem" />
					<Skeleton width="100px" height="1rem" />
				</Stack>
			</Row>
			<Skeleton width="100%" height="3rem" />
			<Row gap={3}>
				<Skeleton width="80px" height="2.5rem" />
				<Skeleton width="80px" height="2.5rem" />
			</Row>
		</Stack>
	{:else if profile}
		<Stack gap={4}>
			<!-- Header with avatar and name -->
			<Row gap={4}>
				<Avatar 
					src={profile.image ?? profile.picture} 
					fallback={profile.name?.[0] ?? '?'} 
					size="xl" 
				/>
				<Stack gap={1}>
					<h2 class="text-heading">{profile.name ?? profile.displayName ?? 'Anonymous'}</h2>
					{#if profile.nip05}
						<Badge variant="success">{profile.nip05}</Badge>
					{/if}
					<span class="npub">{npub.slice(0, 12)}...{npub.slice(-8)}</span>
				</Stack>
			</Row>

			<!-- Bio -->
			{#if profile.about}
				<p class="text-body bio">{profile.about}</p>
			{/if}

			<!-- Following count (only for own profile) -->
			{#if isOwnProfile}
				<button class="following-btn" onclick={() => showFollowingModal = true}>
					<Users size={16} />
					<span>Following: {$followingList.length}</span>
				</button>
			{/if}

			<!-- Links -->
			<Row gap={3} wrap>
				{#if profile.website}
					<a href={profile.website} target="_blank" rel="noopener" class="profile-link">
						<ExternalLink size={14} />
						<span>Website</span>
					</a>
				{/if}
				{#if profile.lud16}
					<span class="profile-link">
						<Zap size={14} />
						<span>{profile.lud16}</span>
					</span>
				{/if}
			</Row>

			<!-- Actions -->
			{#if showActions}
				<Row gap={3}>
					<FollowButton pubkey={pubkey} />
					{#if profile.lud16}
						<Button variant="primary">
							<Zap size={16} />
							<span>Zap</span>
						</Button>
					{/if}
				</Row>
			{/if}
		</Stack>
	{:else}
		<Stack gap={4}>
			<p class="text-muted">Profile not found</p>
		</Stack>
	{/if}
</Card>

<!-- Following Modal -->
<FollowingList 
	bind:open={showFollowingModal} 
	{pubkey} 
	onclose={() => showFollowingModal = false} 
/>

<style>
	.npub {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.bio {
		white-space: pre-wrap;
		word-break: break-word;
	}

	.profile-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 0.875rem;
		color: var(--text-muted);
		text-decoration: none;
	}

	.profile-link:hover {
		color: var(--orange-400);
	}

	.following-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
		width: fit-content;
	}

	.following-btn:hover {
		background: var(--bg-elevated);
		color: var(--primary);
		border-color: var(--primary);
	}
</style>
