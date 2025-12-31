<!--
  IdeaForm - Create/Edit idea form
-->
<script lang="ts">
	import { authService, ideaService } from '$lib/services';
	import { IDEA_CATEGORIES, type CreateIdeaInput } from '$lib/types/idea';
	import { Card, Stack, Row, Input, Textarea, Button, Badge, Spinner } from '$lib/components';
	import MarkdownRenderer from '../MarkdownRenderer.svelte';
	import { Save, Eye, EyeOff } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let isSubmitting = $state(false);
	let error = $state<string | undefined>(undefined);
	let showPreview = $state(false);

	// Form fields
	let title = $state('');
	let summary = $state('');
	let content = $state('');
	let bannerUrl = $state('');
	let githubRepo = $state('');
	let lnAddress = $state('');
	let selectedCategories = $state<string[]>([]);

	function toggleCategory(category: string) {
		if (selectedCategories.includes(category)) {
			selectedCategories = selectedCategories.filter(c => c !== category);
		} else {
			selectedCategories = [...selectedCategories, category];
		}
	}

	async function handleSubmit() {
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		if (!summary.trim()) {
			error = 'Summary is required';
			return;
		}
		if (!content.trim()) {
			error = 'Description is required';
			return;
		}

		isSubmitting = true;
		error = undefined;

		try {
			const input: CreateIdeaInput = {
				title: title.trim(),
				summary: summary.trim(),
				content: content.trim(),
				bannerUrl: bannerUrl.trim() || undefined,
				githubRepo: githubRepo.trim() || undefined,
				lnAddress: lnAddress.trim() || undefined,
				categories: selectedCategories
			};

			const event = await ideaService.createIdea(input);
			
			// Navigate to the new idea
			goto(`/ideas/${event.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create idea';
			console.error('[IdeaForm] Error:', e);
		} finally {
			isSubmitting = false;
		}
	}

	const categoryLabels: Record<string, string> = {
		defi: '💰 DeFi',
		gaming: '🎮 Gaming',
		social: '💬 Social',
		tools: '🔧 Tools',
		infrastructure: '🏗️ Infrastructure',
		other: '📦 Other'
	};
</script>

<Card>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<Stack gap={6}>
			<Row justify="between">
				<h2 class="text-display-md">Create Idea</h2>
				<Button 
					variant="ghost" 
					type="button"
					onclick={() => showPreview = !showPreview}
				>
					{#if showPreview}
						<EyeOff size={16} />
						<span>Edit</span>
					{:else}
						<Eye size={16} />
						<span>Preview</span>
					{/if}
				</Button>
			</Row>

			{#if showPreview}
				<!-- Preview Mode -->
				<div class="preview">
					<h1 class="preview-title">{title || 'Untitled'}</h1>
					<p class="preview-summary">{summary || 'No summary'}</p>
					<MarkdownRenderer content={content || '*No description yet*'} />
				</div>
			{:else}
				<!-- Edit Mode -->
				<Input 
					label="Title *" 
					placeholder="My Amazing Project"
					bind:value={title}
				/>

				<Textarea 
					label="Summary *"
					placeholder="A brief one-liner about your idea..."
					rows={2}
					bind:value={summary}
				/>

				<div class="content-field">
					<label class="field-label">Description * (Markdown supported)</label>
					<textarea 
						class="markdown-editor"
						placeholder="Describe your idea in detail...

## Features
- Feature 1
- Feature 2

## Technical Stack
Use **Markdown** for formatting!"
						rows={12}
						bind:value={content}
					></textarea>
				</div>

				<div class="form-grid">
					<Input 
						label="Banner Image URL" 
						placeholder="https://example.com/banner.jpg"
						bind:value={bannerUrl}
					/>
					<Input 
						label="GitHub Repository" 
						placeholder="https://github.com/user/repo"
						bind:value={githubRepo}
					/>
				</div>

				<Input 
					label="Lightning Address (for tips)" 
					placeholder="you@getalby.com"
					bind:value={lnAddress}
				/>

				<!-- Categories -->
				<div class="categories-field">
					<label class="field-label">Categories</label>
					<div class="category-selector">
						{#each IDEA_CATEGORIES as category}
							<button
								type="button"
								class="category-chip"
								class:selected={selectedCategories.includes(category)}
								onclick={() => toggleCategory(category)}
							>
								{categoryLabels[category]}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<Row justify="end" gap={3}>
				{#if error}
					<span class="error-message">{error}</span>
				{/if}
				<Button variant="primary" type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Spinner size="sm" />
					{:else}
						<Save size={16} />
					{/if}
					<span>{isSubmitting ? 'Publishing...' : 'Publish Idea'}</span>
				</Button>
			</Row>
		</Stack>
	</form>
</Card>

<style>
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}

	.field-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: var(--space-2);
	}

	.content-field {
		display: flex;
		flex-direction: column;
	}

	.markdown-editor {
		width: 100%;
		padding: var(--space-4);
		background: var(--bg-input);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--text-primary);
		resize: vertical;
		line-height: 1.6;
	}

	.markdown-editor:focus {
		outline: none;
		border-color: var(--orange-500);
	}

	.categories-field {
		display: flex;
		flex-direction: column;
	}

	.category-selector {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.category-chip {
		padding: var(--space-2) var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.category-chip:hover {
		background: var(--bg-elevated);
	}

	.category-chip.selected {
		background: var(--orange-500);
		border-color: var(--orange-500);
		color: white;
	}

	.preview {
		padding: var(--space-6);
		background: rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.preview-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: var(--space-2);
	}

	.preview-summary {
		font-size: 1.125rem;
		color: var(--text-muted);
		margin-bottom: var(--space-6);
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error);
	}
</style>
