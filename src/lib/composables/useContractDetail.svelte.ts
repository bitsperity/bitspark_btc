/**
 * useContractDetail Composable
 * 
 * Centralized business logic for contract detail page.
 * Implements state machine for contract lifecycle phases.
 * Provides REAL-TIME reactive updates via NDK storeSubscribe.
 */

import { contractService, jobService, profileService, authService } from '$lib/services';
import { ndk, NOSTR_KINDS } from '$lib/nostr';
import type { Contract, ContractConfirmation, PullRequest, PRStatus } from '$lib/types/offer';
import type { Job } from '$lib/types/job';
import type { NDKUserProfile, NDKFilter, NDKEvent } from '@nostr-dev-kit/ndk';

// ========== TYPES ==========

export type ContractPhase =
    | 'PENDING_CONFIRMATION'  // Dev needs to sign
    | 'AWAITING_PR'           // Dev signed, needs to submit PR
    | 'PR_UNDER_REVIEW'       // PR submitted, IO reviewing
    | 'COMPLETED'             // Payment done
    | 'DISPUTED';             // Breach (future)

export type UserRole = 'io' | 'dev' | null;

export interface ContractAction {
    id: string;
    label: string;
    variant: 'primary' | 'secondary' | 'ghost';
    icon?: string;
    disabled?: boolean;
}

// ========== COMPOSABLE ==========

