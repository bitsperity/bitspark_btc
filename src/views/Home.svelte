<!-- Overview.svelte -->
<script>
  import "websocket-polyfill";
  import Menu from "../components/Sidebar/Sidebar.svelte";
  import Banner from "../components/Banner.svelte";
  import Footer from "../components/Footers/Footer.svelte";
  import ToolBar from "../components/Toolbar/Toolbar.svelte";
  import Feed from "../components/Feed/Feed.svelte";
  import { contentContainerClass } from "../helperStore.js";

  let bannerImage = "../../img/Banner1u.png";
  let title = "BitSpark";
  let subtitle = "idea engine";
</script>

<main class="overview-page">
  <Menu />
  <div class="flex-grow">
    <Banner {bannerImage} {title} {subtitle} show_right_text={true} />
    <ToolBar />
    <div class={$contentContainerClass}>
      <Feed />
    </div>
    <Footer />
  </div>
</main>
