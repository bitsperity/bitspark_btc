/**
 * ContractService - Manages contracts with embedded proofs
 */

import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { ndk } from '$lib/nostr';
import { NOSTR_KINDS, APP_TAG } from '$lib/nostr/config';
import type { Contract, CreateContractInput, SignedEventProof } from '$lib/types/offer';
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
     * Republish a contract (Dev confirmation)
     */
    async republishContract(contract: Contract): Promise<void> {
        // Simply republish the same event
        await contract.event.publish();
        console.log('[ContractService] Republished contract:', contract.id);
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
     * Verify contract proofs
     */
    verifyProofs(contract: Contract): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (const proof of contract.proofs) {
            // Check signature exists
            if (!proof.sig) {
                errors.push(`Proof ${proof.id} missing signature`);
            }

            // Check the bid matches
            const bidTag = proof.tags.find(t => t[0] === 'bid');
            if (bidTag && parseInt(bidTag[1], 10) !== contract.agreedBid) {
                errors.push(`Proof ${proof.id} bid mismatch`);
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
     */
    private eventToProof(event: NDKEvent): SignedEventProof {
        return {
            id: event.id,
            pubkey: event.pubkey,
            created_at: event.created_at ?? 0,
            kind: event.kind ?? 0,
            tags: event.tags,
            content: event.content,
            sig: event.sig ?? ''
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
            isRepublished: false,  // Would need to check relay responses
            event
        };
    }
}

export const contractService = new ContractService();
