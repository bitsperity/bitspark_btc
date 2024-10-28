<script>
    import { onMount, onDestroy } from "svelte";
    import Menu from "../components/Sidebar/Sidebar.svelte";
    import UserIdeasWidget from "../components/Widgets/UserIdeasWidget.svelte";
    import Footer from "../components/Footers/Footer.svelte";
    import { contentContainerClass } from "../helperStore.js";
    import ToolBar from "../components/Toolbar/Toolbar.svelte";
    import { nostrCache } from "../backend/NostrCacheStore.js";
    import { nostrManager } from "../backend/NostrManagerStore.js";
    import { socialMediaManager } from "../backend/SocialMediaManager.js";
    import ReviewWidget from "../components/Widgets/ReviewWidget.svelte";
    import ProfileWidget from "../components/Widgets/ProfileWidget.svelte";
    import ProfileBannerWidget from "../components/Widgets/Banner/ProfileBannerWidget.svelte";
    import { getPublicKey, nip44 } from 'nostr-tools';

    // Definiere deine geheimen Schlüssel manuell
    const randomKey = "9ab5b12ade1d9c27207ff0264e9fb155c77c9361c9b6a27c865fce1b2c0ddf02";
    const s_pub = "7a72aad06c3291620bab68894f88ac349bf221bc0384741eda2e7e2aca5a7a99";
    // const g_pub = "5d4e32a33237ac19032bfcab10c5f62d3a719cf695a0dfe94d3721057f2b48f6";
    const g_pub = "9d84e447c5e6f114b8738554ba07596cc3421a8d20e4456664a9cb89a63250d6";

    async function encryptMessage(message) {
        console.log("encryptMessage");
        const sealContent = await window.nostr.nip44.encrypt(g_pub, message);
        return sealContent;
    }

    async function wrapMessage(message) {
        console.log("encryptMessage2");
        const conversationKey = nip44.getConversationKey(randomKey, g_pub);
        const encrypted = await nip44.encrypt(message, conversationKey);
        return encrypted;
    }

    async function unwrapMessage(encryptedMessage) {
        console.log("decryptMessage2");
        const decrypted = await window.nostr.nip44.decrypt(getPublicKey(randomKey), encryptedMessage);
        return decrypted;
    }
    
    async function decryptMessage(encryptedMessage) {
        console.log("decryptMessage", $nostrManager.publicKey);
        const decrypted = await window.nostr.nip44.decrypt(s_pub, encryptedMessage);
        return decrypted;
    }

    async function test() {
        const message = "Geheime Nachricht von Alice an Bob";

        const encrypted = await encryptMessage(message);
        console.log("Verschlüsselte Nachricht:", encrypted);


        const encrypted2 = await wrapMessage(encrypted);
        console.log("Verschlüsselte Nachricht 2:", encrypted2);

        const result = "AleUjLVrK3/urQf1QlyaMWpvB9QKHUjzCTl4Qec9vgQI2k2w33N59l/kYfA7QXyj7O5HrDvUb7L+X6esu9MUvM17hT2Ed7y/njRWk2Qshu8YSa6b9wxmnIBjSO72p8JGdrRiTpO7HVoqqKjOPVmW2Cw+ZB1MTS24WrOVvmdwrESkTFnsn/QjDqKMGXUaalLR9HvhecFFjkLdFyiEnzDGj7gFfeotO6wccsTp+qkd1HOfHYMU8nHvqvo3/namdi9noLzI7Fi1Rfnn5Nn0Ei2t+Jodu+MYtujp3BzobnkilI1CH8vdwFuFB2KmPiA5lZ+cp8iiPKZdEHClszrUtutk2pcGAA=="
        const decrypted2 = await unwrapMessage(result);
        console.log("Entschlüsselte Nachricht 2:", decrypted2);


        const decrypted = await decryptMessage(decrypted2);
        console.log("Entschlüsselte Nachricht:", decrypted);
    }

    export let profile_id;

    let profile = null;
    let name = "";
    let banner = "";
    let githubUsername = "";
    let lightningAddress = "";
    let githubRepo = "";

    onMount(() => {
        initialize();
        test();
    });

    function initialize() {
        if (!$nostrManager) {
            return;
        }
        socialMediaManager.subscribeProfile(profile_id);
        fetchProfile();
    }

    onDestroy(() => {
        if (!$nostrManager) {
            return;
        }
        $nostrManager.unsubscribeAll();
    });

    async function fetchProfile() {
        if (!$nostrManager) {
            return;
        }
        profile = await socialMediaManager.getProfile(profile_id);
        if (!profile) {
            return;
        }

        name = profile.name;
        banner = profile.banner;
        githubUsername = profile.githubUsername;
        lightningAddress = profile.lud16;

        if (githubUsername) {
            githubRepo = "https://www.github.com/" + githubUsername;
        } else {
            githubRepo = "";
        }
    }

    $: $nostrManager, initialize();
    $: $nostrCache, fetchProfile();
    $: profile_id, fetchProfile();
</script>

<main class="overview-page">
    <Menu />
    <div class="flex-grow">
        <ProfileBannerWidget {profile_id} />

        <ToolBar lnAddress={lightningAddress} {githubRepo} />

        <div class={$contentContainerClass}>
            <ProfileWidget userPubKey={profile_id} />
            <UserIdeasWidget {profile_id} />
            <ReviewWidget userPubKey={profile_id} />
        </div>
    </div>
    <Footer />
</main>
