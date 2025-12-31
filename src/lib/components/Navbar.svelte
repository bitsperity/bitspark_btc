<!--
  Navbar Component - Mobile-first bottom navigation
  
  Usage:
    <Navbar {items} />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface NavItem {
		href: string;
		label: string;
		icon: Snippet;
		active?: boolean;
	}

	interface Props {
		items: NavItem[];
		class?: string;
	}

	let {
		items,
		class: className = ''
	}: Props = $props();

	const classes = $derived(['navbar', className].filter(Boolean).join(' '));
</script>

<nav class={classes}>
	<div class="navbar-content">
		{#each items as item}
			<a href={item.href} class="nav-item" class:active={item.active}>
				<span class="nav-item-icon">
					{@render item.icon()}
				</span>
				<span class="nav-item-label">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
