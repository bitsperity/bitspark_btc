<script>
  import { nostrManager } from "../../backend/NostrManagerStore.js";
  import { onMount, onDestroy } from "svelte";
  import { socialMediaManager } from "../../backend/SocialMediaManager.js";
  import LikeIcon from "../LikeIcon.svelte";
  import ShareIcon from "../ShareIcon.svelte";
  import { navigate } from "svelte-routing";
  
  export let card;

  function goToJob() {
    navigate(`/job/${card.id}`);
  }

  function truncateMessage(message, maxLength) {
    const strippedMessage = message.replace(/<[^>]+>/g, "");
    return strippedMessage.length <= maxLength
      ? message
      : message.slice(0, maxLength) + "...";
  }

  onMount(() => {
    initialize();
  });

  function initialize() {
    if(card) {
      socialMediaManager.getProfile(card.profile);
    }
  }

  $: $nostrManager, initialize();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="bitspark-card">
  <div class="bitspark-card-content" on:click={goToJob}>
    <img
      src={card.bannerImage}
      alt="Banner of {card.title}"
      class="bitspark-card-banner-image"
    />
    <div class="content">
      <h3>{card.title}</h3>
      <h4>{card.sats} Sats</h4>
      <p>{truncateMessage(card.abstract, 500)}</p>
    </div>
  </div>
  <div class="bitspark-card-actions">
    <LikeIcon event_id={card.id} />
    <ShareIcon event_id={card.id} />
  </div>
</div>
