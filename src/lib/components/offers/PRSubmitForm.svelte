<!--
  PRSubmitForm - Simple form for submitting a PR URL
-->
<script lang="ts">
    import { Button, Input, Textarea, Stack } from '$lib/components';
    import { contractService } from '$lib/services';
    import type { Contract } from '$lib/types/offer';
    import { ExternalLink, Send } from 'lucide-svelte';

    interface Props {
        contract: Contract;
        onsubmit?: () => void;
        oncancel?: () => void;
    }

    let { contract, onsubmit, oncancel }: Props = $props();

    let prUrl = $state('');
    let message = $state('');
    let isSubmitting = $state(false);
    let error = $state('');

    async function handleSubmit() {
        if (!prUrl.trim()) {
            error = 'Please enter a PR URL';
            return;
        }

        // Basic URL validation
        if (!prUrl.includes('github.com') && !prUrl.includes('gitlab.com')) {
            error = 'Please enter a valid GitHub or GitLab PR URL';
            return;
        }

        isSubmitting = true;
        error = '';

        try {
            await contractService.submitPR({
                contractId: contract.id,
                jobId: contract.jobId,
                prUrl: prUrl.trim(),
                message: message.trim(),
                ioPubkey: contract.ioPubkey
            });

            onsubmit?.();
        } catch (e) {
            console.error('[PRSubmitForm] Error:', e);
            error = 'Failed to submit PR. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="pr-form glass-card">
    <Stack gap={4}>
        <h3>Submit Pull Request</h3>

        <div class="form-group">
            <label for="pr-url">GitHub/GitLab PR URL *</label>
            <Input
                id="pr-url"
                type="url"
                placeholder="https://github.com/org/repo/pull/123"
                bind:value={prUrl}
            />
        </div>

        <div class="form-group">
            <label for="pr-message">Message (optional)</label>
            <Textarea
                id="pr-message"
                placeholder="Ready for review! I've added comprehensive tests..."
                rows={3}
                bind:value={message}
            />
        </div>

        {#if error}
            <p class="error">{error}</p>
        {/if}

        <div class="actions">
            {#if oncancel}
                <Button variant="ghost" onclick={oncancel} disabled={isSubmitting}>
                    Cancel
                </Button>
            {/if}
            <Button variant="primary" onclick={handleSubmit} disabled={isSubmitting}>
                {#if isSubmitting}
                    Submitting...
                {:else}
                    <Send size={16} />
                    <span>Submit PR</span>
                {/if}
            </Button>
        </div>
    </Stack>
</div>

<style>
    .pr-form {
        padding: var(--space-5);
    }

    h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    label {
        font-size: 0.875rem;
        color: var(--text-muted);
    }

    .error {
        color: var(--error);
        font-size: 0.875rem;
    }

    .actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
    }
</style>
