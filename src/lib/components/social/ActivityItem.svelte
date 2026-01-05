<!--
  ActivityItem - Renders a single activity entry
  
  Types:
  - idea: User created an idea
  - job: User created a job
  - comment: User commented on something
  - like: User liked something
  
  Features:
  - Shows avatar + username
  - Resolves target for likes/comments
  - Click navigates to target
-->
<script lang="ts">
	import { Row, Stack } from '$lib/components';
	import { UserAvatar } from '$lib/components';
	import { profileService } from '$lib/services';
	import { ndk } from '$lib/nostr';
	import { goto } from '$app/navigation';
	import { Lightbulb, Briefcase, MessageCircle, Heart, ExternalLink } from 'lucide-svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { NOSTR_KINDS } from '$lib/nostr/config';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		event: NDKEvent;
	}

	let { event }: Props = $props();

	// Profile state
	let profile = $state<NDKUserProfile | null>(null);
	let targetTitle = $state<string | null>(null);
	let targetType = $state<'idea' | 'job' | null>(null);
	let wasComment = $state(false); // Track if original target was a comment
	let rootEventId = $state<string | null>(null); // The actual Idea/Job ID for navigation

	// Load profile on mount
	$effect(() => {
		loadProfile();
		loadTarget();
	});

	async function loadProfile() {
		profile = await profileService.getProfile(event.pubkey);
	}

	async function loadTarget() {
		const type = activityType();
		
		// Only need to load target for likes and comments
		if (type !== 'like' && type !== 'comment') return;
		
		// Get target event ID from e-tag
		const eTag = event.tags.find(t => t[0] === 'e');
		if (!eTag) return;
		
		const targetId = eTag[1];
		
		try {
			// Fetch the target event
			let targetEvent = await ndk.fetchEvent(targetId);
			if (!targetEvent) return;
			
			// Track if original target was a comment
			if (targetEvent.kind === 1) {
				wasComment = true;
			}
			
			// If target is a comment (Kind 1), traverse up to find parent Idea/Job
			let maxDepth = 5; // Prevent infinite loops
			while (targetEvent.kind === 1 && maxDepth > 0) {
				const parentTag = targetEvent.tags.find(t => t[0] === 'e');
				if (!parentTag) break;
				
				const parentEvent = await ndk.fetchEvent(parentTag[1]);
				if (!parentEvent) break;
				
				targetEvent = parentEvent;
				maxDepth--;
			}
			
			// Now we should have the root Idea/Job
			if (targetEvent.kind === NOSTR_KINDS.IDEA) {
				targetType = 'idea';
				rootEventId = targetEvent.id; // Store the Idea ID
				const titleTag = targetEvent.tags.find(t => t[0] === 'title');
				targetTitle = titleTag?.[1] ?? 'an idea';
			} else if (targetEvent.kind === NOSTR_KINDS.JOB) {
				targetType = 'job';
				rootEventId = targetEvent.id; // Store the Job ID
				const titleTag = targetEvent.tags.find(t => t[0] === 'title');
				targetTitle = titleTag?.[1] ?? 'a job';
			} else if (targetEvent.kind === 1) {
				// Still a comment (couldn't find parent)
				targetTitle = `"${targetEvent.content?.slice(0, 40)}..."`;
			}
		} catch (error) {
			console.error('[ActivityItem] Failed to load target:', error);
		}
	}

	// Derive activity type from event kind
	const activityType = $derived(() => {
		switch (event.kind) {
			case NOSTR_KINDS.IDEA: return 'idea';
			case NOSTR_KINDS.JOB: return 'job';
			case 1: return 'comment';
			case 7: return 'like';
			default: return 'unknown';
		}
	});

	// Activity icon and label
	const activityMeta = $derived(() => {
		switch (activityType()) {
			case 'idea':
				return { icon: Lightbulb, label: 'created an idea', color: 'var(--amber-400)' };
			case 'job':
				return { icon: Briefcase, label: 'posted a job', color: 'var(--primary)' };
			case 'comment':
				return { icon: MessageCircle, label: 'commented on', color: 'var(--success)' };
			case 'like':
				return { icon: Heart, label: 'liked', color: 'var(--error)' };
			default:
				return { icon: ExternalLink, label: 'did something', color: 'var(--text-muted)' };
		}
	});

	// Username
	const username = $derived(profile?.name ?? profile?.displayName ?? 'Someone');

	// Content preview
	const contentPreview = $derived(() => {
		const type = activityType();
		
		if (type === 'idea' || type === 'job') {
			const titleTag = event.tags.find(t => t[0] === 'title');
			return titleTag?.[1] ?? 'Untitled';
		}
		
		if (type === 'comment') {
			// Show comment text + target
			const text = event.content?.slice(0, 80) + (event.content?.length > 80 ? '...' : '');
			return targetTitle ? `"${text}"` : text;
		}
		
		if (type === 'like') {
			if (wasComment && targetTitle) {
				return `comment on "${targetTitle}"`;
			}
			return targetTitle ?? 'a post';
		}
		
		return '';
	});

	// Get target event ID for navigation
	const targetId = $derived(() => {
		const type = activityType();
		
		if (type === 'idea' || type === 'job') {
			return event.id;
		}
		
		const eTag = event.tags.find(t => t[0] === 'e');
		return eTag?.[1] ?? null;
	});

	// Format relative time
	function formatTime(timestamp: number): string {
		const now = Date.now() / 1000;
		const diff = now - timestamp;
		
		if (diff < 60) return 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
		return new Date(timestamp * 1000).toLocaleDateString();
	}

	function handleClick() {
		const type = activityType();
		
		// For ideas and jobs created directly
		if (type === 'idea') {
			goto(`/ideas/${event.id}`);
		} else if (type === 'job') {
			goto(`/jobs/${event.id}`);
		} 
		// For likes and comments, navigate to root Idea/Job
		else if (type === 'like' || type === 'comment') {
			if (rootEventId && targetType === 'idea') {
				goto(`/ideas/${rootEventId}`);
			} else if (rootEventId && targetType === 'job') {
				goto(`/jobs/${rootEventId}`);
			}
		}
	}

	// Can navigate (has valid target)
	const canNavigate = $derived(() => {
		const type = activityType();
		if (type === 'idea' || type === 'job') return true;
		return targetType !== null;
	});
