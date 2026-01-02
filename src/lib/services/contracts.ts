/**
 * ContractService - Manages contracts with embedded proofs
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS, APP_TAG } from '$lib/nostr/config';
import type { Contract, ContractConfirmation, CreateContractInput, SignedEventProof, PullRequest, SubmitPRInput, PRStatus } from '$lib/types/offer';
import { createTagAccessors, parseBaseEvent } from '$lib/utils';

class ContractService {
    /**
     * Create a contract with embedded proofs
     * Called by IO after dev accepts
     */
    async createContract(input: CreateContractInput): Promise<NDKEvent> {
        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.CONTRACT;
        event.content = input.message;

        const dTag = `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Convert events to proof format
        const counterProof = this.eventToProof(input.counterOffer);
        const acceptProof = this.eventToProof(input.acceptOffer);

        event.tags = [
            ['d', dTag],
            ['e', input.jobId, '', 'job'],
            ['e', input.acceptedOfferId, '', 'accepted'],
            ['p', input.developerPubkey],
            ['p', ndk.activeUser?.pubkey ?? ''],
            ['bid', input.agreedBid.toString()],
            ['proof', JSON.stringify(counterProof)],
            ['proof', JSON.stringify(acceptProof)],
            APP_TAG
        ];

        await event.publish();
        console.log('[ContractService] Created contract:', event.id);

        return event;
    }

    /**
     * Confirm a contract (Dev signs confirmation with full contract payload)
     * Creates a CONTRACT_CONFIRMATION event signed by Dev containing the full original contract
     */
    async confirmContract(contract: Contract): Promise<NDKEvent> {
        const event = new NDKEvent(ndk);
        event.kind = NOSTR_KINDS.CONTRACT_CONFIRMATION;

        // Content is the full original contract with IO's signature
        event.content = JSON.stringify({
            originalContract: {
                id: contract.event.id,
                pubkey: contract.event.pubkey,
                sig: contract.event.sig,
                created_at: contract.event.created_at,
                kind: contract.event.kind,
                tags: contract.event.tags,
                content: contract.event.content
            },
            confirmedAt: Math.floor(Date.now() / 1000)
        });

        // Tags reference the contract and parties
        event.tags = [
            ['e', contract.id, '', 'contract'],      // Reference to original contract
            ['e', contract.jobId, '', 'job'],         // Reference to job
            ['p', contract.ioPubkey],                 // IO pubkey
            ['s', 'bitspark']                         // App tag
        ];

        // Dev signs this event - Alby will prompt!
        await event.publish();
        console.log('[ContractService] Contract confirmation created:', event.id);

        return event;
    }

    /**
     * Get confirmation for a contract (if exists)
     */
    async getConfirmation(contractId: string): Promise<ContractConfirmation | null> {
        const events = await ndk.fetchEvents({
            kinds: [NOSTR_KINDS.CONTRACT_CONFIRMATION as number],
            '#e': [contractId],
            '#s': ['bitspark']
        } as NDKFilter);

        if (!events || events.size === 0) return null;

        const event = Array.from(events)[0];
        return this.parseConfirmationEvent(event as unknown as NDKEvent);
    }

    /**
     * Parse confirmation event
     */
    private parseConfirmationEvent(event: NDKEvent): ContractConfirmation {
        const parsed = JSON.parse(event.content);
        const contractTag = event.tags.find(t => t[0] === 'e' && t[3] === 'contract');

        return {
            id: event.id ?? '',
            pubkey: event.pubkey,
            createdAt: event.created_at ?? 0,
            event,
            contractId: contractTag?.[1] ?? '',
            developerPubkey: event.pubkey,
            confirmedAt: parsed.confirmedAt ?? event.created_at ?? 0,
            originalContract: parsed.originalContract
        };
    }

    /**
     * Subscribe to contracts for current user
     */
    subscribeToMyContracts() {
        const user = ndk.activeUser;
        if (!user) return null;

        return ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.CONTRACT as number],
            '#p': [user.pubkey],
            '#s': ['bitspark']
        } as NDKFilter);
    }

    /**
     * Subscribe to contracts for a job
     */
    subscribeToJobContracts(jobId: string) {
        return ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.CONTRACT as number],
            '#e': [jobId],
            '#s': ['bitspark']
        } as NDKFilter);
    }

    /**
     * Fetch a single contract
     */
    async getContract(contractId: string): Promise<Contract | null> {
        const event = await ndk.fetchEvent(contractId);
        if (!event) return null;
        return this.parseContractEvent(event as unknown as NDKEvent);
    }

    /**
     * Find contract for a specific job
     */
    async getContractByJobId(jobId: string): Promise<Contract | null> {
        const events = await ndk.fetchEvents({
            kinds: [NOSTR_KINDS.CONTRACT as number],
            '#e': [jobId],
            '#s': ['bitspark']
        } as NDKFilter);

        if (!events || events.size === 0) return null;

        const firstEvent = Array.from(events)[0];
        return this.parseContractEvent(firstEvent as unknown as NDKEvent);
    }

    /**
     * Verify contract proofs
     * Proofs must be signed events to be cryptographically valid
     */
    verifyProofs(contract: Contract): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (const proof of contract.proofs) {
            // Signature is required for proof validity
            if (!proof.sig) {
                errors.push(`Proof ${proof.id.slice(0, 8)}... missing signature`);
            }

            // Check the bid matches
            const bidTag = proof.tags.find(t => t[0] === 'bid');
            if (bidTag && parseInt(bidTag[1], 10) !== contract.agreedBid) {
                errors.push(`Proof ${proof.id.slice(0, 8)}... bid mismatch`);
            }

            // Check pubkey exists
            if (!proof.pubkey) {
                errors.push(`Proof ${proof.id.slice(0, 8)}... missing pubkey`);
            }
        }

        // Check we have at least 2 proofs (counter + accept)
        if (contract.proofs.length < 2) {
            errors.push('Contract requires at least 2 proofs');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert NDKEvent to SignedEventProof
     * Reads signature from 'orig_sig' tag if event.sig is empty (GiftWrap unwrapped)
     */
    private eventToProof(event: NDKEvent): SignedEventProof {
        // Try to get signature from event.sig first, then from orig_sig tag
        let sig = event.sig ?? '';
        if (!sig) {
            const origSigTag = event.tags.find(t => t[0] === 'orig_sig');
            if (origSigTag) {
                sig = origSigTag[1];
            }
        }

        return {
            id: event.id,
            pubkey: event.pubkey,
            created_at: event.created_at ?? 0,
            kind: event.kind ?? 0,
            tags: event.tags,
            content: event.content,
            sig
        };
    }

    /**
     * Parse NDKEvent to Contract
     */
    parseContractEvent(event: NDKEvent): Contract {
        const { getTag, getTags } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        // Find references
        const jobTag = event.tags.find(t => t[0] === 'e' && t[3] === 'job');
        const acceptTag = event.tags.find(t => t[0] === 'e' && t[3] === 'accepted');
        const pTags = getTags('p');

        // Parse proofs
        const proofs: SignedEventProof[] = event.tags
            .filter(t => t[0] === 'proof')
            .map(t => {
                try {
                    return JSON.parse(t[1]) as SignedEventProof;
                } catch {
                    return null;
                }
            })
            .filter((p): p is SignedEventProof => p !== null);

        return {
            ...base,
            jobId: jobTag?.[1] ?? '',
            acceptedOfferId: acceptTag?.[1] ?? '',
            developerPubkey: pTags[0] ?? '',
            ioPubkey: pTags[1] ?? event.pubkey,
            agreedBid: parseInt(getTag('bid') ?? '0', 10),
            message: event.content,
            proofs,
            event
        };
    }

    // ========================================
    // PULL REQUEST METHODS
    // ========================================

    /**
     * Submit a PR (Dev action)
     * Requires confirmation event for complete proof chain
     */
    async submitPR(input: SubmitPRInput): Promise<NDKEvent> {
        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.PULL_REQUEST;
        event.content = input.message;

        const dTag = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        event.tags = [
            ['d', dTag],
            ['e', input.contractId, '', 'contract'],
            ['e', input.confirmationId, '', 'confirmation'],  // Dev's signed confirmation
            ['e', input.jobId, '', 'job'],
            ['p', input.ioPubkey],
            ['pr_url', input.prUrl],
            ['status', 'submitted'],
            APP_TAG
        ];

        await event.publish();
        console.log('[ContractService] Submitted PR:', event.id);

        return event;
    }

    /**
     * Approve PR (IO action) - triggers payment
     * Uses unique d-tag to avoid replacing other IO actions
     */
    async approvePR(pr: PullRequest, feedback: string): Promise<NDKEvent> {
        const dTag = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.PULL_REQUEST;
        event.content = pr.message;  // Preserve original PR message

        event.tags = [
            ['d', dTag],  // Unique d-tag!
            ['e', pr.contractId, '', 'contract'],
            ['e', pr.jobId, '', 'job'],
            ['e', pr.id, '', 'pr'],  // Reference to the PR being reviewed
            ['p', pr.developerPubkey],
            ['pr_url', pr.prUrl],
            ['status', 'approved'],
            ['review_message', feedback],
            APP_TAG
        ];

        await event.publish();
        console.log('[ContractService] Approved PR:', event.id);

        return event;
    }

    /**
     * Request changes on PR (IO action)
     * Uses unique d-tag to preserve event history
     */
    async requestChanges(pr: PullRequest, feedback: string): Promise<NDKEvent> {
        const dTag = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const event = new NDKEvent(ndk as unknown as ConstructorParameters<typeof NDKEvent>[0]);
        event.kind = NOSTR_KINDS.PULL_REQUEST;
        event.content = pr.message;  // Preserve original message

        event.tags = [
            ['d', dTag],  // Unique d-tag!
            ['e', pr.contractId, '', 'contract'],
            ['e', pr.jobId, '', 'job'],
            ['e', pr.id, '', 'pr'],  // Reference to the PR being reviewed
            ['p', pr.developerPubkey],
            ['pr_url', pr.prUrl],
            ['status', 'changes_requested'],
            ['review_message', feedback],
            APP_TAG
        ];

        await event.publish();
        console.log('[ContractService] Requested changes:', event.id);

        return event;
    }

    /**
     * Subscribe to PRs for a contract
     */
    subscribeToPRs(contractId: string) {
        return ndk.storeSubscribe({
            kinds: [NOSTR_KINDS.PULL_REQUEST as number],
            '#e': [contractId],
            '#s': ['bitspark']
        } as NDKFilter);
    }

    /**
     * Get latest PR for a contract
     */
    async getLatestPR(contractId: string): Promise<PullRequest | null> {
        const events = await ndk.fetchEvents({
            kinds: [NOSTR_KINDS.PULL_REQUEST as number],
            '#e': [contractId],
            '#s': ['bitspark']
        } as NDKFilter);

        if (events.size === 0) return null;

        // Get latest by created_at
        const sorted = Array.from(events).sort((a, b) =>
            (b.created_at ?? 0) - (a.created_at ?? 0)
        );

        return this.parsePREvent(sorted[0] as unknown as NDKEvent);
    }

    /**
     * Get ALL PRs for a contract (for timeline history)
     */
    async getAllPRs(contractId: string): Promise<PullRequest[]> {
        const events = await ndk.fetchEvents({
            kinds: [NOSTR_KINDS.PULL_REQUEST as number],
            '#e': [contractId],
            '#s': ['bitspark']
        } as NDKFilter);

        console.log('[ContractService] getAllPRs raw event count:', events.size);
        console.log('[ContractService] getAllPRs events:', Array.from(events).map(e => ({
            id: e.id?.slice(0, 8),
            pubkey: e.pubkey?.slice(0, 8),
            dTag: e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 8),
            status: e.tags.find(t => t[0] === 'status')?.[1],
            content: e.content?.slice(0, 20),
            created_at: new Date((e.created_at ?? 0) * 1000).toLocaleTimeString()
        })));

        if (events.size === 0) return [];

        // Sort by created_at ascending (oldest first)
        const sorted = Array.from(events).sort((a, b) =>
            (a.created_at ?? 0) - (b.created_at ?? 0)
        );

        return sorted.map(e => this.parsePREvent(e as unknown as NDKEvent));
    }

    /**
     * Parse NDKEvent to PullRequest
     */
    parsePREvent(event: NDKEvent): PullRequest {
        const { getTag, getTags } = createTagAccessors(event);
        const base = parseBaseEvent(event);

        const contractTag = event.tags.find(t => t[0] === 'e' && t[3] === 'contract');
        const jobTag = event.tags.find(t => t[0] === 'e' && t[3] === 'job');
        const pTags = getTags('p');

        return {
            ...base,
            contractId: contractTag?.[1] ?? '',
            jobId: jobTag?.[1] ?? '',
            prUrl: getTag('pr_url') ?? '',
            message: event.content,
            status: (getTag('status') ?? 'submitted') as PRStatus,
            developerPubkey: pTags[0] ?? event.pubkey,  // Dev from p-tag, or author if dev submission
            ioPubkey: pTags[1] ?? '',
            reviewMessage: getTag('review_message') || undefined,
            pubkey: event.pubkey,  // Event author
            event
        };
    }
}

export const contractService = new ContractService();

