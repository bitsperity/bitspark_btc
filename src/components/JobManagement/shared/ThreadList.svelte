<script>
  import { createEventDispatcher } from 'svelte';
  import OfferThread from './OfferThread.svelte';
  import { nostrManager } from '../../../backend/NostrManagerStore.js';

  export let threads = [];
  export let role = 'io';

  const dispatch = createEventDispatcher();

  // Sortierung: Aktive Threads zuerst, dann nach Datum
  $: sortedThreads = [...threads].sort((a, b) => {
    // Aktive Threads (pending) zuerst
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;

    // Dann nach Datum (neueste zuerst)
    const aDate = a.counterOffers[a.counterOffers.length - 1]?.created_at || a.initialOffer.created_at;
    const bDate = b.counterOffers[b.counterOffers.length - 1]?.created_at || b.initialOffer.created_at;
    return bDate - aDate;
  });

  // Gruppierung nach Status
  $: threadGroups = {
    pending: sortedThreads.filter(t => t.status === 'pending'),
    approved: sortedThreads.filter(t => t.status === 'approved'),
    declined: sortedThreads.filter(t => t.status === 'declined'),
    contracted: sortedThreads.filter(t => t.status === 'contracted')
  };

  // Status Labels
  const statusLabels = {
    pending: 'Aktive Verhandlungen',
    approved: 'Genehmigte Angebote',
    declined: 'Abgelehnte Angebote',
    contracted: 'Verträge erstellt'
  };
</script>

<div class="space-y-8">
  <!-- Aktive Verhandlungen -->
  {#if threadGroups.pending.length > 0}
    <section>
      <h2 class="text-lg font-medium mb-4 flex items-center">
        <div class="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
        {statusLabels.pending}
        <span class="ml-2 text-sm text-gray-500">({threadGroups.pending.length})</span>
      </h2>
      
      <div class="space-y-4">
        {#each threadGroups.pending as thread (thread.id)}
          <OfferThread
            {thread}
            {role}
            expanded={true}
            on:counterOffer
            on:accept
            on:decline
            on:createContract
          />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Genehmigte Angebote -->
  {#if threadGroups.approved.length > 0}
    <section>
      <h2 class="text-lg font-medium mb-4 flex items-center">
        <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        {statusLabels.approved}
        <span class="ml-2 text-sm text-gray-500">({threadGroups.approved.length})</span>
      </h2>
      
      <div class="space-y-4">
        {#each threadGroups.approved as thread (thread.id)}
          <OfferThread
            {thread}
            {role}
            on:counterOffer
            on:accept
            on:decline
            on:createContract
          />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Abgelehnte Angebote -->
  {#if threadGroups.declined.length > 0}
    <section>
      <h2 class="text-lg font-medium mb-4 flex items-center">
        <div class="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
        {statusLabels.declined}
        <span class="ml-2 text-sm text-gray-500">({threadGroups.declined.length})</span>
      </h2>
      
      <div class="space-y-4">
        {#each threadGroups.declined as thread (thread.id)}
          <OfferThread
            {thread}
            {role}
            on:counterOffer
            on:accept
            on:decline
            on:createContract
          />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Verträge -->
  {#if threadGroups.contracted.length > 0}
    <section>
      <h2 class="text-lg font-medium mb-4 flex items-center">
        <div class="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
        {statusLabels.contracted}
        <span class="ml-2 text-sm text-gray-500">({threadGroups.contracted.length})</span>
      </h2>
      
      <div class="space-y-4">
        {#each threadGroups.contracted as thread (thread.id)}
          <OfferThread
            {thread}
            {role}
            on:counterOffer
            on:accept
            on:decline
            on:createContract
          />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Keine Threads -->
  {#if threads.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>Noch keine Verhandlungen vorhanden.</p>
    </div>
  {/if}
</div> 