<!--
  Profile Page - Complete user profile with content tabs
  
  Features:
  - ProfileCard with banner, stats
  - Tabs: Ideas | Jobs | Contracts
  - Content grid for user's work
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground } from '$lib/components';
	import { ProfileCard } from '$lib/components/profile';
	import { IdeaCard } from '$lib/components/ideas';
	import { JobCard } from '$lib/components/jobs';
	import { ContractCard } from '$lib/components/contracts';
	import { BookmarkedCommentCard } from '$lib/components/social';
	import { ListCard } from '$lib/components/lists';
	import { ndk } from '$lib/nostr';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import { ideaService, jobService, contractService, bookmarkService, authService, listService, type List } from '$lib/services';
	import { nip19 } from 'nostr-tools';
	import { page } from '$app/stores';
	import { Lightbulb, Briefcase, FileCheck, Bookmark, FolderOpen, MessageCircle } from 'lucide-svelte';
	import type { Idea } from '$lib/types/idea';
	import type { Job } from '$lib/types/job';
	import type { Contract } from '$lib/types/contract';
	import type { Comment } from '$lib/types/social';

	// Get npub from route params
	const npub = $derived($page.params.npub);

	// Decode npub to hex pubkey
	const pubkey = $derived(() => {
		try {
			if (npub.startsWith('npub')) {
				const decoded = nip19.decode(npub);
				return decoded.data as string;
			}
			return npub; // Already hex
		} catch {
			return npub;
		}
	});

	// Tab state
	let activeTab = $state<'ideas' | 'jobs' | 'contracts' | 'bookmarks' | 'lists'>('ideas');

	// Check if viewing own profile
	const isOwnProfile = $derived(() => {
		const currentUser = authService.user;
		return currentUser && currentUser.pubkey === pubkey();
	});

	// Content stores
	let ideas = $state<Idea[]>([]);
	let jobs = $state<Job[]>([]);
	let contracts = $state<Contract[]>([]);
	let bookmarkedIdeas = $state<Idea[]>([]);
	let bookmarkedJobs = $state<Job[]>([]);
	let bookmarkedComments = $state<Comment[]>([]);
	let userLists = $state<List[]>([]);
	let isLoadingContent = $state(false);

	// Load content when tab changes or pubkey changes
	$effect(() => {
		const pk = pubkey();
		if (pk) {
			loadContent(pk, activeTab);
		}
	});

	async function loadContent(pk: string, tab: string) {
		isLoadingContent = true;
		
		try {
			if (tab === 'ideas') {
				const events = await ndk.fetchEvents({
					kinds: [NOSTR_KINDS.IDEA as number],
					authors: [pk],
					'#s': ['bitspark']
				});
				ideas = Array.from(events).map((e: any) => ideaService.parseIdeaEvent(e));
			} else if (tab === 'jobs') {
				const events = await ndk.fetchEvents({
					kinds: [NOSTR_KINDS.JOB as number],
					authors: [pk],
					'#s': ['bitspark']
				});
				jobs = Array.from(events).map((e: any) => jobService.parseJobEvent(e));
			} else if (tab === 'contracts') {
				// Contracts where user is author OR party
				const asAuthor = await ndk.fetchEvents({
					kinds: [NOSTR_KINDS.CONTRACT as number],
					authors: [pk],
					'#s': ['bitspark']
				});
				const asParty = await ndk.fetchEvents({
					kinds: [NOSTR_KINDS.CONTRACT as number],
					'#p': [pk],
					'#s': ['bitspark']
				});
				
				// Combine and dedupe
				const allEvents = new Map();
				asAuthor.forEach(e => allEvents.set(e.id, e));
				asParty.forEach(e => allEvents.set(e.id, e));
				contracts = Array.from(allEvents.values()).map((e: any) => contractService.parseContractEvent(e));
			}
		} catch (error) {
			console.error('[Profile] Failed to load content:', error);
		} finally {
			isLoadingContent = false;
		}
	}

	// Load bookmarks (only for own profile)
	async function loadBookmarks() {
		if (!isOwnProfile()) return;
		
		isLoadingContent = true;
		try {
			const ideaBookmarks = bookmarkService.getBookmarksByType('idea');
			const jobBookmarks = bookmarkService.getBookmarksByType('job');
			
			// Subscribe to get current values
			let ideaIds: string[] = [];
			let jobIds: string[] = [];
			ideaBookmarks.subscribe(items => ideaIds = items.map(i => i.eventId))();
			jobBookmarks.subscribe(items => jobIds = items.map(i => i.eventId))();
			
			// Fetch actual events
			if (ideaIds.length > 0) {
				const fetchedIdeas = await Promise.all(ideaIds.map(id => ideaService.getIdea(id)));
				bookmarkedIdeas = fetchedIdeas.filter((i): i is Idea => i !== null);
			} else {
				bookmarkedIdeas = [];
			}
			
			if (jobIds.length > 0) {
				const fetchedJobs = await Promise.all(jobIds.map(id => jobService.getJob(id)));
				bookmarkedJobs = fetchedJobs.filter((j): j is Job => j !== null);
			} else {
				bookmarkedJobs = [];
			}
			
			// Fetch bookmarked comments
			const commentBookmarks = bookmarkService.getBookmarksByType('comment');
			let commentIds: string[] = [];
			commentBookmarks.subscribe(items => commentIds = items.map(i => i.eventId))();
			
			if (commentIds.length > 0) {
				const events = await ndk.fetchEvents({ ids: commentIds });
				bookmarkedComments = Array.from(events).map(e => {
					// Extract root event ID from e-tags
					const rootTag = e.tags.find(t => t[0] === 'e' && t[3] === 'root');
					const firstETag = e.tags.find(t => t[0] === 'e');
					const rootEventId = rootTag?.[1] ?? firstETag?.[1];
					
					return {
						id: e.id,
						content: e.content,
						pubkey: e.pubkey,
						createdAt: e.created_at ?? 0,
						rootEventId
					};
				});
			} else {
				bookmarkedComments = [];
			}
		} catch (error) {
			console.error('[Profile] Failed to load bookmarks:', error);
		} finally {
			isLoadingContent = false;
		}
	}

	function setTab(tab: 'ideas' | 'jobs' | 'contracts' | 'bookmarks' | 'lists') {
		activeTab = tab;
		if (tab === 'bookmarks') {
			loadBookmarks();
		} else if (tab === 'lists') {
			loadLists();
		}
	}

	async function loadLists() {
		if (!isOwnProfile()) return;
		
		isLoadingContent = true;
		try {
			userLists = await listService.loadLists(pubkey());
		} catch (error) {
			console.error('[Profile] Failed to load lists:', error);
		} finally {
			isLoadingContent = false;
		}
	}
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<ProfileCard pubkey={pubkey()} />

			<!-- Tabs -->
			<div class="tabs">
				<button 
					class="tab" 
					class:active={activeTab === 'ideas'} 
					onclick={() => setTab('ideas')}
				>
					<Lightbulb size={16} />
					<span>Ideas</span>
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'jobs'} 
					onclick={() => setTab('jobs')}
				>
					<Briefcase size={16} />
					<span>Jobs</span>
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'contracts'} 
					onclick={() => setTab('contracts')}
				>
					<FileCheck size={16} />
					<span>Contracts</span>
				</button>
				{#if isOwnProfile()}
					<button 
						class="tab" 
						class:active={activeTab === 'bookmarks'} 
						onclick={() => setTab('bookmarks')}
					>
						<Bookmark size={16} />
						<span>Bookmarks</span>
					</button>
					<button 
						class="tab" 
						class:active={activeTab === 'lists'} 
						onclick={() => setTab('lists')}
					>
						<FolderOpen size={16} />
						<span>Lists</span>
					</button>
				{/if}
			</div>

			<!-- Content -->
			{#if isLoadingContent}
				<div class="loading">Loading...</div>
			{:else if activeTab === 'ideas'}
				{#if ideas.length === 0}
					<div class="empty-state">
						<Lightbulb size={48} />
						<p>No ideas yet</p>
					</div>
				{:else}
					<div class="content-grid">
						{#each ideas as idea (idea.id)}
							<IdeaCard {idea} />
						{/each}
					</div>
				{/if}
			{:else if activeTab === 'jobs'}
				{#if jobs.length === 0}
					<div class="empty-state">
						<Briefcase size={48} />
						<p>No jobs yet</p>
					</div>
				{:else}
					<div class="content-grid">
						{#each jobs as job (job.id)}
							<JobCard {job} />
						{/each}
					</div>
				{/if}
			{:else if activeTab === 'contracts'}
				{#if contracts.length === 0}
					<div class="empty-state">
						<FileCheck size={48} />
						<p>No contracts yet</p>
					</div>
				{:else}
					<div class="content-grid">
						{#each contracts as contract (contract.id)}
							<ContractCard {contract} />
						{/each}
					</div>
				{/if}
			{:else if activeTab === 'bookmarks'}
				{#if bookmarkedIdeas.length === 0 && bookmarkedJobs.length === 0 && bookmarkedComments.length === 0}
					<div class="empty-state">
						<Bookmark size={48} />
						<p>No bookmarks yet</p>
					</div>
				{:else}
					<Stack gap={4}>
						{#if bookmarkedIdeas.length > 0}
							<h3 class="section-title">Ideas</h3>
							<div class="content-grid">
								{#each bookmarkedIdeas as idea (idea.id)}
									<IdeaCard {idea} />
								{/each}
							</div>
						{/if}
						{#if bookmarkedJobs.length > 0}
							<h3 class="section-title">Jobs</h3>
							<div class="content-grid">
								{#each bookmarkedJobs as job (job.id)}
									<JobCard {job} />
								{/each}
							</div>
						{/if}
						{#if bookmarkedComments.length > 0}
							<h3 class="section-title">Comments</h3>
							<div class="comment-list">
								{#each bookmarkedComments as comment (comment.id)}
									<BookmarkedCommentCard {comment} />
								{/each}
							</div>
						{/if}
					</Stack>
				{/if}
			{:else if activeTab === 'lists'}
				{#if userLists.length === 0}
					<div class="empty-state">
						<FolderOpen size={48} />
						<h3>No lists yet</h3>
						<p>Create lists to organize your favorite content.</p>
						<a href="/lists" class="manage-link">Manage Lists</a>
					</div>
				{:else}
					<Stack gap={4}>
						<div class="lists-header">
							<span>{userLists.length} list{userLists.length !== 1 ? 's' : ''}</span>
							<a href="/lists" class="manage-link">Manage All</a>
						</div>
						<div class="content-grid">
							{#each userLists as list (list.id)}
								<ListCard {list} />
							{/each}
						</div>
					</Stack>
				{/if}
			{/if}
		</Stack>
	</Container>
</main>

<style>
	/* Page-specific styles - utilities from pages.css */

	.tabs {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--duration-fast) var(--ease-out);
	}

	.tab:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: var(--primary);
		background: rgba(249, 115, 22, 0.15);
	}

	.comment-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.lists-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.manage-link {
		color: var(--primary);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.manage-link:hover {
		text-decoration: underline;
	}

	.profile-actions {
		display: flex;
		justify-content: center;
	}

	.message-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		background: var(--primary);
		color: white;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.message-btn:hover {
		background: var(--primary-hover);
		transform: translateY(-1px);
	}
</style>
