<script lang="ts">
	import '../lib/styles/design-system.css';
	import '../lib/styles/pages.css';
	import './layout.css';
	import { NostrProvider, Container, Row } from '$lib/components';
	import { LoginButton, UserMenu } from '$lib/components/auth';
	import { authService } from '$lib/services';
	import { Zap } from 'lucide-svelte';
	
	let { children } = $props();
</script>

<svelte:head>
	<title>BitSpark - Decentralized Freelance Marketplace</title>
	<meta name="description" content="A decentralized freelance marketplace built on Nostr protocol" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<NostrProvider>
	<!-- Global Header -->
	<header class="header">
		<Container>
			<Row justify="between">
				<a href="/" class="logo">
					<Zap size={24} class="logo-icon" />
					<span class="logo-text">BitSpark</span>
				</a>
				<nav class="header-nav">
					<a href="/ideas" class="nav-link">Ideas</a>
					<a href="/jobs" class="nav-link">Jobs</a>
					<a href="/design" class="nav-link">Design</a>
				</nav>
				<div class="header-auth">
					{#if authService.isLoggedIn}
						<UserMenu />
					{:else}
						<LoginButton />
					{/if}
				</div>
			</Row>
		</Container>
	</header>

	<div class="app">
		{@render children()}
	</div>
</NostrProvider>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		padding: var(--space-4) 0;
		background: rgba(10, 10, 15, 0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		text-decoration: none;
		color: var(--text-primary);
	}

	.logo :global(.logo-icon) {
		color: var(--orange-500);
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}

	.nav-link {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.nav-link:hover {
		color: var(--text-primary);
	}

	.header-auth {
		display: flex;
		align-items: center;
	}

	.app {
		min-height: calc(100vh - 73px);
	}

	@media (max-width: 768px) {
		.header-nav {
			display: none;
		}
	}
</style>
