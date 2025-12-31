<!--
  ProfileForm - Edit user profile
  
  Updates Kind 0 metadata event.
-->
<script lang="ts">
	import { authService, profileService } from '$lib/services';
	import { Card, Stack, Row, Input, Textarea, Button, Avatar } from '$lib/components';
	import { Save, User } from 'lucide-svelte';

	let isSaving = $state(false);
	let saveError = $state<string | undefined>(undefined);
	let saveSuccess = $state(false);

	// Form fields bound to current profile
	const currentProfile = $derived(authService.user?.profile);
	
	let name = $state(currentProfile?.name ?? '');
	let about = $state(currentProfile?.about ?? '');
	let picture = $state(currentProfile?.image ?? currentProfile?.picture ?? '');
	let banner = $state(currentProfile?.banner ?? '');
	let website = $state(currentProfile?.website ?? '');
	let nip05 = $state(currentProfile?.nip05 ?? '');
	let lud16 = $state(currentProfile?.lud16 ?? '');

	// Sync when profile updates
	$effect(() => {
		if (currentProfile) {
			name = currentProfile.name ?? '';
			about = currentProfile.about ?? '';
			picture = currentProfile.image ?? currentProfile.picture ?? '';
			banner = currentProfile.banner ?? '';
			website = currentProfile.website ?? '';
			nip05 = currentProfile.nip05 ?? '';
			lud16 = currentProfile.lud16 ?? '';
		}
	});

	async function handleSave() {
		isSaving = true;
		saveError = undefined;
		saveSuccess = false;

		try {
			await profileService.updateProfile({
				name,
				about,
				picture,
				image: picture,
				banner,
				website,
				nip05,
				lud16
			});
			saveSuccess = true;
			setTimeout(() => saveSuccess = false, 3000);
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Failed to save profile';
		} finally {
			isSaving = false;
		}
	}
</script>

<Card>
	<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
		<Stack gap={6}>
			<h2 class="text-display-md">Edit Profile</h2>

			<!-- Avatar preview -->
			<Row gap={4}>
				<Avatar src={picture} fallback={name[0] ?? '?'} size="xl" />
				<Stack gap={2}>
					<span class="text-small">Profile Picture</span>
					<Input 
						placeholder="https://example.com/avatar.jpg" 
						bind:value={picture}
					/>
				</Stack>
			</Row>

			<!-- Basic info -->
			<div class="form-grid">
				<Input label="Display Name" placeholder="satoshi" bind:value={name} />
				<Input label="NIP-05 Identifier" placeholder="you@example.com" bind:value={nip05} />
			</div>

			<Textarea 
				label="About" 
				placeholder="Tell people about yourself..." 
				rows={4}
				bind:value={about}
			/>

			<!-- Links -->
			<div class="form-grid">
				<Input label="Website" placeholder="https://yoursite.com" bind:value={website} />
				<Input label="Lightning Address" placeholder="you@getalby.com" bind:value={lud16} />
			</div>

			<Input 
				label="Banner Image" 
				placeholder="https://example.com/banner.jpg" 
				bind:value={banner}
			/>

			<!-- Actions -->
			<Row justify="end" gap={3}>
				{#if saveError}
					<span class="error-message">{saveError}</span>
				{/if}
				{#if saveSuccess}
					<span class="success-message">Profile saved!</span>
				{/if}
				<Button variant="primary" type="submit" disabled={isSaving}>
					<Save size={16} />
					<span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
				</Button>
			</Row>
		</Stack>
	</form>
</Card>

<style>
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error);
	}

	.success-message {
		font-size: 0.875rem;
		color: var(--success);
	}
</style>
