<!--
  ProfileForm - Edit user profile
  
  Updates Kind 0 metadata event.
-->
<script lang="ts">
	import { authService } from '$lib/services';
	import { ndk } from '$lib/nostr';
	import { Card, Stack, Row, Input, Textarea, Button, Avatar, Spinner } from '$lib/components';
	import { Save } from 'lucide-svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	let isSaving = $state(false);
	let isLoading = $state(true);
	let saveError = $state<string | undefined>(undefined);
	let saveSuccess = $state(false);

	// Form fields - initialize empty, load from profile
	let name = $state('');
	let about = $state('');
	let picture = $state('');
	let banner = $state('');
	let website = $state('');
	let nip05 = $state('');
	let lud16 = $state('');

	// Load profile on mount
	$effect(() => {
		const user = authService.user;
		if (user) {
			loadProfile();
		}
	});

	async function loadProfile() {
		isLoading = true;
		try {
			const user = authService.user;
			if (user) {
				await user.fetchProfile();
				const profile = user.profile;
				if (profile) {
					name = profile.name ?? '';
					about = profile.about ?? '';
					picture = profile.image ?? profile.picture ?? '';
					banner = profile.banner ?? '';
					website = profile.website ?? '';
					nip05 = profile.nip05 ?? '';
					lud16 = profile.lud16 ?? '';
				}
			}
		} catch (error) {
			console.error('[ProfileForm] Failed to load profile:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		isSaving = true;
		saveError = undefined;
		saveSuccess = false;

		try {
			const user = authService.user;
			if (!user) {
				throw new Error('Not logged in');
			}

			// Update user profile
			user.profile = {
				...user.profile,
				name,
				about,
				picture,
				image: picture,
				banner,
				website,
				nip05,
				lud16
			};

			// Publish Kind 0 event
			await user.publish();
			
			saveSuccess = true;
			console.log('[ProfileForm] Profile saved successfully');
			setTimeout(() => saveSuccess = false, 3000);
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Failed to save profile';
			console.error('[ProfileForm] Save error:', error);
		} finally {
			isSaving = false;
		}
	}
</script>

<Card>
	{#if isLoading}
		<Stack gap={4} class="loading-state">
			<Spinner size="lg" />
			<span class="text-muted">Loading profile...</span>
		</Stack>
	{:else}
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
						{#if isSaving}
							<Spinner size="sm" />
						{:else}
							<Save size={16} />
						{/if}
						<span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
					</Button>
				</Row>
			</Stack>
		</form>
	{/if}
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

	:global(.loading-state) {
		align-items: center;
		padding: var(--space-8);
	}
</style>
