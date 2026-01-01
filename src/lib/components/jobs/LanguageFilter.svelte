<!--
  LanguageFilter - Horizontal language chip filter
-->
<script lang="ts">
	import { PROGRAMMING_LANGUAGES, LANGUAGE_LABELS } from '$lib/types/job';

	interface Props {
		selected?: string;
		onchange?: (language: string | undefined) => void;
	}

	let { selected, onchange }: Props = $props();

	function handleClick(language: string | undefined) {
		onchange?.(language);
	}
</script>

<div class="language-filter">
	<button 
		class="language-chip" 
		class:active={!selected}
		onclick={() => handleClick(undefined)}
	>
		All
	</button>
	{#each PROGRAMMING_LANGUAGES as lang}
		<button 
			class="language-chip" 
			class:active={selected === lang}
			onclick={() => handleClick(lang)}
		>
			{LANGUAGE_LABELS[lang]}
		</button>
	{/each}
</div>

<style>
	.language-filter {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		padding: var(--space-2) 0;
	}

	.language-chip {
		padding: var(--space-2) var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.language-chip:hover {
		background: var(--bg-elevated);
		color: var(--text-secondary);
	}

	.language-chip.active {
		background: var(--blue-500);
		border-color: var(--blue-500);
		color: white;
	}
</style>
