<!--
  ProfileCard - Professional user profile display
  
  Features:
  - Banner image (Nostr standard)
  - Avatar overlapping banner
  - Stats: Ideas, Jobs, Contracts
  - Edit button (own profile)
  - Following count modal
  - Links: Website, Lightning, GitHub
-->
<script lang="ts">
	import { ndk } from '$lib/nostr';
	import { Card, Avatar, Badge, Skeleton, Stack, Row, Button } from '$lib/components';
	import { FollowButton, FollowingList } from '$lib/components/social';
	import { socialService, authService, ideaService, jobService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Zap, ExternalLink, Users, Edit, Lightbulb, Briefcase, FileCheck, Github } from 'lucide-svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { NOSTR_KINDS } from '$lib/nostr/config';

	interface Props {
		pubkey: string;
		showActions?: boolean;
	}

	let { pubkey, showActions = true }: Props = $props();

	let profile = $state<NDKUserProfile | undefined>(undefined);
	let npub = $state<string>('');
	let isLoading = $state(true);
	let showFollowingModal = $state(false);

	// Stats
	let ideasCount = $state(0);
	let jobsCount = $state(0);
	let contractsCount = $state(0);

	// Subscribe to following list (for count)
	const followingList = socialService.subscribeFollowing();

	// Check if viewing own profile
	const isOwnProfile = $derived(pubkey === authService.user?.pubkey);

	// Fetch profile when pubkey changes
	$effect(() => {
		if (pubkey) {
			loadProfile(pubkey);
			loadStats(pubkey);
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

	async function loadStats(pk: string) {
		try {
			// Count Ideas
			const ideas = await ndk.fetchEvents({
				kinds: [NOSTR_KINDS.IDEA as number],
				authors: [pk],
				'#s': ['bitspark']
			});
			ideasCount = ideas.size;

			// Count Jobs
			const jobs = await ndk.fetchEvents({
				kinds: [NOSTR_KINDS.JOB as number],
				authors: [pk],
				'#s': ['bitspark']
			});
			jobsCount = jobs.size;

			// Count Contracts (as party)
			const contracts = await ndk.fetchEvents({
				kinds: [NOSTR_KINDS.CONTRACT as number],
				'#p': [pk],
				'#s': ['bitspark']
			});
			contractsCount = contracts.size;
		} catch (error) {
			console.error('[ProfileCard] Failed to load stats:', error);
		}
	}

	function handleEdit() {
		goto('/profile/edit');
	}

	// Extract github from profile if available
	const githubUrl = $derived(() => {
		if (!profile) return null;
		// Check common fields
		const github = (profile as any).github;
		if (github) return `https://github.com/${github}`;
		// Check if website is github
		if (profile.website?.includes('github.com')) return profile.website;
		return null;
	});
</script>

<div class="profile-wrapper">
	<!-- Banner -->
	<div class="banner" style:background-image={profile?.banner ? `url(${profile.banner})` : 'none'}>
		{#if !profile?.banner}
			<div class="banner-gradient"></div>
		{/if}
	</div>

	<!-- Profile Content -->
	<div class="profile-content">
		{#if isLoading}
			<!-- Skeleton -->
			<div class="avatar-wrapper">
				<Skeleton circle size="96px" />
			</div>
			<Stack gap={3}>
				<Skeleton width="200px" height="2rem" />
				<Skeleton width="150px" height="1rem" />
				<Skeleton width="100%" height="3rem" />
			</Stack>
		{:else if profile}
			<!-- Avatar overlapping banner -->
			<div class="avatar-wrapper">
				<Avatar 
					src={profile.image ?? profile.picture} 
					fallback={profile.name?.[0] ?? '?'} 
					size="xl" 
				/>
			</div>

			<!-- Header Row with Edit Button -->
			<Row justify="between" class="header-row">
				<div>
					<h1 class="profile-name">{profile.name ?? profile.displayName ?? 'Anonymous'}</h1>
					{#if profile.nip05}
						<Badge variant="success">{profile.nip05}</Badge>
					{/if}
					<p class="npub">{npub.slice(0, 16)}...{npub.slice(-8)}</p>
				</div>
				{#if isOwnProfile}
					<Button variant="glass" size="sm" onclick={handleEdit}>
						<Edit size={16} />
						<span>Edit Profile</span>
					</Button>
				{/if}
			</Row>

			<!-- Bio -->
			{#if profile.about}
				<p class="bio">{profile.about}</p>
			{/if}

			<!-- Links -->
			<Row gap={4} wrap class="links-row">
				{#if profile.website && !profile.website.includes('github.com')}
					<a href={profile.website} target="_blank" rel="noopener" class="profile-link">
						<ExternalLink size={14} />
						<span>Website</span>
					</a>
				{/if}
				{#if githubUrl()}
					<a href={githubUrl()} target="_blank" rel="noopener" class="profile-link github">
						<Github size={14} />
						<span>GitHub</span>
					</a>
				{/if}
				{#if profile.lud16}
					<span class="profile-link lightning">
						<Zap size={14} />
						<span>{profile.lud16}</span>
					</span>
				{/if}
			</Row>

			<!-- Stats -->
			<div class="stats-row">
				<div class="stat-item">
					<Lightbulb size={18} />
					<span class="stat-value">{ideasCount}</span>
					<span class="stat-label">Ideas</span>
				</div>
				<div class="stat-item">
					<Briefcase size={18} />
					<span class="stat-value">{jobsCount}</span>
					<span class="stat-label">Jobs</span>
				</div>
				<div class="stat-item">
					<FileCheck size={18} />
					<span class="stat-value">{contractsCount}</span>
					<span class="stat-label">Contracts</span>
				</div>
			</div>

			<!-- Actions -->
			{#if showActions}
				<Row gap={3} class="actions-row">
					{#if isOwnProfile}
						<button class="following-btn" onclick={() => showFollowingModal = true}>
							<Users size={16} />
							<span>Following: {$followingList.length}</span>
						</button>
					{:else}
						<FollowButton {pubkey} />
					{/if}
					{#if profile.lud16}
						<Button variant="primary">
							<Zap size={16} />
							<span>Zap</span>
						</Button>
					{/if}
				</Row>
			{/if}
		{:else}
			<p class="text-muted">Profile not found</p>
		{/if}
	</div>
</div>

<!-- Following Modal -->
<FollowingList 
	bind:open={showFollowingModal} 
	{pubkey} 
	onclose={() => showFollowingModal = false} 
/>

<style>
	.profile-wrapper {
		position: relative;
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	.banner {
		height: 160px;
		background-size: cover;
		background-position: center;
		position: relative;
	}

	.banner-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, 
			var(--primary) 0%, 
			var(--orange-600) 50%, 
			var(--amber-500) 100%
		);
		opacity: 0.6;
	}

	.profile-content {
		padding: var(--space-6);
		padding-top: var(--space-12);
		position: relative;
	}

	.avatar-wrapper {
		position: absolute;
		top: -48px;
		left: var(--space-6);
	}

	.avatar-wrapper :global(.avatar) {
		width: 96px;
		height: 96px;
		border: 4px solid var(--bg-base);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	:global(.header-row) {
		margin-top: var(--space-4);
	}

	.profile-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 var(--space-1) 0;
	}

	.npub {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: var(--space-1);
	}

	.bio {
		color: var(--text-secondary);
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
		margin: var(--space-4) 0;
	}

	.links-row {
		margin-bottom: var(--space-4);
	}

	.profile-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 0.875rem;
		color: var(--text-muted);
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.profile-link:hover {
		color: var(--primary);
	}

	.profile-link.github:hover {
		color: var(--text-primary);
	}

	.profile-link.lightning {
		color: var(--amber-400);
	}

	.stats-row {
		display: flex;
		gap: var(--space-6);
		padding: var(--space-4);
		background: rgba(255, 255, 255, 0.03);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: 0.875rem;
	}

	.following-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.following-btn:hover {
		background: var(--bg-elevated);
		color: var(--primary);
		border-color: var(--primary);
	}
</style>
