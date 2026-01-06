<!--
  List Detail Page - View and manage a single list
  
  Features:
  - View list items (Ideas, Jobs, Comments)
  - Edit list title/description
  - Delete list
  - Remove items from list
-->
<script lang="ts">
	import { Container, Stack, Row, Button, Modal, Card, AuroraBackground } from '$lib/components';
	import { IdeaCard } from '$lib/components/ideas';
	import { JobCard } from '$lib/components/jobs';
	import { BookmarkedCommentCard } from '$lib/components/social';
	import { listService, ideaService, jobService, authService } from '$lib/services';
	import { ndk } from '$lib/nostr';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Edit, Trash2, FolderOpen, Lightbulb, Briefcase, MessageCircle, X } from 'lucide-svelte';
	import type { Idea } from '$lib/types/idea';
	import type { Job } from '$lib/types/job';
	import type { Comment } from '$lib/types/social';

	// Get list ID from route
	const listId = $derived($page.params.id);

	// List data
	let list = $state(listService.getList(listId));
	let isLoading = $state(true);
	
	// Loaded items
	let ideas = $state<Idea[]>([]);
	let jobs = $state<Job[]>([]);
	let comments = $state<Comment[]>([]);

	// Edit modal
	let showEditModal = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let isEditing = $state(false);

	// Delete modal
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

	// Remove item modal
	let showRemoveModal = $state(false);
	let removeTargetId = $state<string | null>(null);
	let isRemoving = $state(false);

	// Check if owner
	const isOwner = $derived(authService.user !== undefined);

	// Subscribe to list updates - only update list reference, not trigger loadItems
	const lists = listService.subscribeLists();
	
	// Track which list we've loaded items for
	let loadedListId = $state<string | null>(null);
	
	$effect(() => {
		const found = $lists.find(l => l.id === listId);
		if (found) {
			list = found;
		}
	});

	// Load items only when list ID changes
	$effect(() => {
		if (list && list.id !== loadedListId) {
			loadedListId = list.id;
			loadItems();
		}
	});

	async function loadItems() {
		if (!list) return;
		
		isLoading = true;
		try {
			// Load ideas
			const ideaItems = list.items.filter(i => i.type === 'idea');
			if (ideaItems.length > 0) {
				const fetchedIdeas = await Promise.all(
					ideaItems.map(i => ideaService.getIdea(i.eventId))
				);
				ideas = fetchedIdeas.filter((idea): idea is Idea => idea !== null);
			} else {
				ideas = [];
			}

			// Load jobs
			const jobItems = list.items.filter(i => i.type === 'job');
			if (jobItems.length > 0) {
				const fetchedJobs = await Promise.all(
					jobItems.map(i => jobService.getJob(i.eventId))
				);
				jobs = fetchedJobs.filter((job): job is Job => job !== null);
			} else {
				jobs = [];
			}

			// Load comments
			const commentItems = list.items.filter(i => i.type === 'comment');
			if (commentItems.length > 0) {
				const events = await ndk.fetchEvents({ ids: commentItems.map(i => i.eventId) });
				comments = Array.from(events).map(e => {
					const rootTag = e.tags.find(t => t[0] === 'e' && t[3] === 'root');
					const firstETag = e.tags.find(t => t[0] === 'e');
					return {
						id: e.id,
						content: e.content,
						pubkey: e.pubkey,
						createdAt: e.created_at ?? 0,
						rootEventId: rootTag?.[1] ?? firstETag?.[1]
					};
				});
			} else {
				comments = [];
			}
		} catch (error) {
			console.error('[ListDetail] Failed to load items:', error);
		} finally {
			isLoading = false;
		}
	}

	function openEditModal() {
		console.log('[ListDetail] openEditModal called, list:', list);
		if (!list) return;
		editTitle = list.title;
		editDescription = list.description ?? '';
		showEditModal = true;
		console.log('[ListDetail] showEditModal set to:', showEditModal);
	}

	async function handleEdit() {
		if (!list || !editTitle.trim()) return;
		
		isEditing = true;
		try {
			await listService.updateList(list.id, {
				title: editTitle.trim(),
				description: editDescription.trim() || undefined
			});
			showEditModal = false;
		} catch (error) {
			console.error('[ListDetail] Failed to update list:', error);
		} finally {
			isEditing = false;
		}
	}

	async function handleDelete() {
		if (!list) return;
		
		isDeleting = true;
		try {
			await listService.deleteList(list.id);
			goto('/lists');
		} catch (error) {
			console.error('[ListDetail] Failed to delete list:', error);
		} finally {
			isDeleting = false;
		}
	}

	function openRemoveModal(eventId: string) {
		removeTargetId = eventId;
		showRemoveModal = true;
	}

	async function handleConfirmRemove() {
		if (!list || !removeTargetId) return;
		isRemoving = true;
		try {
			await listService.removeFromList(list.id, removeTargetId);
			showRemoveModal = false;
			removeTargetId = null;
		} catch (error) {
			console.error('[ListDetail] Failed to remove item:', error);
		} finally {
			isRemoving = false;
		}
	}
</script>

<svelte:head>
	<title>{list?.title ?? 'List'} | BitSpark</title>
