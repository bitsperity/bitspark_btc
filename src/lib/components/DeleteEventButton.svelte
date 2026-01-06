<!--
  DeleteEventButton - Reusable delete button with confirmation modal
  
  Features:
  - Only renders if user is event owner (pubkey check)
  - Built-in confirmation modal
  - Loading state during deletion
  - Multiple variants: icon, text, icon-text
  
  Usage:
    <DeleteEventButton 
      eventId={list.id}
      eventPubkey={list.pubkey}
      onDelete={async () => await listService.deleteList(list.id)}
      confirmTitle="Delete List?"
      confirmMessage="This cannot be undone."
    />
-->
<script lang="ts">
	import { X, Trash2 } from 'lucide-svelte';
	import { authService } from '$lib/services';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import Stack from './Stack.svelte';
	import Row from './Row.svelte';

	interface Props {
		eventId: string;
		eventPubkey?: string; // If not provided, always show (for lists where owner is implicit)
		onDelete: () => Promise<void>;
		confirmTitle?: string;
		confirmMessage?: string;
		variant?: 'icon' | 'text' | 'icon-text';
		size?: 'sm' | 'md';
		class?: string;
	}

	let {
		eventId,
		eventPubkey,
		onDelete,
		confirmTitle = 'Delete?',
		confirmMessage = 'This action cannot be undone.',
		variant = 'icon',
		size = 'sm',
		class: className = ''
	}: Props = $props();

	let showModal = $state(false);
	let isDeleting = $state(false);

	// Check if current user is the owner
	const isOwner = $derived(
		eventPubkey === undefined || authService.user?.pubkey === eventPubkey
	);

	function openModal(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		showModal = true;
	}

	async function handleConfirm() {
		isDeleting = true;
		try {
			await onDelete();
			showModal = false;
		} catch (error) {
			console.error('[DeleteEventButton] Delete failed:', error);
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if isOwner}
	{#if variant === 'icon'}
		<button 
			class="delete-icon-btn {className}" 
			onclick={openModal}
			title="Delete"
		>
			<X size={size === 'sm' ? 14 : 18} />
		</button>
	{:else if variant === 'text'}
		<Button variant="ghost" {size} onclick={openModal} class={className}>
			Delete
		</Button>
	{:else}
		<Button variant="ghost" {size} onclick={openModal} class={className}>
			<Trash2 size={size === 'sm' ? 14 : 18} />
			Delete
		</Button>
	{/if}
{/if}

<Modal bind:open={showModal} title={confirmTitle}>
	<Stack gap={4}>
		<p class="confirm-message">{confirmMessage}</p>
		<Row gap={3} justify="end">
			<Button variant="ghost" onclick={() => showModal = false}>Cancel</Button>
			<Button variant="primary" onclick={handleConfirm} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</Button>
		</Row>
	</Stack>
</Modal>

<style>
	.delete-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0;
		transition: all var(--duration-fast) var(--ease-out);
		z-index: 10;
	}

	.delete-icon-btn:hover {
		background: rgba(220, 38, 38, 0.8);
		border-color: rgba(220, 38, 38, 0.5);
		color: white;
		transform: scale(1.1);
	}

	/* Parent hover reveals the button */
	:global(.hover-reveal:hover) .delete-icon-btn,
	:global(.list-item-wrapper:hover) .delete-icon-btn,
	:global(.card-wrapper:hover) .delete-icon-btn {
		opacity: 1;
	}

	.confirm-message {
		color: var(--text-secondary);
		margin: 0;
	}
</style>
