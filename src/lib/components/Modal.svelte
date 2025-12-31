<!--
  Modal Component - Dialog overlay
  
  Usage:
    <Modal bind:open title="Confirm Action">
      <p>Are you sure?</p>
      {#snippet footer()}
        <Button onclick={() => open = false}>Cancel</Button>
        <Button variant="primary">Confirm</Button>
      {/snippet}
    </Modal>
-->
<script lang="ts">
	import { X } from 'lucide-svelte';
	import Button from './Button.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		class?: string;
		children: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		title = '',
		class: className = '',
		children,
		footer,
		onclose
	}: Props = $props();

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick}>
		<div class="modal {className}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<header class="modal-header">
				{#if title}
					<h2 id="modal-title" class="modal-title">{title}</h2>
				{/if}
				<Button variant="ghost" icon onclick={handleClose}>
					<X size={18} />
				</Button>
			</header>
			<div class="modal-body">
				{@render children()}
			</div>
			{#if footer}
				<footer class="modal-footer">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		animation: fade-in 150ms ease-out;
	}

	.modal {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-glass-strong);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-xl);
		animation: scale-in 200ms var(--ease-out);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.modal-body {
		padding: var(--space-6);
		overflow-y: auto;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scale-in {
		from { 
			opacity: 0;
			transform: scale(0.95);
		}
		to { 
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
