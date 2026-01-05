<!--
  ActivityItem - Renders a single activity entry
  
  Types:
  - idea: User created an idea
  - job: User created a job
  - comment: User commented on something
  - like: User liked something
-->
<script lang="ts">
	import { Row, Stack, Badge } from '$lib/components';
	import { UserAvatar } from '$lib/components';
	import { goto } from '$app/navigation';
	import { Lightbulb, Briefcase, MessageCircle, Heart, ExternalLink } from 'lucide-svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { NOSTR_KINDS } from '$lib/nostr/config';

	interface Props {
		event: NDKEvent;
	}

	let { event }: Props = $props();

	// Derive activity type from event kind
	const activityType = $derived(() => {
		switch (event.kind) {
			case NOSTR_KINDS.IDEA: return 'idea';
			case NOSTR_KINDS.JOB: return 'job';
			case 1: return 'comment'; // Kind 1 = Note/Comment
			case 7: return 'like'; // Kind 7 = Reaction
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
				return { icon: MessageCircle, label: 'commented', color: 'var(--success)' };
			case 'like':
				return { icon: Heart, label: 'liked', color: 'var(--error)' };
			default:
				return { icon: ExternalLink, label: 'did something', color: 'var(--text-muted)' };
		}
	});

	// Extract title/content preview
	const contentPreview = $derived(() => {
		const type = activityType();
		
		if (type === 'idea' || type === 'job') {
			// Get title from tags
			const titleTag = event.tags.find(t => t[0] === 'title');
			return titleTag?.[1] ?? 'Untitled';
		}
		
		if (type === 'comment') {
			// Show content preview (first 100 chars)
			return event.content?.slice(0, 100) + (event.content?.length > 100 ? '...' : '');
		}
		
		if (type === 'like') {
			return 'a post'; // Could lazy-load target later
		}
		
		return '';
	});

	// Get target event ID (for navigation)
	const targetId = $derived(() => {
		const type = activityType();
		
		if (type === 'idea' || type === 'job') {
			return event.id;
		}
		
		// For comments and likes, get the e-tag (target event)
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
		const id = targetId();
		
		if (!id) return;
		
		if (type === 'idea') {
			goto(`/ideas/${id}`);
		} else if (type === 'job') {
			goto(`/jobs/${id}`);
		}
		// Comments and likes could navigate to the target event
	}
</script>

<button class="activity-item" onclick={handleClick}>
	<div class="activity-icon" style:color={activityMeta().color}>
		<svelte:component this={activityMeta().icon} size={18} />
	</div>
	
	<div class="activity-content">
		<Row gap={2} class="activity-header">
			<UserAvatar pubkey={event.pubkey} size="sm" clickable={false} />
			<span class="activity-action">{activityMeta().label}</span>
			<span class="activity-time">{formatTime(event.created_at ?? 0)}</span>
		</Row>
		
		{#if contentPreview()}
			<p class="activity-preview">{contentPreview()}</p>
		{/if}
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
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.activity-item:hover {
		background: var(--bg-elevated);
		border-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
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

	:global(.activity-header) {
		flex-wrap: wrap;
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
