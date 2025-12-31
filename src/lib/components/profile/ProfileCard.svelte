<!--
  ProfileCard - Displays user profile information
  
  Uses NDKSvelte reactive subscription for auto-updating profile data.
-->
<script lang="ts">
	import { profileService } from '$lib/services';
	import { Card, Avatar, Badge, Skeleton, Stack, Row, Button } from '$lib/components';
	import { Github, Zap, ExternalLink } from 'lucide-svelte';
	import { onDestroy } from 'svelte';

	interface Props {
		pubkey: string;
		showActions?: boolean;
	}

	let { pubkey, showActions = true }: Props = $props();

	// Reactive subscription using NDK-Svelte
	const profileEvents = profileService.subscribeToProfile(pubkey);

	// Get the NDKUser for npub
	const ndkUser = $derived(profileService.getUser(pubkey));

	// Extract profile from first event
	const profile = $derived($profileEvents[0] as { profile?: Record<string, string> } | undefined);
	const profileData = $derived(profile?.profile);

	// Cleanup subscription on destroy
	onDestroy(() => profileEvents.unsubscribe());
</script>

<Card variant="glow">
	{#if profileData}
		<Stack gap={4}>
			<!-- Header with avatar and name -->
			<Row gap={4}>
				<Avatar 
					src={profileData.image ?? profileData.picture} 
					fallback={profileData.name?.[0] ?? '?'} 
					size="xl" 
				/>
				<Stack gap={1}>
					<h2 class="text-heading">{profileData.name ?? profileData.displayName ?? 'Anonymous'}</h2>
					{#if profileData.nip05}
						<Badge variant="success">{profileData.nip05}</Badge>
					{/if}
					<span class="npub">{ndkUser.npub.slice(0, 12)}...{ndkUser.npub.slice(-8)}</span>
				</Stack>
			</Row>

			<!-- Bio -->
			{#if profileData.about}
				<p class="text-body bio">{profileData.about}</p>
			{/if}

			<!-- Links -->
			<Row gap={3} wrap>
				{#if profileData.website}
					<a href={profileData.website} target="_blank" rel="noopener" class="profile-link">
						<ExternalLink size={14} />
						<span>Website</span>
					</a>
				{/if}
				{#if profileData.lud16}
					<span class="profile-link">
						<Zap size={14} />
						<span>{profileData.lud16}</span>
					</span>
				{/if}
			</Row>

			<!-- Actions -->
			{#if showActions}
				<Row gap={3}>
					<Button variant="primary">
						<Zap size={16} />
						<span>Zap</span>
					</Button>
					<Button variant="glass">
						<span>Follow</span>
					</Button>
				</Row>
			{/if}
		</Stack>
	{:else}
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
	{/if}
</Card>

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
</style>
