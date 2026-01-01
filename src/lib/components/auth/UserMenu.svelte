<!--
  UserMenu - Dropdown menu for logged in user
  
  Shows avatar, name, and menu options (Profile, Edit, Settings, Logout).
-->
<script lang="ts">
	import { authService } from '$lib/services';
	import { Avatar } from '$lib/components';
	import { User, Settings, LogOut, ChevronDown, Edit, Lightbulb, Briefcase } from 'lucide-svelte';

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleLogout() {
		authService.logout();
		closeMenu();
	}

	// Close menu on outside click
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			closeMenu();
		}
	}

	$effect(() => {
		if (menuOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	const profile = $derived(authService.user?.profile);
	const displayName = $derived(profile?.name ?? profile?.displayName ?? 'Anonymous');
	const avatarUrl = $derived(profile?.image ?? profile?.picture);
	const fallback = $derived(displayName[0]?.toUpperCase() ?? '?');
</script>

{#if authService.isLoggedIn}
	<div class="user-menu">
		<button class="user-menu-trigger" onclick={toggleMenu}>
			<Avatar src={avatarUrl} {fallback} size="sm" />
			<span class="user-name">{displayName}</span>
			<ChevronDown size={14} class={menuOpen ? 'chevron open' : 'chevron'} />
		</button>

		{#if menuOpen}
			<div class="user-menu-dropdown">
				<a href="/profile/{authService.user?.npub}" class="menu-item" onclick={closeMenu}>
					<User size={16} />
					<span>View Profile</span>
				</a>
				<a href="/profile/edit" class="menu-item" onclick={closeMenu}>
					<Edit size={16} />
					<span>Edit Profile</span>
				</a>
				<a href="/dashboard/ideas" class="menu-item" onclick={closeMenu}>
					<Lightbulb size={16} />
					<span>My Ideas</span>
				</a>
				<a href="/dashboard/jobs" class="menu-item" onclick={closeMenu}>
					<Briefcase size={16} />
					<span>My Jobs</span>
				</a>
				<a href="/settings" class="menu-item" onclick={closeMenu}>
					<Settings size={16} />
					<span>Settings</span>
				</a>
				<hr class="menu-divider" />
				<button class="menu-item menu-item-danger" onclick={handleLogout}>
					<LogOut size={16} />
					<span>Logout</span>
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.user-menu {
		position: relative;
	}

	.user-menu-trigger {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.user-menu-trigger:hover {
		background: var(--bg-elevated);
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.user-menu-trigger :global(.chevron) {
		color: var(--text-muted);
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.user-menu-trigger :global(.chevron.open) {
		transform: rotate(180deg);
	}

	.user-menu-dropdown {
		position: absolute;
		top: calc(100% + var(--space-2));
		right: 0;
		min-width: 180px;
		padding: var(--space-2);
		background: var(--bg-glass-strong);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-dropdown);
		animation: dropdown-enter 150ms var(--ease-out);
	}

	@keyframes dropdown-enter {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3);
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: none;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
		text-decoration: none;
	}

	.menu-item:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	.menu-item-danger:hover {
		color: var(--error);
		background: rgba(239, 68, 68, 0.1);
	}

	.menu-divider {
		margin: var(--space-2) 0;
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	@media (max-width: 640px) {
		.user-name {
			display: none;
		}
	}
</style>
