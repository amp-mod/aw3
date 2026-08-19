<script lang="ts">
	import { Button } from 'bits-ui'

	let { children, class: className = '', ...props } = $props()
	const classes = [
		'rounded-lg bg-accent px-4 py-1.5 text-center text-lg font-bold text-white transition-colors',
		'cursor-pointer disabled:cursor-not-allowed not-disabled:hover:bg-accent-secondary disabled:opacity-70',
	]
</script>

<Button.Root class={[classes, className]} {...props}>
	{@render children()}
</Button.Root>
