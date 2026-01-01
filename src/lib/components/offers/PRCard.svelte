<!--
  PRCard - Display submitted PR with review actions
-->
<script lang="ts">
    import { Button, Badge, Stack, Row, Card, Textarea } from '$lib/components';
    import { UserAvatar } from '$lib/components';
    import { contractService, authService } from '$lib/services';
    import type { PullRequest, Contract } from '$lib/types/offer';
    import { ExternalLink, Check, X, MessageSquare } from 'lucide-svelte';

    interface Props {
        pr: PullRequest;
        contract: Contract;
        onupdate?: () => void;
    }

    let { pr, contract, onupdate }: Props = $props();

    let reviewMessage = $state('');
    let showReviewForm = $state(false);
    let isSubmitting = $state(false);

    const isIO = $derived(authService.user?.pubkey === contract.ioPubkey);
    const isDev = $derived(authService.user?.pubkey === contract.developerPubkey);
    const canReview = $derived(isIO && pr.status === 'submitted');

    async function handleApprove() {
        isSubmitting = true;
        try {
            await contractService.approvePR(pr, reviewMessage.trim() || 'Approved! Great work.');
            onupdate?.();
        } catch (e) {
            console.error('[PRCard] Approve error:', e);
        } finally {
            isSubmitting = false;
        }
    }

    async function handleRequestChanges() {
        if (!reviewMessage.trim()) {
            showReviewForm = true;
            return;
        }
        
        isSubmitting = true;
        try {
            await contractService.requestChanges(pr, reviewMessage.trim());
            onupdate?.();
        } catch (e) {
            console.error('[PRCard] Request changes error:', e);
        } finally {
            isSubmitting = false;
        }
    }

    function getStatusBadge() {
        switch (pr.status) {
            case 'approved': return { label: 'Approved', variant: 'success' as const };
            case 'changes_requested': return { label: 'Changes Requested', variant: 'error' as const };
            default: return { label: 'Under Review', variant: 'warning' as const };
        }
    }

    const statusBadge = $derived(getStatusBadge());
</script>

<Card class="pr-card">
    <Stack gap={4}>
        <Row justify="between">
            <Row gap={3}>
                <UserAvatar pubkey={pr.developerPubkey} size="sm" />
                <div>
                    <span class="pr-label">Pull Request</span>
                    <span class="pr-time">
                        {new Date(pr.createdAt * 1000).toLocaleDateString()}
                    </span>
                </div>
            </Row>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </Row>

        <!-- PR Link -->
        <a href={pr.prUrl} target="_blank" rel="noopener noreferrer" class="pr-link">
            <ExternalLink size={16} />
            <span>{pr.prUrl}</span>
        </a>

        <!-- Developer Message -->
        {#if pr.message}
            <div class="message">
                <p>{pr.message}</p>
            </div>
        {/if}

        <!-- Review response (if any) -->
        {#if pr.reviewMessage}
            <div class="review-response">
                <span class="review-label">Review Response:</span>
                <p>{pr.reviewMessage}</p>
            </div>
        {/if}

        <!-- IO Review Actions -->
        {#if canReview}
            <div class="review-section">
                {#if showReviewForm}
                    <Stack gap={3}>
                        <Textarea
                            placeholder="Describe the changes needed..."
                            rows={3}
                            bind:value={reviewMessage}
                        />
                        <Row gap={2}>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onclick={() => showReviewForm = false}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onclick={handleRequestChanges}
                                disabled={isSubmitting || !reviewMessage.trim()}
                            >
                                <X size={14} />
                                <span>Request Changes</span>
                            </Button>
                        </Row>
                    </Stack>
                {:else}
                    <Row gap={2}>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onclick={() => showReviewForm = true}
                        >
                            <MessageSquare size={14} />
                            <span>Add Comment</span>
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onclick={() => showReviewForm = true}
                        >
                            <X size={14} />
                            <span>Request Changes</span>
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onclick={handleApprove}
                            disabled={isSubmitting}
                        >
                            <Check size={14} />
                            <span>Approve & Pay</span>
                        </Button>
                    </Row>
                {/if}
            </div>
        {/if}

        <!-- Status messages -->
        {#if pr.status === 'approved'}
            <div class="status-message success">
                ✓ PR approved! Payment should be processed.
            </div>
        {:else if pr.status === 'changes_requested' && isDev}
            <div class="status-message warning">
                Changes were requested. Please update your PR and resubmit.
            </div>
        {/if}
    </Stack>
</Card>

<style>
    .pr-label {
        font-weight: 500;
        color: var(--text-primary);
        display: block;
    }

    .pr-time {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .pr-link {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: rgba(255, 255, 255, 0.03);
        border-radius: var(--radius-md);
        color: var(--orange-400);
        text-decoration: none;
        font-size: 0.875rem;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: background 0.2s ease;
    }

    .pr-link:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .message,
    .review-response {
        padding: var(--space-3);
        background: rgba(255, 255, 255, 0.02);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
    }

    .message p,
    .review-response p {
        margin: 0;
        color: var(--text-secondary);
    }

    .review-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        display: block;
        margin-bottom: var(--space-1);
    }

    .review-section {
        padding-top: var(--space-3);
        border-top: 1px solid var(--border-subtle);
    }

    .status-message {
        padding: var(--space-3);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        text-align: center;
    }

    .status-message.success {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
    }

    .status-message.warning {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
    }
</style>
