<!--
  PRCard - Display submitted PR (read-only, no actions)
  Actions are handled by IOContractActions/DevContractActions
-->
<script lang="ts">
    import { Badge, Stack, Row } from '$lib/components';
    import { UserAvatar } from '$lib/components';
    import type { PullRequest, Contract } from '$lib/types/offer';
    import { ExternalLink } from 'lucide-svelte';

    interface Props {
        pr: PullRequest;
        contract: Contract;
        onupdate?: () => void;
    }

    let { pr, contract, onupdate }: Props = $props();

    function getStatusBadge() {
        switch (pr.status) {
            case 'approved': return { label: 'Approved', variant: 'success' as const };
            case 'changes_requested': return { label: 'Changes Requested', variant: 'error' as const };
            default: return { label: 'Under Review', variant: 'warning' as const };
        }
    }

    const statusBadge = $derived(getStatusBadge());
</script>

<div class="pr-card">
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

        <!-- Status messages -->
        {#if pr.status === 'approved'}
            <div class="status-message success">
                ✓ PR approved! Payment will be processed.
            </div>
        {/if}
    </Stack>
</div>

<style>
    .pr-card {
        padding: var(--space-4);
        background: var(--bg-subtle);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
    }

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
</style>
