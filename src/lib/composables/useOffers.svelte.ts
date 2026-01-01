/**
 * useOffers Composable
 * 
 * Centralized business logic for offer subscriptions and grouping.
 * Handles loading, caching, and organizing offers by Idea → Job.
 * 
 * Usage:
 *   const { receivedOffers, sentOffers, groupedOffers, isLoading } = useOffers();
 */

import { offerService, authService, jobService, ideaService } from '$lib/services';
import type { Offer } from '$lib/types/offer';
import type { Job } from '$lib/types/job';
import type { Idea } from '$lib/types/idea';
import { onDestroy } from 'svelte';

export interface GroupedOffers {
    idea: Idea | undefined;
    jobs: Map<string, { job: Job | undefined; offers: Offer[] }>;
}

export function useOffers() {
    // State
    let receivedOffers = $state<Offer[]>([]);
    let sentOffers = $state<Offer[]>([]);
    let jobs = $state<Map<string, Job>>(new Map());
    let ideas = $state<Map<string, Idea>>(new Map());
    let offerStatuses = $state<Map<string, string>>(new Map());
    let isLoading = $state(true);

    // Subscriptions
    let receivedUnsub: (() => void) | undefined;
    let sentUnsub: (() => void) | undefined;

    async function startSubscriptions() {
        cleanup();

        if (!authService.isLoggedIn) {
            isLoading = false;
            return;
        }

        isLoading = true;

        const receivedStore = offerService.subscribeToMyOffers();
        receivedUnsub = receivedStore.subscribe(async offers => {
            receivedOffers = offers;
            await loadMetadata(offers);
            isLoading = false;
        });

        const sentStore = offerService.subscribeToMySentOffers();
        sentUnsub = sentStore.subscribe(async offers => {
            sentOffers = offers;
            await loadMetadata(offers);
        });

        setTimeout(() => { isLoading = false; }, 5000);
    }

    async function loadMetadata(offers: Offer[]) {
        for (const offer of offers) {
            // Load job
            if (!jobs.has(offer.jobId)) {
                const job = await jobService.getJob(offer.jobId);
                if (job) {
                    jobs.set(offer.jobId, job);
                    jobs = new Map(jobs);

                    // Load idea
                    if (job.ideaId && !ideas.has(job.ideaId)) {
                        const idea = await ideaService.getIdea(job.ideaId);
                        if (idea) {
                            ideas.set(job.ideaId, idea);
                            ideas = new Map(ideas);
                        }
                    }
                }
            }

            // Load status
            if (!offerStatuses.has(offer.id)) {
                const status = await offerService.getLatestStatus(offer.id);
                offerStatuses.set(offer.id, status);
                offerStatuses = new Map(offerStatuses);
            }
        }
    }

    function cleanup() {
        receivedUnsub?.();
        sentUnsub?.();
        receivedOffers = [];
        sentOffers = [];
        jobs = new Map();
        ideas = new Map();
        offerStatuses = new Map();
    }

    function groupOffersByIdea(offers: Offer[]): Map<string, GroupedOffers> {
        const result = new Map<string, GroupedOffers>();

        for (const offer of offers) {
            const job = jobs.get(offer.jobId);
            const ideaId = job?.ideaId ?? 'unknown';

            if (!result.has(ideaId)) {
                result.set(ideaId, { idea: ideas.get(ideaId), jobs: new Map() });
            }

            const ideaGroup = result.get(ideaId)!;
            if (!ideaGroup.jobs.has(offer.jobId)) {
                ideaGroup.jobs.set(offer.jobId, { job, offers: [] });
            }

            ideaGroup.jobs.get(offer.jobId)!.offers.push(offer);
        }

        return result;
    }

    function getStatusBadge(offerId: string): { label: string; variant: 'success' | 'warning' | 'error' | 'muted' } {
        const status = offerStatuses.get(offerId) ?? 'pending';
        switch (status) {
            case 'accepted': return { label: 'Accepted', variant: 'success' };
            case 'declined': return { label: 'Declined', variant: 'error' };
            default: return { label: 'Pending', variant: 'warning' };
        }
    }

    // Start subscriptions reactively
    $effect(() => {
        const loggedIn = authService.isLoggedIn;

        if (loggedIn) {
            setTimeout(() => startSubscriptions(), 500);
        } else {
            cleanup();
            isLoading = false;
        }
    });

    // Cleanup on destroy
    onDestroy(() => cleanup());

    return {
        receivedOffers: () => receivedOffers,
        sentOffers: () => sentOffers,
        isLoading: () => isLoading,
        groupOffersByIdea,
        getStatusBadge
    };
}
