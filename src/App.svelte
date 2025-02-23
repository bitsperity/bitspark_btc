<!-- App.svelte -->
<script>
  import { Router, Route } from "svelte-routing";

  import Home from "./views/Home.svelte";
  import Tutorial from "./views/Tutorial.svelte";

  import Profile from "./views/Profile.svelte";
  import EditProfile from "./views/EditProfile.svelte";

  import Idea from "./views/Idea.svelte";
  import PostIdea from "./views/PostIdea.svelte";
  import IdeaPreview from "./views/IdeaPreview.svelte";

  import Job from "./views/Job.svelte";
  import JobExplorerView from "./views/JobExplorerView.svelte";
  import MyJobsView_old from "./views/MyJobsView_old.svelte";
  import IdeaLabView_old from "./views/IdeaLabView_old.svelte";
  import IdeaLabView from "./views/IdeaLabView.svelte";
  import DMView from "./views/DMView.svelte";
  import './styles/card.css'; 

  import { NOSTR_KIND_GIFT_WRAP, NOSTR_KIND_IDEA } from "./constants/nostrKinds.js";

  import { nostrManager } from "./backend/NostrManagerStore.js";


  

  function subscribeToMessages() {
    if (!$nostrManager) {
      console.error("NostrManager is not initialized.");
      return;
    }
    $nostrManager.subscribeToEvents({
      kinds: [NOSTR_KIND_IDEA],
      "#s": ["bitspark"], 
    });

    if ($nostrManager.publicKey) {
      $nostrManager.subscribeToEvents({
        kinds: [NOSTR_KIND_GIFT_WRAP],
        "#p": [$nostrManager.publicKey],
      });
    }
  }

  $: subscribeToMessages(), $nostrManager;
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
  />
</svelte:head>

<Router>
  <div>
    <nav>
      <!-- Navigation links here -->
    </nav>
    <main>
      <Route path="/" component={Home} />
      <Route path="/tutorial/:id" component={Tutorial} />
      <Route path="/overview/:category" let:params component={Home} />

      <Route path="/profile/:profile_id" let:params component={Profile} />
      <Route
        path="/edit_profile/:profile_id"
        let:params
        component={EditProfile}
      />

      <Route path="/idea/:id" component={Idea} />
      <Route path="/postidea" component={PostIdea} />
      <Route path="/preview" component={IdeaPreview} />

      <Route path="/job/:id" component={Job} />
      <Route path="/jobexplorer" component={JobExplorerView} />
      <Route path="/myjobs_old" component={MyJobsView_old} />
      <Route path="/idealab_old" component={IdeaLabView_old} />
      <Route path="/idealab" component={IdeaLabView} />
      <!-- <Route path="/dm" component={DMView} /> -->
      <Route path="/dm/:pubkey" let:params>
        <DMView {params} />
      </Route>
      <Route path="/dm" let:params>
        <DMView {params} />
      </Route>
      
      
    </main>
  </div>
</Router>
