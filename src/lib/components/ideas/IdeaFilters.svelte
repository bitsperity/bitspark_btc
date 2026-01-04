<!--
  IdeaFilters - Search, category filter tabs, and sort dropdown
-->
<script lang="ts">
	import { Row, Stack } from '$lib/components';
	import { Search, ChevronDown } from 'lucide-svelte';
	import { IDEA_CATEGORIES, CATEGORY_LABELS, type IdeaCategory } from '$lib/types/idea';
	import type { IdeaFilterOptions } from '$lib/stores';

	interface Props {
		filters: IdeaFilterOptions;
		onFilterChange: (key: keyof IdeaFilterOptions, value: any) => void;
	}

	let { filters, onFilterChange }: Props = $props();

	// Local search input with debounce
	let searchInput = $state(filters.search);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchInput = target.value;
		
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			onFilterChange('search', searchInput);
		}, 300);
	}

	function handleCategoryClick(category: string | null) {
		onFilterChange('category', category);
	}

	function handleSortChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onFilterChange('sortBy', target.value);
	}

	// All categories for tabs
	const allCategories = ['all', ...IDEA_CATEGORIES] as const;
</script>

<div class="idea-filters">
	<Stack gap={4}>
		<!-- Search Bar Row -->
		<Row gap={3} class="search-row">
			<div class="search-wrapper">
				<Search size={18} class="search-icon" />
				<input
					type="text"
					placeholder="Search ideas..."
					value={searchInput}
					oninput={handleSearchInput}
					class="search-input"
				/>
			</div>
			
			<div class="sort-wrapper">
				<select value={filters.sortBy} onchange={handleSortChange} class="sort-select">
					<option value="newest">Newest</option>
					<option value="mostJobs">Most Jobs</option>
					<option value="highestBounty">Highest Bounty</option>
				</select>
				<ChevronDown size={16} class="sort-icon" />
			</div>
		</Row>

		<!-- Category Tabs -->
		<div class="category-tabs">
			{#each allCategories as cat}
				<button
					class="category-tab"
					class:active={cat === 'all' ? filters.category === null : filters.category === cat}
					onclick={() => handleCategoryClick(cat === 'all' ? null : cat)}
				>
					{cat === 'all' ? '🏷️ All' : CATEGORY_LABELS[cat as IdeaCategory]}
				</button>
			{/each}
		</div>
	</Stack>
</div>

<style>
	.idea-filters {
		margin-bottom: var(--space-6);
	}

	:global(.search-row) {
		flex-wrap: wrap;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
		min-width: 200px;
	}

	:global(.search-icon) {
		position: absolute;
		left: var(--space-3);
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		pointer-events: none;
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

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.search-input:focus {
		border-color: var(--primary);
	}

	.sort-wrapper {
		position: relative;
		min-width: 150px;
	}

	.sort-select {
		width: 100%;
		padding: var(--space-3) var(--space-8) var(--space-3) var(--space-3);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-size: 0.875rem;
		cursor: pointer;
		appearance: none;
		outline: none;
	}

	:global(.sort-icon) {
		position: absolute;
		right: var(--space-3);
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		pointer-events: none;
	}

	.category-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.category-tab {
		padding: var(--space-2) var(--space-3);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
		white-space: nowrap;
	}

	.category-tab:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.category-tab.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	@media (max-width: 640px) {
		.category-tabs {
			overflow-x: auto;
			flex-wrap: nowrap;
			padding-bottom: var(--space-2);
			-webkit-overflow-scrolling: touch;
		}
	}
</style>
