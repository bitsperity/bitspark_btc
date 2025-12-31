<!--
  LoginButton - NIP-07 authentication button
  
  Shows "Connect" when logged out, "Logout" when logged in.
  Uses authService singleton for state management.
-->
<script lang="ts">
	import { authService } from '$lib/services';
	import { Button, Spinner } from '$lib/components';
	import { Wallet, LogOut, AlertCircle } from 'lucide-svelte';

	async function handleLogin() {
		try {
			await authService.login();
		} catch {
			// Error is stored in authService.error
		}
	}

	function handleLogout() {
		authService.logout();
	}
</script>

{#if authService.isLoggedIn}
	<Button variant="ghost" onclick={handleLogout}>
		<LogOut size={16} />
		<span>Logout</span>
	</Button>
{:else}
	<Button variant="primary" onclick={handleLogin} disabled={authService.isLoading}>
		{#if authService.isLoading}
			<Spinner size="sm" />
		{:else}
			<Wallet size={16} />
		{/if}
		<span>{authService.isLoading ? 'Connecting...' : 'Connect'}</span>
	</Button>
{/if}

{#if authService.error}
	<div class="login-error">
		<AlertCircle size={14} />
		<span>{authService.error}</span>
	</div>
{/if}

<style>
	.login-error {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-2);
		padding: var(--space-2) var(--space-3);
		font-size: 0.75rem;
		color: var(--error);
		background: rgba(239, 68, 68, 0.1);
		border-radius: var(--radius-md);
	}
</style>
