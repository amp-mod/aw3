<script>
	let { user, comments } = $props()
</script>

{#each comments as c}
	<div>
		{comment.author.username}: {comment.text}
	</div>
{/each}
