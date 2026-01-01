<!--
  OffersTabs - Received/Sent tab navigation
-->
<script lang="ts">
    import { Inbox, Send } from 'lucide-svelte';

    interface Props {
        activeTab: 'received' | 'sent';
        receivedCount: number;
        sentCount: number;
        onTabChange: (tab: 'received' | 'sent') => void;
    }

    let { activeTab, receivedCount, sentCount, onTabChange }: Props = $props();
</script>

<div class="tabs">
    <button 
        class="tab" 
        class:active={activeTab === 'received'}
        onclick={() => onTabChange('received')}
    >
        <Inbox size={18} />
        <span>Received</span>
        {#if receivedCount > 0}
            <span class="tab-count">{receivedCount}</span>
        {/if}
    </button>
    <button 
        class="tab"
        class:active={activeTab === 'sent'}
        onclick={() => onTabChange('sent')}
    >
        <Send size={18} />
        <span>Sent</span>
        {#if sentCount > 0}
            <span class="tab-count">{sentCount}</span>
        {/if}
    </button>
</div>

<style>
    .tabs {
        display: flex;
        gap: var(--space-2);
        background: rgba(255, 255, 255, 0.03);
        padding: var(--space-2);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
    }

    .tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        background: transparent;
        border: none;
        border-radius: var(--radius-md);
        color: var(--text-muted);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .tab:hover {
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.03);
    }

    .tab.active {
        background: var(--orange-500);
        color: white;
    }

    .tab-count {
        background: rgba(0, 0, 0, 0.2);
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
    }

    .tab.active .tab-count {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
