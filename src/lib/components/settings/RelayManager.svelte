<!--
  RelayManager - Configure Nostr relays
  
  View connected relays, add new, remove existing.
-->
<script lang="ts">
	import { relayService, type RelayInfo } from '$lib/services/relays';
	import { authService } from '$lib/services';
	import { Card, Stack, Row, Input, Button, Badge, Spinner } from '$lib/components';
	import { Plus, Trash2, Wifi, WifiOff, Save } from 'lucide-svelte';

	let isLoading = $state(true);
	let isSaving = $state(false);
	let newRelayUrl = $state('');
	let relays = $state<RelayInfo[]>([]);
	let error = $state<string | undefined>(undefined);

	// Load relays on mount
	$effect(() => {
		loadRelays();
	});

	async function loadRelays() {
		isLoading = true;
		try {
			// Get currently connected relays
			const connected = relayService.getConfiguredRelays();
			relays = connected.map(url => ({
				url,
				read: true,
				write: true
			}));

			// If logged in, try to load user's saved relay list
			if (authService.user) {
				const userRelays = await relayService.getUserRelayList(authService.user.pubkey);
				if (userRelays.length > 0) {
					relays = userRelays;
				}
			}
		} catch (e) {
			console.error('[RelayManager] Load error:', e);
		} finally {
			isLoading = false;
		}
	}

	function addRelay() {
		if (!newRelayUrl.trim()) return;
		
		// Validate URL
		const url = newRelayUrl.trim().toLowerCase();
		if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
			error = 'URL must start with ws:// or wss://';
			return;
		}

		// Check duplicate
		if (relays.some(r => r.url === url)) {
			error = 'Relay already exists';
			return;
		}

		relays = [...relays, { url, read: true, write: true }];
		newRelayUrl = '';
		error = undefined;
	}

	function removeRelay(url: string) {
		relays = relays.filter(r => r.url !== url);
	}

	function toggleRead(url: string) {
		relays = relays.map(r => 
			r.url === url ? { ...r, read: !r.read } : r
		);
	}

	function toggleWrite(url: string) {
		relays = relays.map(r => 
			r.url === url ? { ...r, write: !r.write } : r
		);
	}

	async function saveRelays() {
		if (!authService.isLoggedIn) {
			error = 'Must be logged in to save';
			return;
		}

		isSaving = true;
		error = undefined;

		try {
			await relayService.saveRelayList(relays);
			
			// Update NDK pool
			for (const relay of relays) {
				await relayService.addRelay(relay.url);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			isSaving = false;
		}
	}

	const connectedUrls = $derived(new Set(relayService.getConnectedRelays()));
</script>

<Card>
	<Stack gap={4}>
		<Row justify="between">
			<h3 class="text-display-sm">Relay Configuration</h3>
			{#if authService.isLoggedIn}
				<Button variant="primary" size="sm" onclick={saveRelays} disabled={isSaving}>
					{#if isSaving}
						<Spinner size="sm" />
					{:else}
						<Save size={14} />
					{/if}
					<span>Save</span>
				</Button>
			{/if}
		</Row>

		{#if isLoading}
			<div class="loading">
				<Spinner size="md" />
				<span class="text-muted">Loading relays...</span>
			</div>
		{:else}
			<!-- Add new relay -->
			<Row gap={2}>
				<div class="flex-1">
					<Input 
						placeholder="wss://relay.example.com"
						bind:value={newRelayUrl}
						onkeydown={(e) => e.key === 'Enter' && addRelay()}
					/>
				</div>
				<Button variant="secondary" onclick={addRelay}>
					<Plus size={16} />
				</Button>
			</Row>

			{#if error}
				<span class="error-message">{error}</span>
			{/if}

			<!-- Relay list -->
			<div class="relay-list">
				{#each relays as relay (relay.url)}
					<div class="relay-item">
						<div class="relay-status">
							{#if connectedUrls.has(relay.url)}
								<Wifi size={14} class="connected" />
							{:else}
								<WifiOff size={14} class="disconnected" />
							{/if}
						</div>
						<span class="relay-url">{relay.url}</span>
						<div class="relay-actions">
							<button 
								class="toggle-btn" 
								class:active={relay.read}
								onclick={() => toggleRead(relay.url)}
								title="Read"
							>R</button>
							<button 
								class="toggle-btn" 
								class:active={relay.write}
								onclick={() => toggleWrite(relay.url)}
								title="Write"
							>W</button>
							<button 
								class="remove-btn"
								onclick={() => removeRelay(relay.url)}
								title="Remove"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{:else}
					<p class="text-muted">No relays configured</p>
				{/each}
			</div>
		{/if}
	</Stack>
</Card>

<style>
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-8);
	}

	.flex-1 {
		flex: 1;
	}

	.relay-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.relay-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md);
	}

	.relay-status :global(.connected) {
		color: var(--success);
	}

	.relay-status :global(.disconnected) {
		color: var(--text-muted);
	}

	.relay-url {
		flex: 1;
		font-size: 0.875rem;
		font-family: var(--font-mono);
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.relay-actions {
		display: flex;
		gap: var(--space-1);
	}

	.toggle-btn {
		width: 24px;
		height: 24px;
		font-size: 0.625rem;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.toggle-btn.active {
		background: var(--orange-500);
		border-color: var(--orange-500);
		color: white;
	}

	.remove-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.remove-btn:hover {
		color: var(--error);
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error);
	}
</style>
