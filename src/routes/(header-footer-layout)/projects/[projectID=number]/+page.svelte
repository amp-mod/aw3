<script>
  import { page } from '$app/state';
  const projectID = $state(page.params.projectID);
</script>

<svelte:head>
  <title>Project with ID {projectID} - AmpMod</title>
</svelte:head>

<h1>{projectID}</h1>
<p><a href={`/projects/${projectID}/editor`}>Edit</a></p>
