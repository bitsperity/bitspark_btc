<!--
  Messages Page - DM Conversations
  
  Two-panel layout:
  - Left: Conversation list
  - Right: Active chat
-->
<script lang="ts">
	import { Container, Stack, Row, Card, Avatar, AuroraBackground } from '$lib/components';
	import { dmService, conversations, totalUnread, authService, profileService } from '$lib/services';
	import type { Conversation, DMMessage } from '$lib/services';
	import { MessageCircle, Send, Plus, ArrowLeft, User } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	// Active conversation
	let activeConvoPubkey = $state<string | null>(null);
	let activeConvo = $derived($conversations.find(c => c.participantPubkey === activeConvoPubkey));

	// New message input
	let messageInput = $state('');
	let isSending = $state(false);

	// New conversation modal
	let showNewConvo = $state(false);
	let newRecipientNpub = $state('');
	let newRecipientError = $state('');

	// Mobile view state
	let showChatOnMobile = $state(false);

	// Initialize DM service and handle ?start param
	onMount(() => {
		dmService.init();
		
		// Check for ?start param (from profile page)
		const startPubkey = $page.url.searchParams.get('start');
		if (startPubkey) {
			activeConvoPubkey = startPubkey;
			showChatOnMobile = true;
			// Clean URL
			goto('/messages', { replaceState: true });
		}
	});

	// Select conversation
	function selectConversation(pubkey: string) {
		activeConvoPubkey = pubkey;
		dmService.markAsRead(pubkey);
		showChatOnMobile = true;
	}

	// Back to list (mobile)
	function backToList() {
		showChatOnMobile = false;
		activeConvoPubkey = null;
	}

	// Send message
	async function sendMessage() {
		if (!activeConvoPubkey || !messageInput.trim() || isSending) return;

		isSending = true;
		try {
			await dmService.sendDM(activeConvoPubkey, messageInput.trim());
			messageInput = '';
		} catch (error) {
			console.error('[Messages] Send failed:', error);
		} finally {
			isSending = false;
		}
	}

	// Handle enter key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	// Start new conversation
	async function startNewConversation() {
		newRecipientError = '';
		
		if (!newRecipientNpub.trim()) {
			newRecipientError = 'Enter a pubkey or npub';
			return;
		}

		try {
			let pubkey = newRecipientNpub.trim();
			
			// Convert npub to hex if needed
			if (pubkey.startsWith('npub')) {
				const { nip19 } = await import('nostr-tools');
				const decoded = nip19.decode(pubkey);
				if (decoded.type === 'npub') {
					pubkey = decoded.data;
				}
			}

			// Validate hex pubkey
			if (!/^[0-9a-f]{64}$/i.test(pubkey)) {
				newRecipientError = 'Invalid pubkey format';
				return;
			}

			activeConvoPubkey = pubkey;
			showNewConvo = false;
			showChatOnMobile = true;
			newRecipientNpub = '';
		} catch (error) {
			newRecipientError = 'Failed to parse pubkey';
		}
	}

	// Format time
	function formatTime(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();
		
		if (isToday) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}

	// Get display name
	function getDisplayName(profile?: NDKUserProfile, pubkey?: string): string {
		if (profile?.name) return profile.name;
		if (profile?.displayName) return profile.displayName;
		if (pubkey) return pubkey.slice(0, 8) + '...';
		return 'Unknown';
	}
</script>

<svelte:head>
	<title>Messages | BitSpark</title>
</svelte:head>

<AuroraBackground />

