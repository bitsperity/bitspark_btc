<script>
    import IdeaSelector from "../common/selectors/IdeaSelector.svelte";
    import JobSelector from "./common/JobSelector.svelte";
    import { selectedIdeaIds } from "../../stores/common/ideaStore";
    import NegotiationWidget from "../common/negotiations/NegotiationWidget.svelte";
</script>

<!-- Idea Selector -->
<IdeaSelector />

<!-- Job Selector -->
<JobSelector ideaIds={$selectedIdeaIds} />

<div>
    <NegotiationWidget />
</div> 