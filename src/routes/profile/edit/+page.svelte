<!--
  Edit Profile Page
  
  Protected route - redirects if not logged in.
  Pure composition of ProfileForm component.
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground, Button } from '$lib/components';
	import { ProfileForm } from '$lib/components/profile';
	import { authService } from '$lib/services';
	import { ArrowLeft } from 'lucide-svelte';
</script>

<AuroraBackground />

<main class="page">
	<Container>
		{#if authService.isLoggedIn}
			<Stack gap={6}>
				<a href="/profile/{authService.user?.npub}" class="back-link">
					<ArrowLeft size={16} />
					<span>Back to Profile</span>
				</a>
				<ProfileForm />
			</Stack>
		{:else}
			<Stack gap={4} class="not-logged-in">
				<h1 class="text-display-md">Not Logged In</h1>
				<p class="text-body">Please connect your wallet to edit your profile.</p>
				<Button variant="primary" onclick={() => window.location.href = '/'}>
					Go Home
				</Button>
			</Stack>
		{/if}
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	:global(.not-logged-in) {
		align-items: center;
		text-align: center;
		padding: var(--space-16) 0;
	}
</style>
