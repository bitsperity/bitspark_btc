<!--
  BookmarkButton - Toggle bookmark on Ideas/Jobs/Comments with list dropdown
  
  Click: Toggle quick bookmark (Kind 10003)
  Hover: Show dropdown with lists + "New List"
-->
<script lang="ts">
	import { bookmarkService, listService } from '$lib/services';
	import { Bookmark, FolderOpen, Plus, Check } from 'lucide-svelte';

	interface Props {
		eventId: string;
		type: 'idea' | 'job' | 'comment';
		size?: 'sm' | 'md';
	}

	let { eventId, type, size = 'md' }: Props = $props();

	// Subscribe to bookmark and list state
	const isBookmarked = bookmarkService.isBookmarked(eventId);
	const lists = listService.subscribeLists();
	const listsContainingItem = listService.getListsContainingItem(eventId);
	
	let isLoading = $state(false);
	let showDropdown = $state(false);
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

	// New list creation
	let showNewListInput = $state(false);
	let newListName = $state('');
	let isCreatingList = $state(false);

	async function handleClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		
		if (isLoading) return;
		
		isLoading = true;
		try {
			await bookmarkService.toggleBookmark(eventId, type);
		} catch (error) {
			console.error('[Bookmark] Toggle failed:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleMouseEnter() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			showDropdown = true;
		}, 200);
	}

	function handleMouseLeave() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			showDropdown = false;
			showNewListInput = false;
			newListName = '';
		}, 150);
	}

	function handleDropdownMouseEnter() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
	}

	function handleDropdownMouseLeave() {
		handleMouseLeave();
	}

	async function toggleListItem(listId: string, isInList: boolean) {
		try {
			if (isInList) {
				await listService.removeFromList(listId, eventId);
			} else {
				await listService.addToList(listId, eventId, type);
			}
		} catch (error) {
			console.error('[Bookmark] List toggle failed:', error);
		}
	}

	async function handleCreateList(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!newListName.trim() || isCreatingList) return;
		
		isCreatingList = true;
		try {
			const list = await listService.createList(newListName.trim());
			// Immediately add item to the new list
			await listService.addToList(list.id, eventId, type);
			newListName = '';
			showNewListInput = false;
		} catch (error) {
			console.error('[Bookmark] Create list failed:', error);
		} finally {
			isCreatingList = false;
		}
	}

	function showNewListForm(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		showNewListInput = true;
	}

	const iconSize = $derived(size === 'sm' ? 14 : 18);
</script>

<div 
	class="bookmark-container"
	class:sm={size === 'sm'}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<button 
		class="bookmark-btn" 
		class:active={$isBookmarked}
		class:loading={isLoading}
		onclick={handleClick}
		title={$isBookmarked ? 'Remove bookmark' : 'Bookmark'}
	>
		<Bookmark size={iconSize} fill={$isBookmarked ? 'currentColor' : 'none'} />
	</button>

	{#if showDropdown}
		<div 
			class="dropdown"
			onmouseenter={handleDropdownMouseEnter}
			onmouseleave={handleDropdownMouseLeave}
		>
			<!-- Quick Bookmark Status -->
			<button class="dropdown-item" onclick={(e) => { e.preventDefault(); handleClick(e); }}>
				<Bookmark size={14} fill={$isBookmarked ? 'currentColor' : 'none'} />
				<span>Quick Bookmark</span>
				{#if $isBookmarked}
					<Check size={12} class="check-icon" />
				{/if}
			</button>

			{#if $lists.length > 0}
				<div class="dropdown-divider"></div>
				
				<!-- Existing Lists -->
				{#each $lists as list (list.id)}
					{@const isInList = $listsContainingItem.some(l => l.id === list.id)}
					<button 
						class="dropdown-item"
						onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleListItem(list.id, isInList); }}
					>
						<FolderOpen size={14} />
						<span class="list-name">{list.title}</span>
						{#if isInList}
							<Check size={12} class="check-icon" />
						{/if}
					</button>
				{/each}
			{/if}

			<div class="dropdown-divider"></div>

			<!-- New List -->
			{#if showNewListInput}
				<form class="new-list-form" onsubmit={handleCreateList}>
					<input 
						type="text"
						bind:value={newListName}
						placeholder="List name..."
						class="new-list-input"
						onclick={(e) => e.stopPropagation()}
					/>
					<button 
						type="submit" 
						class="new-list-submit"
						disabled={!newListName.trim() || isCreatingList}
					>
						{isCreatingList ? '...' : 'Add'}
					</button>
				</form>
			{:else}
				<button class="dropdown-item create-new" onclick={(e) => { e.preventDefault(); showNewListForm(e); }}>
					<Plus size={14} />
					<span>New List...</span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.bookmark-container {
		position: relative;
	}

	.bookmark-btn {
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

	.bookmark-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.bookmark-btn.active {
		color: var(--amber-400);
	}

	.bookmark-btn.active:hover {
		color: var(--amber-300);
	}

	.bookmark-btn.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.bookmark-container.sm .bookmark-btn {
		padding: var(--space-1);
	}

	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		min-width: 180px;
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-2);
		z-index: 100;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 0.8125rem;
		cursor: pointer;
		text-align: left;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.dropdown-item.create-new {
		color: var(--primary);
	}

	.list-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.check-icon) {
		color: var(--success);
		flex-shrink: 0;
	}

	.dropdown-divider {
		height: 1px;
		background: var(--border-subtle);
		margin: var(--space-2) 0;
	}

	.new-list-form {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2);
	}

	.new-list-input {
		flex: 1;
		padding: var(--space-2);
		background: var(--bg-input);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.new-list-input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.new-list-submit {
		padding: var(--space-2) var(--space-3);
		background: var(--primary);
		border: none;
		border-radius: var(--radius-sm);
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}

	.new-list-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
