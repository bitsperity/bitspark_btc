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
	import { ndk } from '$lib/nostr';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import { ideaService, jobService, contractService } from '$lib/services';
	import { nip19 } from 'nostr-tools';
	import { page } from '$app/stores';
	import { Lightbulb, Briefcase, FileCheck } from 'lucide-svelte';
	import type { Idea } from '$lib/types/idea';
	import type { Job } from '$lib/types/job';
	import type { Contract } from '$lib/types/contract';

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
	let activeTab = $state<'ideas' | 'jobs' | 'contracts'>('ideas');

	// Content stores
	let ideas = $state<Idea[]>([]);
	let jobs = $state<Job[]>([]);
	let contracts = $state<Contract[]>([]);
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

	function setTab(tab: 'ideas' | 'jobs' | 'contracts') {
		activeTab = tab;
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
			{/if}
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

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

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-6);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-16);
		color: var(--text-muted);
		text-align: center;
	}

	.loading {
		text-align: center;
		padding: var(--space-8);
		color: var(--text-muted);
	}
</style>
