<script>
	let { user, comments } = $props()
</script>

<!-- this is a very lazily made component right now -->
{#each comments as c}
	<div>
		{c.author.username}: {c.text}
	</div>
{/each}
