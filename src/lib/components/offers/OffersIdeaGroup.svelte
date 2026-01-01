<!--
  OffersIdeaGroup - Collapsible idea section with job groups
-->
<script lang="ts">
    import { Stack, Badge } from '$lib/components';
    import { Lightbulb, ChevronDown, ChevronRight } from 'lucide-svelte';
    import type { Idea } from '$lib/types/idea';
    import type { Job } from '$lib/types/job';
    import type { Offer } from '$lib/types/offer';
    import OffersJobCard from './OffersJobCard.svelte';

    interface Props {
        idea: Idea | undefined;
        jobs: Map<string, { job: Job | undefined; offers: Offer[] }>;
        getStatusBadge: (offerId: string) => { label: string; variant: 'success' | 'warning' | 'error' | 'muted' };
        onOfferClick: (offer: Offer) => void;
    }

    let { idea, jobs, getStatusBadge, onOfferClick }: Props = $props();

    let isCollapsed = $state(false);

    const offerCount = $derived(
        [...jobs.values()].reduce((sum, g) => sum + g.offers.length, 0)
    );

    function toggle() {
        isCollapsed = !isCollapsed;
    }
</script>

<div class="idea-section">
    <button class="idea-header" onclick={toggle}>
        <div class="idea-toggle">
            {#if isCollapsed}
                <ChevronRight size={18} />
            {:else}
                <ChevronDown size={18} />
            {/if}
        </div>
        <Lightbulb size={20} class="idea-icon" />
        <span class="idea-name">{idea?.title ?? 'Unknown Project'}</span>
        <span class="idea-count">{offerCount}</span>
    </button>
    
    {#if !isCollapsed}
        <div class="idea-content">
            <Stack gap={3}>
                {#each [...jobs.entries()] as [jobId, { job, offers }]}
                    <OffersJobCard 
                        {job} 
                        {offers} 
                        {getStatusBadge} 
                        {onOfferClick} 
                    />
                {/each}
            </Stack>
        </div>
    {/if}
</div>

<style>
    .idea-section {
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);
    }

    .idea-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-4);
        background: rgba(255, 255, 255, 0.02);
        border: none;
        cursor: pointer;
        color: var(--text-primary);
        text-align: left;
        transition: background 0.2s ease;
    }

    .idea-header:hover {
        background: rgba(255, 255, 255, 0.04);
    }

    .idea-toggle {
        color: var(--text-muted);
    }

    :global(.idea-icon) {
        color: var(--orange-400);
    }

    .idea-name {
        flex: 1;
        font-size: 1rem;
        font-weight: 600;
    }

    .idea-count {
        background: var(--orange-500);
        color: white;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .idea-content {
        padding: var(--space-4);
        padding-top: 0;
    }
</style>
