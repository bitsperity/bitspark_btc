<!--
  ConnectionStatus - Shows connection state in Navbar
  
  Displays:
  - Nothing when connected (normal state)
  - Spinner when connecting
  - "Offline" badge when disconnected
-->
<script lang="ts">
	import { connectionState } from '$lib/nostr';
	import { Badge, Spinner } from '$lib/components';
	import { WifiOff } from 'lucide-svelte';
</script>

{#if $connectionState === 'connecting'}
	<div class="connection-status connecting">
		<Spinner size="xs" />
		<span>Connecting...</span>
	</div>
{:else if $connectionState === 'disconnected'}
	<div class="connection-status disconnected">
		<WifiOff size={14} />
		<span>Offline</span>
	</div>
{/if}

<style>
	.connection-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.connecting {
		background: rgba(251, 191, 36, 0.15);
		color: var(--warning);
	}

	.disconnected {
		background: rgba(239, 68, 68, 0.15);
		color: var(--error);
	}
</style>
