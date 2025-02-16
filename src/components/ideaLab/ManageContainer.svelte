<script>
    import IdeaLabWidget from "../Widgets/IdeaLabWidget.svelte";
    import IdeaSelector from "../common/selectors/IdeaSelector.svelte";
    import JobSelector from "../common/selectors/JobSelector.svelte";
    import { selectedIdeaIds } from "../../stores/common/ideaStore";
    import NegotiationWidget from "./negotiation/NegotiationWidget.svelte";
</script>

<!-- Idea Selector -->
<IdeaSelector />

<!-- Job Selector -->
<JobSelector ideaIds={$selectedIdeaIds} />

<div>
    <NegotiationWidget />
    <IdeaLabWidget title={"Contracts"} subtitle={"View and manage your contracts"} />
    <IdeaLabWidget title={"Pull Requests"} subtitle={"Handle code contributions"} />
</div> 