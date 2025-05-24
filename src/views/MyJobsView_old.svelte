<!-- MyJobsView.svelte -->
<script>
  import Menu from "../components/Sidebar/Sidebar.svelte";
  import Footer from "../components/Footers/Footer.svelte";
  import { contentContainerClass } from "../helperStore.js";
  import Banner from "../components/Banner.svelte";
  import ToolBar from "../components/Toolbar/Toolbar.svelte";
  import MyJobsOverview from "../components/JobManagement/DeveloperView/MyJobsOverview.svelte";

  let bannerImage = "../../img/Banner1u.png";
  let title = "BitSpark";
  let subtitle = "my jobs";
</script>

<main class="overview-page">
  <Menu />
  <div class="flex-grow">
    <Banner {bannerImage} {title} {subtitle} show_right_text={false} />
    <ToolBar />
    <div class={$contentContainerClass}>
      <div class="single-card">
        <div class="single-card-content">
          <MyJobsOverview />
        </div>
      </div>
    </div>
  </div>
  <Footer />
</main>