</script>

<button 
	class="activity-item" 
	class:clickable={canNavigate()}
	onclick={handleClick}
	disabled={!canNavigate()}
>
	<div class="activity-icon" style:color={activityMeta().color}>
		<svelte:component this={activityMeta().icon} size={18} />
	</div>
	
	<div class="activity-content">
		<div class="activity-header">
			<UserAvatar pubkey={event.pubkey} size="xs" clickable={false} />
			<span class="username">{username}</span>
			<span class="activity-action">{activityMeta().label}</span>
			<span class="activity-time">{formatTime(event.created_at ?? 0)}</span>
		</div>
		
		<p class="activity-preview">
			{#if activityType() === 'like' || activityType() === 'comment'}
				{#if targetType === 'idea'}
					<Lightbulb size={12} class="inline-icon" />
				{:else if targetType === 'job'}
					<Briefcase size={12} class="inline-icon" />
				{/if}
			{/if}
			{contentPreview()}
		</p>
	</div>
</button>

<style>
	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--bg-glass);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-lg);
		text-align: left;
		width: 100%;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.activity-item.clickable {
		cursor: pointer;
	}

	.activity-item.clickable:hover {
		background: var(--bg-elevated);
		border-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.activity-item:disabled {
		cursor: default;
		opacity: 0.8;
	}

	.activity-icon {
		flex-shrink: 0;
		padding: var(--space-2);
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-md);
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.username {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.activity-action {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.activity-time {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-left: auto;
	}

	.activity-preview {
		margin: var(--space-2) 0 0 0;
		font-size: 0.875rem;
		color: var(--text-primary);
		line-height: 1.4;
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	:global(.inline-icon) {
		flex-shrink: 0;
		opacity: 0.7;
	}
</style>
