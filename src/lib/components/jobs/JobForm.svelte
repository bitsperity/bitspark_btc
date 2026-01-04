<!--
  JobForm - Create job form
  
  Only shown to idea owners.
-->
<script lang="ts">
	import { jobService, authService } from '$lib/services';
	import { PROGRAMMING_LANGUAGES, LANGUAGE_LABELS, type CreateJobInput, type ProgrammingLanguage } from '$lib/types/job';
	import { IDEA_CATEGORIES, CATEGORY_LABELS, type IdeaCategory } from '$lib/types/idea';
	import { Card, Stack, Row, Input, Textarea, Button, Spinner } from '$lib/components';
	import { Save, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		ideaId: string;
		oncancel?: () => void;
	}

	let { ideaId, oncancel }: Props = $props();

	let isSubmitting = $state(false);
	let error = $state<string | undefined>(undefined);

	// Form fields
	let title = $state('');
	let requirements = $state('');
	let content = $state('');
	let bannerUrl = $state('');
	let selectedLanguages = $state<string[]>([]);
	let selectedCategories = $state<string[]>([]);

	function toggleLanguage(lang: string) {
		if (selectedLanguages.includes(lang)) {
			selectedLanguages = selectedLanguages.filter(l => l !== lang);
		} else {
			selectedLanguages = [...selectedLanguages, lang];
		}
	}

	function toggleCategory(cat: string) {
		if (selectedCategories.includes(cat)) {
			selectedCategories = selectedCategories.filter(c => c !== cat);
		} else {
			selectedCategories = [...selectedCategories, cat];
		}
	}

	async function handleSubmit() {
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		if (!requirements.trim()) {
			error = 'Requirements are required';
			return;
		}
		if (selectedLanguages.length === 0) {
			error = 'Select at least one language';
			return;
		}

		isSubmitting = true;
		error = undefined;

		try {
			const input: CreateJobInput = {
				title: title.trim(),
				requirements: requirements.trim(),
				content: content.trim(),
				bannerUrl: bannerUrl.trim() || undefined,
				languages: selectedLanguages,
				categories: selectedCategories,
				ideaId
			};

			const event = await jobService.createJob(input);
			goto(`/jobs/${event.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create job';
			console.error('[JobForm] Error:', e);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<Stack gap={5}>
			<Row justify="between">
				<h3 class="text-display-sm">Create Job</h3>
				{#if oncancel}
					<Button variant="ghost" type="button" onclick={oncancel}>
						<X size={16} />
					</Button>
				{/if}
			</Row>

			<Input 
				label="Job Title *" 
				placeholder="Frontend Developer needed"
				bind:value={title}
			/>

			<Textarea 
				label="Description (what this job is about)"
				placeholder="We need a developer to implement the authentication flow. This includes..."
				rows={6}
				bind:value={content}
			/>

			<Textarea 
				label="Definition of Done * (acceptance criteria)"
				placeholder="- [ ] User can login via NIP-07
- [ ] Profile page displays all fields
- [ ] Tests pass with 80% coverage"
				rows={4}
				bind:value={requirements}
			/>

			<Input 
				label="Banner Image URL" 
				placeholder="https://example.com/banner.jpg"
				bind:value={bannerUrl}
			/>

			<!-- Languages -->
			<div class="selector-field">
				<label class="field-label">Programming Languages *</label>
				<div class="chip-selector">
					{#each PROGRAMMING_LANGUAGES as lang}
						<button
							type="button"
							class="chip"
							class:selected={selectedLanguages.includes(lang)}
							onclick={() => toggleLanguage(lang)}
						>
							{LANGUAGE_LABELS[lang]}
						</button>
					{/each}
				</div>
			</div>

			<!-- Categories -->
			<div class="selector-field">
				<label class="field-label">Categories</label>
				<div class="chip-selector">
					{#each IDEA_CATEGORIES as cat}
						<button
							type="button"
							class="chip"
							class:selected={selectedCategories.includes(cat)}
							onclick={() => toggleCategory(cat)}
						>
							{CATEGORY_LABELS[cat]}
						</button>
					{/each}
				</div>
			</div>

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
					<span>{isSubmitting ? 'Creating...' : 'Create Job'}</span>
				</Button>
			</Row>
		</Stack>
	</form>
</Card>

<style>
	.field-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: var(--space-2);
	}

	.selector-field {
		display: flex;
		flex-direction: column;
	}

	.chip-selector {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chip {
		padding: var(--space-2) var(--space-3);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.8125rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.chip:hover {
		background: var(--bg-elevated);
	}

	.chip.selected {
		background: var(--blue-500);
		border-color: var(--blue-500);
		color: white;
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error);
	}
</style>
