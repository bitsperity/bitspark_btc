<!--
  Input Component
  
  Usage:
    <Input label="Email" type="email" placeholder="Enter email..." />
    <Input label="Amount" type="number" error="Invalid amount" />
-->
<script lang="ts">
	import type { InputType } from '$lib/types';

	interface Props {
		label?: string;
		type?: InputType;
		placeholder?: string;
		value?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
		class?: string;
	}

	let {
		label,
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		error,
		disabled = false,
		required = false,
		name,
		id,
		class: className = ''
	}: Props = $props();

	const inputId = $derived(id || name || label?.toLowerCase().replace(/\s+/g, '-'));
	
	const inputClasses = $derived(
		['input', error ? 'input-error' : '', className].filter(Boolean).join(' ')
	);
</script>

<div class="input-wrapper">
	{#if label}
		<label class="label" for={inputId}>{label}</label>
	{/if}
	<input
		class={inputClasses}
		{type}
		{placeholder}
		{disabled}
		{required}
		{name}
		id={inputId}
		bind:value
	/>
	{#if error}
		<span class="input-error-text">{error}</span>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
	}

	.input-error {
		border-color: var(--error);
	}

	.input-error:focus {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	.input-error-text {
		margin-top: var(--space-1);
		font-size: 0.75rem;
		color: var(--error);
	}
</style>
