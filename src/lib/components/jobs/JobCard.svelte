<!--
  JobCard - Preview card for a job
-->
<script lang="ts">
	import { Card, Badge, Row, Stack, Avatar } from '$lib/components';
	import JobStatusBadge from './JobStatusBadge.svelte';
	import { LikeButton, BookmarkButton } from '$lib/components/social';
	import { LANGUAGE_LABELS, type Job, type ProgrammingLanguage, type JobStatus } from '$lib/types/job';
	import { profileService, jobService } from '$lib/services';
	import { goto } from '$app/navigation';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { Briefcase } from 'lucide-svelte';

	interface Props {
		job: Job;
	}

	let { job }: Props = $props();

	// Fetch author profile
	let authorProfile = $state<NDKUserProfile | null>(null);
	let derivedStatus = $state<JobStatus>(job.status);

	$effect(() => {
		profileService.getProfile(job.pubkey).then(p => authorProfile = p);
		// Derive actual status from contract/PR state
		jobService.deriveJobStatus(job.id).then(s => derivedStatus = s);
	});

	const displayLanguages = $derived(
		job.languages.slice(0, 3).map(l => LANGUAGE_LABELS[l as ProgrammingLanguage] ?? l)
	);

	function handleCardClick(e: MouseEvent) {
		if (!e.defaultPrevented) {
			goto(`/jobs/${job.id}`);
		}
	}
</script>

<div class="job-card-link" onclick={handleCardClick} role="button" tabindex="0">
	<Card hover>
		<Stack gap={4}>
			<!-- Banner -->
			{#if job.bannerUrl}
				<div class="job-banner">
					<img src={job.bannerUrl} alt={job.title} />
				</div>
			{/if}

			<!-- Header with status -->
			<Row justify="between">
				<Row gap={2}>
					<Briefcase size={16} class="text-muted" />
					<span class="job-title">{job.title}</span>
				</Row>
				<JobStatusBadge status={derivedStatus} size="sm" />
			</Row>

			<!-- Description preview -->
			<p class="description">{job.content || 'No description'}</p>

			<!-- Languages -->
			<Row gap={2} wrap>
				{#each displayLanguages as lang}
					<Badge variant="secondary" size="sm">{lang}</Badge>
				{/each}
				{#if job.languages.length > 3}
					<Badge variant="muted" size="sm">+{job.languages.length - 3}</Badge>
				{/if}
			</Row>

			<!-- Author + Like -->
			<Row justify="between" class="author">
				<Row gap={2}>
					<Avatar 
						src={authorProfile?.image} 
						fallback={authorProfile?.name?.[0] ?? '?'} 
						size="xs" 
					/>
					<span class="author-name">{authorProfile?.name ?? 'Anonymous'}</span>
				</Row>
				<Row gap={2}>
					<LikeButton eventId={job.id} size="sm" />
					<BookmarkButton eventId={job.id} type="job" size="sm" />
				</Row>
			</Row>
		</Stack>
	</Card>
</div>

<style>
	.job-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
		cursor: pointer;
	}

	.job-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.job-banner {
		aspect-ratio: 16/9;
		border-radius: var(--radius-md);
		overflow: hidden;
		margin: calc(var(--space-4) * -1);
		margin-bottom: 0;
	}

	.job-banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.description {
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.author) {
		margin-top: auto;
	}

	.author-name {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
</style>
