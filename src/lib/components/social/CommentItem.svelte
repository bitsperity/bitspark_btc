<!--
  CommentItem - Single comment display with author and timestamp
-->
<script lang="ts">
	import { Avatar, Row } from '$lib/components';
	import { profileService } from '$lib/services';
	import { LikeButton } from '$lib/components/social';
	import type { Comment } from '$lib/types/social';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		comment: Comment;
	}

	let { comment }: Props = $props();

	// Fetch author profile
	let authorProfile = $state<NDKUserProfile | undefined>(undefined);
	
	$effect(() => {
		loadProfile();
	});

	async function loadProfile() {
		authorProfile = await profileService.getProfile(comment.pubkey);
	}

	const authorName = $derived(authorProfile?.name ?? authorProfile?.displayName ?? 'Anonymous');
	const authorAvatar = $derived(authorProfile?.image ?? authorProfile?.picture);

	// Relative time
	function getRelativeTime(createdAt: Date | number): string {
		const now = Date.now();
		const timestamp = typeof createdAt === 'number' ? createdAt * 1000 : createdAt.getTime();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		
		if (days > 0) return `${days}d`;
		if (hours > 0) return `${hours}h`;
		if (minutes > 0) return `${minutes}m`;
		return 'now';
	}

	const relativeTime = $derived(getRelativeTime(comment.createdAt));
</script>

<div class="comment-item">
	<Avatar src={authorAvatar} fallback={authorName[0]} size="sm" />
	
	<div class="comment-body">
		<Row gap={2} class="comment-header">
			<span class="author-name">{authorName}</span>
			<span class="time">• {relativeTime}</span>
		</Row>
		
		<p class="comment-content">{comment.content}</p>
		
		<div class="comment-actions">
			<LikeButton eventId={comment.id} size="sm" />
		</div>
	</div>
</div>

<style>
	.comment-item {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3) 0;
	}

	.comment-item:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.comment-body {
		flex: 1;
		min-width: 0;
	}

	:global(.comment-header) {
		margin-bottom: var(--space-1);
	}

	.author-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.comment-content {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.comment-actions {
		margin-top: var(--space-2);
	}
</style>
