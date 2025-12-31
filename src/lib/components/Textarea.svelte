<!--
  Textarea Component
  
  Usage:
    <Textarea label="Description" placeholder="Enter description..." rows={4} />
-->
<script lang="ts">
	interface Props {
		label?: string;
		placeholder?: string;
		value?: string;
		error?: string;
		rows?: number;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
		class?: string;
	}

	let {
		label,
		placeholder = '',
		value = $bindable(''),
		error,
		rows = 4,
		disabled = false,
		required = false,
		name,
		id,
		class: className = ''
	}: Props = $props();

	const textareaId = $derived(id || name || label?.toLowerCase().replace(/\s+/g, '-'));
	
	const textareaClasses = $derived(
		['input', error ? 'input-error' : '', className].filter(Boolean).join(' ')
	);
</script>

<div class="input-wrapper">
	{#if label}
		<label class="label" for={textareaId}>{label}</label>
	{/if}
	<textarea
		class={textareaClasses}
		{placeholder}
		{disabled}
		{required}
		{name}
		{rows}
		id={textareaId}
		bind:value
	></textarea>
	{#if error}
		<span class="input-error-text">{error}</span>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	.input-error {
		border-color: var(--error);
	}

	.input-error-text {
		margin-top: var(--space-1);
		font-size: 0.75rem;
		color: var(--error);
	}
</style>
