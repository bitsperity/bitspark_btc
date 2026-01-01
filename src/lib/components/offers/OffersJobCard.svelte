<!--
  OffersJobCard - Job section with offer list
-->
<script lang="ts">
    import { Badge, UserAvatar } from '$lib/components';
    import { Briefcase, Coins, Clock, ArrowRight } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    import type { Job } from '$lib/types/job';
    import type { Offer } from '$lib/types/offer';

    interface Props {
        job: Job | undefined;
        offers: Offer[];
        getStatusBadge: (offerId: string) => { label: string; variant: 'success' | 'warning' | 'error' | 'muted' };
        onOfferClick: (offer: Offer) => void;
    }

    let { job, offers, getStatusBadge, onOfferClick }: Props = $props();
</script>

<div class="job-card">
    <div class="job-header">
        <Briefcase size={16} />
        <span class="job-name">{job?.title ?? 'Unknown Job'}</span>
    </div>
    
    <div class="offers-list">
        {#each offers as offer (offer.id)}
            {@const statusBadge = getStatusBadge(offer.id)}
            <div 
                class="offer-row" 
                onclick={() => onOfferClick(offer)}
                onkeydown={(e) => e.key === 'Enter' && onOfferClick(offer)}
                role="button"
                tabindex="0"
            >
                <UserAvatar pubkey={offer.pubkey} size="sm" />
                
                <div class="offer-info">
                    <div class="offer-details">
                        <span class="offer-amount">
                            <Coins size={12} />
                            {offer.bid.toLocaleString()} sats
                        </span>
                        <span class="offer-duration">
                            <Clock size={12} />
                            {offer.duration}d
                        </span>
                    </div>
                </div>
                
                <div class="offer-status">
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    <ArrowRight size={16} class="arrow" />
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .job-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: var(--space-4);
    }

    .job-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding-bottom: var(--space-3);
        margin-bottom: var(--space-3);
        border-bottom: 1px solid var(--border-subtle);
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .job-name {
        font-weight: 500;
        color: var(--text-secondary);
    }

    .offers-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .offer-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .offer-row:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: var(--orange-400);
    }

    .offer-info {
        flex: 1;
    }

    .offer-details {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .offer-amount,
    .offer-duration {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .offer-amount {
        color: var(--text-primary);
        font-weight: 500;
    }

    .offer-status {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    :global(.arrow) {
        color: var(--text-muted);
        transition: transform 0.2s ease;
    }

    .offer-row:hover :global(.arrow) {
        transform: translateX(4px);
        color: var(--orange-400);
    }
</style>
