<script>
	let { user } = $props()
</script>

<span>
	{user.displayName || user.username}
</span>