<main class="messages-page">
	<div class="messages-container">
		<!-- Conversation List -->
		<aside class="conversation-list" class:hidden-mobile={showChatOnMobile}>
			<header class="list-header">
				<Row justify="between" align="center">
					<h1>Messages</h1>
					<button class="new-btn" onclick={() => showNewConvo = true} title="New conversation">
						<Plus size={20} />
					</button>
				</Row>
			</header>

			{#if $conversations.length === 0}
				<div class="empty-state">
					<MessageCircle size={48} />
					<p>No messages yet</p>
					<button class="start-btn" onclick={() => showNewConvo = true}>
						Start a conversation
					</button>
				</div>
			{:else}
				<div class="conversations">
					{#each $conversations as convo (convo.participantPubkey)}
						<button 
							class="convo-item" 
							class:active={convo.participantPubkey === activeConvoPubkey}
							onclick={() => selectConversation(convo.participantPubkey)}
						>
							<Avatar 
								src={convo.participantProfile?.image ?? convo.participantProfile?.picture} 
								fallback={getDisplayName(convo.participantProfile, convo.participantPubkey)[0]} 
								size="md" 
							/>
							<div class="convo-info">
								<Row justify="between">
									<span class="convo-name">{getDisplayName(convo.participantProfile, convo.participantPubkey)}</span>
									{#if convo.lastMessage}
										<span class="convo-time">{formatTime(convo.lastMessage.createdAt)}</span>
									{/if}
								</Row>
								<Row justify="between">
									<span class="convo-preview">
										{#if convo.lastMessage}
											{convo.lastMessage.isMe ? 'You: ' : ''}{convo.lastMessage.content.slice(0, 30)}{convo.lastMessage.content.length > 30 ? '...' : ''}
										{:else}
											No messages
										{/if}
									</span>
									{#if convo.unreadCount > 0}
										<span class="unread-badge">{convo.unreadCount}</span>
									{/if}
								</Row>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</aside>

		<!-- Chat View -->
		<section class="chat-view" class:hidden-mobile={!showChatOnMobile}>
			{#if activeConvo || activeConvoPubkey}
				<header class="chat-header">
					<button class="back-btn mobile-only" onclick={backToList}>
						<ArrowLeft size={20} />
					</button>
					<Avatar 
						src={activeConvo?.participantProfile?.image ?? activeConvo?.participantProfile?.picture} 
						fallback={getDisplayName(activeConvo?.participantProfile, activeConvoPubkey ?? undefined)[0]} 
						size="sm" 
					/>
					<span class="chat-name">{getDisplayName(activeConvo?.participantProfile, activeConvoPubkey ?? undefined)}</span>
				</header>

				<div class="messages-scroll">
					{#if activeConvo?.messages.length}
						{#each activeConvo.messages as message (message.id)}
							<div class="message" class:mine={message.isMe}>
								<div class="message-bubble">
									{message.content}
								</div>
								<span class="message-time">{formatTime(message.createdAt)}</span>
							</div>
						{/each}
					{:else}
						<div class="no-messages">
							<p>Start the conversation</p>
						</div>
					{/if}
				</div>

				<footer class="chat-input">
					<input 
						type="text" 
						placeholder="Type a message..." 
						bind:value={messageInput}
						onkeydown={handleKeydown}
						disabled={isSending}
					/>
					<button 
						class="send-btn" 
						onclick={sendMessage}
						disabled={!messageInput.trim() || isSending}
					>
						<Send size={18} />
					</button>
				</footer>
			{:else}
				<div class="no-chat-selected">
					<MessageCircle size={64} />
					<h2>Select a conversation</h2>
					<p>Choose from your existing conversations or start a new one</p>
				</div>
			{/if}
		</section>
	</div>
</main>

<!-- New Conversation Modal -->
{#if showNewConvo}
	<div class="modal-overlay" onclick={() => showNewConvo = false}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>New Conversation</h2>
			<Stack gap={4}>
				<div class="form-group">
					<label for="recipient">Recipient (npub or hex pubkey)</label>
					<input 
						id="recipient"
						type="text" 
						placeholder="npub1... or hex pubkey"
						bind:value={newRecipientNpub}
						class:error={newRecipientError}
					/>
					{#if newRecipientError}
						<span class="error-text">{newRecipientError}</span>
					{/if}
				</div>
				<Row justify="end" gap={2}>
					<button class="btn-secondary" onclick={() => showNewConvo = false}>Cancel</button>
					<button class="btn-primary" onclick={startNewConversation}>Start Chat</button>
				</Row>
			</Stack>
		</div>
	</div>
{/if}

<style>
	.messages-page {
		min-height: 100vh;
		padding-top: 80px;
	}

	.messages-container {
		display: grid;
		grid-template-columns: 350px 1fr;
		height: calc(100vh - 80px);
		max-width: 1400px;
		margin: 0 auto;
		background: var(--bg-glass);
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
	}

	/* Conversation List */
	.conversation-list {
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.2);
	}

	.list-header {
		padding: var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
	}

	.list-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.new-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--primary);
		border: none;
		border-radius: var(--radius-md);
		color: white;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.new-btn:hover {
		background: var(--primary-hover);
		transform: scale(1.05);
	}

	.conversations {
		flex: 1;
		overflow-y: auto;
	}

	.convo-item {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		width: 100%;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-subtle);
		cursor: pointer;
		text-align: left;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.convo-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.convo-item.active {
		background: rgba(255, 255, 255, 0.1);
	}

	.convo-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.convo-name {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.convo-time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.convo-preview {
		font-size: 0.8rem;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.unread-badge {
		background: var(--primary);
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 10px;
		min-width: 18px;
		text-align: center;
	}

	/* Chat View */
	.chat-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
		background: rgba(0, 0, 0, 0.1);
	}

	.chat-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.messages-scroll {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.message {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: 70%;
	}

	.message.mine {
		align-self: flex-end;
		align-items: flex-end;
	}

	.message-bubble {
		padding: var(--space-3) var(--space-4);
		background: rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		border-bottom-left-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.message.mine .message-bubble {
		background: var(--primary);
		border-bottom-left-radius: var(--radius-lg);
		border-bottom-right-radius: var(--radius-sm);
	}

	.message-time {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: var(--space-1);
	}

	.chat-input {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-4);
		border-top: 1px solid var(--border-subtle);
		background: rgba(0, 0, 0, 0.1);
	}

	.chat-input input {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.chat-input input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: var(--primary);
		border: none;
		border-radius: var(--radius-md);
		color: white;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.send-btn:hover:not(:disabled) {
		background: var(--primary-hover);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Empty States */
	.empty-state, .no-chat-selected, .no-messages {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-8);
		color: var(--text-muted);
		text-align: center;
		height: 100%;
	}

	.start-btn {
		padding: var(--space-2) var(--space-4);
		background: var(--primary);
		border: none;
		border-radius: var(--radius-md);
		color: white;
		cursor: pointer;
		font-size: 0.9rem;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--bg-glass);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		width: 90%;
		max-width: 400px;
	}

	.modal h2 {
		margin: 0 0 var(--space-4);
		font-size: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-group label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.form-group input {
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-primary);
	}

	.form-group input.error {
		border-color: #ef4444;
	}

	.error-text {
		color: #ef4444;
		font-size: 0.8rem;
	}

	.btn-primary {
		padding: var(--space-2) var(--space-4);
		background: var(--primary);
		border: none;
		border-radius: var(--radius-md);
		color: white;
		cursor: pointer;
	}

	.btn-secondary {
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
	}

	/* Mobile */
	.back-btn {
		display: none;
		background: transparent;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 768px) {
		.messages-container {
			grid-template-columns: 1fr;
		}

		.conversation-list {
			position: absolute;
			inset: 0;
			top: 80px;
			background: var(--bg-glass);
			z-index: 10;
		}

		.chat-view {
			position: absolute;
			inset: 0;
			top: 80px;
			background: var(--bg-glass);
			z-index: 20;
		}

		.hidden-mobile {
			display: none !important;
		}

		.mobile-only, .back-btn {
			display: flex;
		}
	}
</style>