</svelte:head>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<!-- Header -->
			<div class="header">
				<a href="/lists" class="back-link">
					<ArrowLeft size={16} />
					Back to Lists
				</a>
				
				{#if list}
					<Row justify="between" align="start" class="title-row">
						<div class="list-info">
							<Row gap={3}>
								<FolderOpen size={28} class="list-icon" />
								<h1 class="list-title">{list.title}</h1>
							</Row>
							{#if list.description}
								<p class="list-description">{list.description}</p>
							{/if}
						</div>
						{#if isOwner}
							<Row gap={2}>
								<Button variant="ghost" size="sm" onclick={openEditModal}>
									<Edit size={14} />
									Edit
								</Button>
							<button class="icon-btn" onclick={() => { console.log('[ListDetail] Delete clicked'); showDeleteModal = true; }} title="Delete list">
								<Trash2 size={14} />
								Delete
							</button>
							</Row>
						{/if}
					</Row>
				{/if}
			</div>

			<!-- Content -->
			{#if !list}
				<div class="empty-state">
					<FolderOpen size={48} />
					<p>List not found</p>
					<a href="/lists">Back to Lists</a>
				</div>
			{:else if isLoading}
				<div class="loading">Loading items...</div>
			{:else if list.items.length === 0}
				<div class="empty-state">
					<FolderOpen size={48} />
					<h3>This list is empty</h3>
					<p>Add items by clicking the bookmark icon on any idea, job, or comment.</p>
				</div>
			{:else}
				<Stack gap={6}>
					{#if ideas.length > 0}
						<section>
							<Row gap={2} class="section-header">
								<Lightbulb size={18} />
								<h2 class="section-title">Ideas ({ideas.length})</h2>
							</Row>
							<div class="content-grid">
								{#each ideas as idea (idea.id)}
									<div class="list-item-wrapper">
										<IdeaCard {idea} />
										<button class="remove-btn" onclick={() => openRemoveModal(idea.id)} title="Remove from list">
											<X size={14} />
										</button>
									</div>
								{/each}
							</div>
						</section>
					{/if}

					{#if jobs.length > 0}
						<section>
							<Row gap={2} class="section-header">
								<Briefcase size={18} />
								<h2 class="section-title">Jobs ({jobs.length})</h2>
							</Row>
							<div class="content-grid">
								{#each jobs as job (job.id)}
									<div class="list-item-wrapper">
										<JobCard {job} />
										<button class="remove-btn" onclick={() => openRemoveModal(job.id)} title="Remove from list">
											<X size={14} />
										</button>
									</div>
								{/each}
							</div>
						</section>
					{/if}

					{#if comments.length > 0}
						<section>
							<Row gap={2} class="section-header">
								<MessageCircle size={18} />
								<h2 class="section-title">Comments ({comments.length})</h2>
							</Row>
							<div class="comments-list">
								{#each comments as comment (comment.id)}
									<div class="list-item-wrapper comment-wrapper">
										<BookmarkedCommentCard {comment} />
										<button class="remove-btn" onclick={() => openRemoveModal(comment.id)} title="Remove from list">
											<X size={14} />
										</button>
									</div>
								{/each}
							</div>
						</section>
					{/if}
				</Stack>
			{/if}
		</Stack>
	</Container>
</main>

<!-- Edit Modal -->
<Modal bind:open={showEditModal} title="Edit List">
	<Stack gap={4}>
		<div class="form-group">
			<label for="edit-title">List Name</label>
			<input 
				id="edit-title"
				type="text" 
				bind:value={editTitle} 
				class="input"
			/>
		</div>
		<div class="form-group">
			<label for="edit-description">Description</label>
			<textarea 
				id="edit-description"
				bind:value={editDescription} 
				rows="3"
				class="input textarea"
			></textarea>
		</div>
		<Row gap={3} justify="end">
			<Button variant="ghost" onclick={() => showEditModal = false}>Cancel</Button>
			<Button onclick={handleEdit} disabled={!editTitle.trim() || isEditing}>
				{isEditing ? 'Saving...' : 'Save Changes'}
			</Button>
		</Row>
	</Stack>
</Modal>

<!-- Delete Modal -->
<Modal bind:open={showDeleteModal} title="Delete List">
	<Stack gap={4}>
		<p>Are you sure you want to delete "{list?.title}"? This cannot be undone.</p>
		<Row gap={3} justify="end">
			<Button variant="ghost" onclick={() => showDeleteModal = false}>Cancel</Button>
			<Button variant="primary" onclick={handleDelete} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete List'}
			</Button>
		</Row>
	</Stack>
</Modal>

<!-- Remove Item Modal -->
<Modal bind:open={showRemoveModal} title="Remove Item">
	<Stack gap={4}>
		<p style="color: var(--text-secondary);">Remove this item from the list?</p>
		<Row gap={3} justify="end">
			<Button variant="ghost" onclick={() => showRemoveModal = false}>Cancel</Button>
			<Button variant="primary" onclick={handleConfirmRemove} disabled={isRemoving}>
				{isRemoving ? 'Removing...' : 'Remove'}
			</Button>
		</Row>
	</Stack>
</Modal>

<style>
	/* Page-specific styles only - utilities from pages.css */
	
	.header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	:global(.title-row) {
		margin-top: var(--space-2);
	}

	.list-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	:global(.list-icon) {
		color: var(--primary);
	}

	.list-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.list-description {
		color: var(--text-muted);
		margin: 0;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	:global(.section-header) {
		color: var(--text-secondary);
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.empty-state h3 {
		color: var(--text-primary);
		margin: 0;
	}

	/* Item wrapper with hover reveal */
	.list-item-wrapper {
		position: relative;
	}

	.list-item-wrapper:hover .remove-btn {
		opacity: 1;
	}

	.remove-btn {
		position: absolute;
		top: var(--space-2);
		left: var(--space-2);
	}

	.comment-wrapper .remove-btn {
		top: var(--space-3);
	}

	.icon-btn {
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

	.icon-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}
</style>
