<!-- IdeaLabWidget.svelte -->
<script>
    export let title;
    export let subtitle;

</script>

<div class="single-card container">
    <div class="mt-6 px-6" style="position: relative">
        <h2 class="text-color-df">
            {title}
        </h2>
        <div class="single-card-content text-color-df">
            {subtitle}
        </div>
    </div>
</div>

<style>
    .single-card {
        position: relative;
    }
</style>
