<script>
    import Menu from "../components/Sidebar/Sidebar.svelte";
    import Footer from "../components/Footers/Footer.svelte";
    import { contentContainerClass } from "../helperStore.js";
    import ToolBar from "../components/Toolbar/Toolbar.svelte";
    import Banner from "../components/Banner.svelte";
    import ModeSelector from "../components/common/selectors/SimpleModeSelector.svelte";
    import { currentMode } from "../stores/common/modeStore";
    import ManageContainer from "../components/workspace/ManageContainer.svelte";
    import ArchiveContainer from "../components/workspace/ArchiveContainer.svelte";
    import StatisticsContainer from "../components/workspace/StatisticsContainer.svelte";
    import { nostrManager } from "../backend/NostrManagerStore.js";
    import { NOSTR_KIND_JOB, NOSTR_KIND_APPROVAL, NOSTR_KIND_GIFT_WRAP } from "../constants/nostrKinds.js";

    let bannerImage = "../../img/tutorial/nostr_banner.png";
    let title = "Workspace";
    let subtitle = "manage your workspace";

    const modeContainers = {
        'Manage': ManageContainer,
        'Archive': ArchiveContainer,
        'Statistics': StatisticsContainer
    };

    const workspaceModes = Object.keys(modeContainers);

    function subscribeToEvents() {
        $nostrManager.subscribeToEvents({
        kinds: [NOSTR_KIND_JOB],
        "#s": ["bitspark"], 
        });

        $nostrManager.subscribeToEvents({
            kinds: [NOSTR_KIND_APPROVAL],
            "#s": ["bitspark"], 
        });

        if ($nostrManager.publicKey) {
            $nostrManager.subscribeToEvents({
                kinds: [NOSTR_KIND_GIFT_WRAP],
                "#p": [$nostrManager.publicKey],
            });
        }
    }

    $: if ($nostrManager) {
        subscribeToEvents();
    }
</script>

<main class="overview-page">
    <Menu />
    <div class="flex-grow">
        <Banner
          bannerImage={bannerImage}
          title={title}
          subtitle={subtitle}
          show_right_text={false}
        />

        <ToolBar />

        <!-- Mode Selector -->
        <ModeSelector modes={workspaceModes} />

        <div class={$contentContainerClass}>
            {#if $currentMode}
                <svelte:component this={modeContainers[$currentMode]} />
            {:else}
                <div class="text-center text-gray-600">
                    Please select a mode to continue
                </div>
            {/if}
        </div>
    </div>
    <Footer />
</main>
