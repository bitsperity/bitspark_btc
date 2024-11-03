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
  import MyJobsView from "./views/MyJobsView.svelte";
  import IdeaLabView from "./views/IdeaLabView.svelte";
  import DMView from "./views/DMView.svelte";
  import './styles/card.css'; 
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
      <Route path="/myjobs" component={MyJobsView} />
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
