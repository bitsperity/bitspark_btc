/**
 * useContractDetail Composable
 * 
 * Centralized business logic for contract detail page.
 * Implements state machine for contract lifecycle phases.
 * Provides real-time reactive updates via NDK subscriptions.
 */

import { contractService, jobService, profileService, authService } from '$lib/services';
import { ndk, NOSTR_KINDS } from '$lib/nostr';
import type { Contract, ContractConfirmation, PullRequest } from '$lib/types/offer';
import type { Job } from '$lib/types/job';
import type { NDKUserProfile, NDKFilter } from '@nostr-dev-kit/ndk';

// ========== TYPES ==========

export type ContractPhase =
    | 'PENDING_CONFIRMATION'  // Dev needs to sign
    | 'AWAITING_PR'           // Dev signed, needs to submit PR
    | 'PR_UNDER_REVIEW'       // PR submitted, IO reviewing
    | 'COMPLETED'             // Payment done (future)
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
    let confirmation = $state<ContractConfirmation | null>(null);
    let pr = $state<PullRequest | null>(null);
    let job = $state<Job | null>(null);
    let ioProfile = $state<NDKUserProfile | null>(null);
    let devProfile = $state<NDKUserProfile | null>(null);
    let isLoading = $state(true);
    let isActioning = $state(false);

    // ========== SUBSCRIPTIONS ==========

    let confirmationEvents = $state<any[]>([]);
    let prEvents = $state<any[]>([]);

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

                // Load confirmation and PR
                confirmation = await contractService.getConfirmation(contract.id);
                pr = await contractService.getLatestPR(contract.id);

                // Setup real-time subscriptions
                setupSubscriptions(contract.id);
            }
        } catch (e) {
            console.error('[ContractDetail] Load error:', e);
        } finally {
            isLoading = false;
        }
    }

    function setupSubscriptions(id: string) {
        // Subscribe to confirmation events
        const confirmSub = ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.CONTRACT_CONFIRMATION as number],
            '#e': [id],
            '#s': ['bitspark']
        } as NDKFilter);

        // Subscribe to PR events  
        const prSub = ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.PULL_REQUEST as number],
            '#e': [id],
            '#s': ['bitspark']
        } as NDKFilter);

        // React to subscription updates
        $effect(() => {
            const events = confirmSub;
            if (events && $state.snapshot(events).length > 0 && contract) {
                contractService.getConfirmation(contract.id).then(c => {
                    if (c) confirmation = c;
                });
            }
        });

        $effect(() => {
            const events = prSub;
            if (events && $state.snapshot(events).length > 0 && contract) {
                contractService.getLatestPR(contract.id).then(p => {
                    if (p) pr = p;
                });
            }
        });
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
            confirmation = await contractService.getConfirmation(contract.id);
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
                jobId: contract.jobId,
                ioPubkey: contract.ioPubkey,
                prUrl,
                message
            });
            pr = await contractService.getLatestPR(contract.id);
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
            pr = await contractService.getLatestPR(contract.id);
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
            pr = await contractService.getLatestPR(contract.id);
        } catch (e) {
            console.error('[ContractDetail] Request changes error:', e);
            throw e;
        } finally {
            isActioning = false;
        }
    }

    // ========== PUBLIC API ==========

    return {
        // Data
        contract: () => contract,
        confirmation: () => confirmation,
        pr: () => pr,
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

        // Refresh
        refresh: loadContract
    };
}
