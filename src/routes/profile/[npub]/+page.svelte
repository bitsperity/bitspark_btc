<!--
  Profile Page - View user profile
  
  Pure composition of components.
-->
<script lang="ts">
	import { Container, Stack, AuroraBackground } from '$lib/components';
	import { ProfileCard } from '$lib/components/profile';
	import { nip19 } from 'nostr-tools';
	import { page } from '$app/stores';

	// Get npub from route params
	const npub = $derived($page.params.npub);

	// Decode npub to hex pubkey
	const pubkey = $derived(() => {
		try {
			if (npub.startsWith('npub')) {
				const decoded = nip19.decode(npub);
				return decoded.data as string;
			}
			return npub; // Already hex
		} catch {
			return npub;
		}
	});
</script>

<AuroraBackground />

<main class="page">
	<Container>
		<Stack gap={6}>
			<ProfileCard pubkey={pubkey()} />
		</Stack>
	</Container>
</main>

<style>
	.page {
		padding: var(--space-8) 0;
		min-height: 100vh;
	}
</style>