export function useContractDetail(contractId: () => string) {
    // ========== STATE ==========
    let contract = $state<Contract | null>(null);
    let job = $state<Job | null>(null);
    let ioProfile = $state<NDKUserProfile | null>(null);
    let devProfile = $state<NDKUserProfile | null>(null);
    let isLoading = $state(true);
    let isActioning = $state(false);

    // ========== LIVE SUBSCRIPTIONS ==========
    // These are Svelte stores that update in real-time!

    let confirmationStore: any = null;
    let prStore: any = null;

    // Reactive state from subscriptions
    let confirmationEvents = $state<NDKEvent[]>([]);
    let prEvents = $state<NDKEvent[]>([]);

    // ========== DERIVED FROM SUBSCRIPTIONS ==========

    // Latest confirmation derived from live events
    const confirmation = $derived.by((): ContractConfirmation | null => {
        if (confirmationEvents.length === 0) return null;
        // Get newest confirmation
        const sorted = [...confirmationEvents].sort((a, b) =>
            (b.created_at ?? 0) - (a.created_at ?? 0)
        );
        return contractService.parseConfirmationEvent(sorted[0] as any);
    });

    // Latest PR derived from live events
    const pr = $derived.by((): PullRequest | null => {
        if (prEvents.length === 0) return null;

        // Sort by newest first
        const sorted = [...prEvents].sort((a, b) =>
            (b.created_at ?? 0) - (a.created_at ?? 0)
        );

        // Find latest submission (Kind 1105)
        const latestSubmission = sorted.find(e => e.kind === NOSTR_KINDS.PULL_REQUEST);
        if (!latestSubmission) return null;

        const parsed = contractService.parsePREvent(latestSubmission as any);

        // Check for newer review that updates status
        const latestEvent = sorted[0];
        if (latestEvent.kind === NOSTR_KINDS.REVIEW) {
            const statusTag = latestEvent.tags.find(t => t[0] === 'status');
            if (statusTag) {
                parsed.status = statusTag[1] as PRStatus;
            }
        }

        return parsed;
    });

    // All PRs for timeline
    const allPRs = $derived.by((): PullRequest[] => {
        if (prEvents.length === 0) return [];
        const sorted = [...prEvents].sort((a, b) =>
            (a.created_at ?? 0) - (b.created_at ?? 0)
        );
        return sorted.map(e => contractService.parsePREvent(e as any));
    });

    // ========== SETUP SUBSCRIPTIONS ==========

    // Store cleanup functions
    let cleanupFns: (() => void)[] = [];

    function setupSubscriptions(contractEventId: string) {
        // Clean up any existing subscriptions first
        cleanupSubscriptions();

        // Subscribe to confirmation events (Kind 30108)
        confirmationStore = ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.CONTRACT_CONFIRMATION as number],
            '#e': [contractEventId]
        } as NDKFilter, { closeOnEose: false });

        // Subscribe to PR and Review events (Kind 1105, 1106)
        prStore = ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.PULL_REQUEST as number, NOSTR_KINDS.REVIEW as number],
            '#e': [contractEventId]
        } as NDKFilter, { closeOnEose: false });

        // Sync stores to reactive state
        const unsubConfirm = confirmationStore.subscribe((events: NDKEvent[]) => {
            confirmationEvents = events;
        });

        const unsubPR = prStore.subscribe((events: NDKEvent[]) => {
            prEvents = events;
        });

        // Store cleanup functions for later
        cleanupFns = [
            unsubConfirm,
            unsubPR,
            () => confirmationStore?.unsubscribe?.(),
            () => prStore?.unsubscribe?.()
        ];
    }

    function cleanupSubscriptions() {
        cleanupFns.forEach(fn => fn());
        cleanupFns = [];
    }

    // ========== LOAD DATA ==========

    async function loadContract() {
        const id = contractId();
        if (!id) return;

        isLoading = true;
        try {
            contract = await contractService.getContract(id);
            if (contract) {
                // Load related data in parallel
                const [jobResult, ioResult, devResult] = await Promise.all([
                    jobService.getJob(contract.jobId),
                    profileService.getProfile(contract.ioPubkey),
                    profileService.getProfile(contract.developerPubkey)
                ]);

                job = jobResult;
                ioProfile = ioResult ?? null;
                devProfile = devResult ?? null;

                // Setup live subscriptions for confirmation and PRs
                setupSubscriptions(contract.id);
            }
        } catch (e) {
            console.error('[ContractDetail] Load error:', e);
        } finally {
            isLoading = false;
        }
    }

    // Initial load
    $effect(() => {
        const id = contractId();
        if (id && authService.isLoggedIn) {
            loadContract();
        }
    });

    // ========== COMPUTED ==========

    const userRole = $derived.by(() => {
        if (!contract || !authService.user?.pubkey) return null;
        if (authService.user.pubkey === contract.ioPubkey) return 'io';
        if (authService.user.pubkey === contract.developerPubkey) return 'dev';
        return null;
    });

    const phase = $derived.by((): ContractPhase => {
        if (!contract) return 'PENDING_CONFIRMATION';
        if (!confirmation) return 'PENDING_CONFIRMATION';
        if (!pr) return 'AWAITING_PR';
        if (pr.status === 'approved') return 'COMPLETED';
        return 'PR_UNDER_REVIEW';
    });

    const allowedActions = $derived.by((): ContractAction[] => {
        const role = userRole;
        const currentPhase = phase;
        const actions: ContractAction[] = [];

        if (role === 'dev') {
            if (currentPhase === 'PENDING_CONFIRMATION') {
                actions.push({
                    id: 'confirm',
                    label: 'Confirm & Sign',
                    variant: 'primary',
                    icon: 'shield'
                });
            }
            if (currentPhase === 'AWAITING_PR') {
                actions.push({
                    id: 'submit_pr',
                    label: 'Submit PR',
                    variant: 'primary',
                    icon: 'send'
                });
            }
        }

        if (role === 'io') {
            if (currentPhase === 'PR_UNDER_REVIEW' && pr) {
                actions.push({
                    id: 'approve_pr',
                    label: 'Approve PR',
                    variant: 'primary',
                    icon: 'check'
                });
                actions.push({
                    id: 'request_changes',
                    label: 'Request Changes',
                    variant: 'secondary',
                    icon: 'message-circle'
                });
            }
        }

        return actions;
    });

    // ========== ACTIONS ==========

    async function confirmContractAction() {
        if (!contract) return;
        isActioning = true;
        try {
            await contractService.confirmContract(contract);
            // No need to manually refresh - subscription will update!
        } catch (e) {
            console.error('[ContractDetail] Confirm error:', e);
            throw e;
        } finally {
            isActioning = false;
        }
    }

    async function submitPR(prUrl: string, message: string) {
        if (!contract || !confirmation || !job) return;
        isActioning = true;
        try {
            await contractService.submitPR({
                contractId: contract.id,
                confirmationId: confirmation.id,
                jobId: contract.jobId,
                ioPubkey: contract.ioPubkey,
                prUrl,
                message
            });
            // No need to manually refresh - subscription will update!
        } catch (e) {
            console.error('[ContractDetail] Submit PR error:', e);
            throw e;
        } finally {
            isActioning = false;
        }
    }

    async function approvePRAction() {
        if (!contract || !pr) return;
        isActioning = true;
        try {
            await contractService.approvePR(pr, 'Approved');
            // No need to manually refresh - subscription will update!
        } catch (e) {
            console.error('[ContractDetail] Approve PR error:', e);
            throw e;
        } finally {
            isActioning = false;
        }
    }

    async function requestChangesAction(feedback: string) {
        if (!contract || !pr) return;
        isActioning = true;
        try {
            await contractService.requestChanges(pr, feedback);
            // No need to manually refresh - subscription will update!
        } catch (e) {
            console.error('[ContractDetail] Request changes error:', e);
            throw e;
        } finally {
            isActioning = false;
        }
    }

    // ========== PUBLIC API ==========

    return {
        // Data (reactive via subscriptions!)
        contract: () => contract,
        confirmation: () => confirmation,
        pr: () => pr,
        allPRs: () => allPRs,
        job: () => job,
        ioProfile: () => ioProfile,
        devProfile: () => devProfile,
        isLoading: () => isLoading,
        isActioning: () => isActioning,

        // Computed (State Machine)
        userRole: () => userRole,
        phase: () => phase,
        allowedActions: () => allowedActions,

        // Actions
        confirmContract: confirmContractAction,
        submitPR,
        approvePR: approvePRAction,
        requestChanges: requestChangesAction,

        // Refresh (for manual refresh if needed)
        refresh: loadContract,

        // Cleanup (call in component onDestroy)
        destroy: cleanupSubscriptions
    };
}
