<!--
  Lists Page - Manage user's bookmark lists
  
  Full CRUD: create, edit, delete lists
-->
<script lang="ts">
	import { Container, Stack, Row, Button, Modal, AuroraBackground } from '$lib/components';
	import { ListCard } from '$lib/components/lists';
	import { listService, authService } from '$lib/services';
	import { goto } from '$app/navigation';
	import { Plus, FolderOpen } from 'lucide-svelte';

	// Get lists
	const lists = listService.subscribeLists();
	const isLoading = listService.subscribeLoading();

	// Check if logged in
	const isLoggedIn = $derived(authService.user !== undefined);

	// Create list modal
	let showCreateModal = $state(false);
	let newListTitle = $state('');
	let newListDescription = $state('');
	let isCreating = $state(false);

	async function handleCreateList() {
		if (!newListTitle.trim()) return;
		
		isCreating = true;
		try {
			const list = await listService.createList(newListTitle.trim(), newListDescription.trim() || undefined);
			showCreateModal = false;
			newListTitle = '';
			newListDescription = '';
			// Navigate to new list
			goto(`/lists/${list.id}`);
		} catch (error) {
			console.error('[Lists] Failed to create list:', error);
		} finally {
			isCreating = false;
		}
	}

	function openCreateModal() {
		newListTitle = '';
		newListDescription = '';
		showCreateModal = true;
	}

	async function handleDeleteList(listId: string) {
		if (confirm('Are you sure you want to delete this list?')) {
			try {
				await listService.deleteList(listId);
			} catch (error) {
				console.error('[Lists] Failed to delete list:', error);
			}
		}
	}
</script>

<svelte:head>
	<title>My Lists | BitSpark</title>
</svelte:head>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<!-- Header -->
			<Row justify="between" align="center" class="header">
				<Row gap={3}>
					<FolderOpen size={28} class="header-icon" />
					<h1 class="page-title">My Lists</h1>
				</Row>
				{#if isLoggedIn}
					<Button onclick={openCreateModal}>
						<Plus size={16} />
						New List
					</Button>
				{/if}
			</Row>

			<!-- Content -->
			{#if !isLoggedIn}
				<div class="empty-state">
					<FolderOpen size={48} />
					<p>Log in to create and manage lists</p>
				</div>
			{:else if $isLoading}
				<div class="loading">Loading lists...</div>
			{:else if $lists.length === 0}
				<div class="empty-state">
					<FolderOpen size={48} />
					<h3>No lists yet</h3>
					<p>Create your first list to organize your favorite ideas, jobs, and comments.</p>
					<Button onclick={openCreateModal}>
						<Plus size={16} />
						Create Your First List
					</Button>
				</div>
			{:else}
				<div class="lists-grid">
					{#each $lists as list (list.id)}
						<ListCard {list} ondelete={handleDeleteList} />
					{/each}
				</div>
			{/if}
		</Stack>
	</Container>
</main>

<!-- Create List Modal -->
<Modal bind:open={showCreateModal} title="Create New List">
	<Stack gap={4}>
		<div class="form-group">
			<label for="list-title">List Name</label>
			<input 
				id="list-title"
				type="text" 
				bind:value={newListTitle} 
				placeholder="e.g., AI/ML Ideas"
				class="input"
			/>
		</div>
		<div class="form-group">
			<label for="list-description">Description (optional)</label>
			<textarea 
				id="list-description"
				bind:value={newListDescription} 
				placeholder="What's this list for?"
				rows="3"
				class="input textarea"
			></textarea>
		</div>
		<Row gap={3} justify="end">
			<Button variant="ghost" onclick={() => showCreateModal = false}>Cancel</Button>
			<Button onclick={handleCreateList} disabled={!newListTitle.trim() || isCreating}>
				{isCreating ? 'Creating...' : 'Create List'}
			</Button>
		</Row>
	</Stack>
</Modal>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	:global(.header) {
		margin-bottom: var(--space-4);
	}

	:global(.header-icon) {
		color: var(--primary);
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.lists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
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

	.empty-state h3 {
		color: var(--text-primary);
		margin: 0;
	}

	.empty-state p {
		max-width: 400px;
		margin: 0;
	}

	.loading {
		text-align: center;
		padding: var(--space-8);
		color: var(--text-muted);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.input {
		padding: var(--space-3);
		background: var(--bg-input);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.textarea {
		resize: vertical;
		min-height: 80px;
	}
</style>
