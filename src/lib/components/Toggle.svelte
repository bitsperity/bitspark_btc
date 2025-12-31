<!--
  Toggle Component - Boolean switch
  
  Usage:
    <Toggle bind:checked label="Enable notifications" />
-->
<script lang="ts">
	interface Props {
		checked?: boolean;
		label?: string;
		disabled?: boolean;
		name?: string;
		class?: string;
	}

	let {
		checked = $bindable(false),
		label,
		disabled = false,
		name,
		class: className = ''
	}: Props = $props();

	const toggleId = $derived(name || label?.toLowerCase().replace(/\s+/g, '-') || 'toggle');
</script>

<label class="toggle-wrapper {className}" class:disabled>
	<input
		type="checkbox"
		class="toggle-input"
		id={toggleId}
		{name}
		{disabled}
		bind:checked
	/>
	<span class="toggle-track">
		<span class="toggle-thumb"></span>
	</span>
	{#if label}
		<span class="toggle-label">{label}</span>
	{/if}
</label>

<style>
	.toggle-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		cursor: pointer;
	}

	.toggle-wrapper.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toggle-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-track {
		position: relative;
		width: 44px;
		height: 24px;
		background: var(--space-600);
		border-radius: var(--radius-full);
		transition: background var(--duration-fast) var(--ease-out);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: transform var(--duration-fast) var(--ease-spring);
	}

	.toggle-input:checked + .toggle-track {
		background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
	}

	.toggle-input:checked + .toggle-track .toggle-thumb {
		transform: translateX(20px);
	}

	.toggle-input:focus-visible + .toggle-track {
		outline: 2px solid var(--orange-400);
		outline-offset: 2px;
	}

	.toggle-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
</style>
