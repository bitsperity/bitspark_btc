<!--
  Select Component - Dropdown select
  
  Usage:
    <Select 
      label="Category"
      options={[
        { value: 'dev', label: 'Development' },
        { value: 'design', label: 'Design' }
      ]}
      bind:value
    />
-->
<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		label?: string;
		options: Option[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		error?: string;
		name?: string;
		class?: string;
	}

	let {
		label,
		options,
		value = $bindable(''),
		placeholder = 'Select...',
		disabled = false,
		error,
		name,
		class: className = ''
	}: Props = $props();

	const selectId = $derived(name || label?.toLowerCase().replace(/\s+/g, '-'));
</script>

<div class="select-wrapper {className}">
	{#if label}
		<label class="label" for={selectId}>{label}</label>
	{/if}
	<div class="select-container">
		<select
			id={selectId}
			class="select"
			class:error
			{name}
			{disabled}
			bind:value
		>
			{#if placeholder}
				<option value="" disabled>{placeholder}</option>
			{/if}
			{#each options as option}
				<option value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			{/each}
		</select>
		<ChevronDown size={16} class="select-icon" />
	</div>
	{#if error}
		<span class="error-text">{error}</span>
	{/if}
</div>

<style>
	.select-wrapper {
		display: flex;
		flex-direction: column;
	}

	.select-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.select {
		width: 100%;
		padding: var(--space-3) var(--space-10) var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: 1rem;
		color: var(--text-primary);
		background: var(--bg-glass);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		cursor: pointer;
		appearance: none;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.select:focus {
		outline: none;
		border-color: var(--orange-500);
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
	}

	.select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.select.error {
		border-color: var(--error);
	}

	.select-container :global(.select-icon) {
		position: absolute;
		right: var(--space-3);
		color: var(--text-muted);
		pointer-events: none;
	}

	.error-text {
		margin-top: var(--space-1);
		font-size: 0.75rem;
		color: var(--error);
	}
</style>
