<script>
  import { createEventDispatcher } from 'svelte';
  
  export let job;
  
  const dispatch = createEventDispatcher();

  function handleSelect() {
    dispatch('select', { jobId: job.id });
  }
</script>

<div 
  class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
  on:click={handleSelect}
  on:keydown={(e) => e.key === 'Enter' && handleSelect()}
  role="button"
  tabindex="0"
>
  <h3 class="text-xl font-semibold mb-4">
    {job.tags.find(t => t[0] === 'name')?.[1] || 'Unbenannter Job'}
  </h3>

  <div class="prose max-w-none mb-4">
    <p>{job.content}</p>
  </div>

  <div class="flex flex-wrap gap-2">
    {#each job.tags.filter(t => t[0] === 'c') as category}
      <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
        {category[1]}
      </span>
    {/each}
    {#each job.tags.filter(t => t[0] === 'l') as lang}
      <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
        {lang[1]}
      </span>
    {/each}
  </div>
</div>

<style>
  .prose {
    max-width: none;
  }
</style> 