<script>
	import { enhance } from '$app/forms'
	import Button from '$lib/components/Button.svelte'
	import { getPfpPath } from '$lib/storage-helpers.js'

	let { data } = $props()
	let formElement = $state()

	let isPrivate = $state(data.user.isPrivate)
	let isPending = $state(false)

	$effect(() => {
		isPrivate = data.user.isPrivate
	})

	const handleEnhance = () => {
		isPending = true
		return async ({ result, update }) => {
			if (result.type === 'failure' || result.type === 'error') {
				isPrivate = data.user.isPrivate
			}
			await update()
			isPending = false
		}
	}
</script>

{#snippet settingToggle(id, name, label, description, bindValue)}
	<div class="inline-flex items-start gap-3 py-2">
		<input
			{id}
			{name}
			type="checkbox"
			bind:checked={bindValue.value}
			disabled={isPending}
			onchange={() => formElement.requestSubmit()}
			class="mt-1 h-4 w-4 rounded border-black/10 text-neutral-800 focus:ring-neutral-500 disabled:cursor-not-allowed"
		/>
		<div class="flex flex-col gap-0.5">
			<label for={id} class="cursor-pointer text-sm font-medium text-neutral-800 dark:text-white">
				{label}
			</label>
			{#if description}
				<p class="text-xs text-neutral-500 dark:text-neutral-400">
					{description}
				</p>
			{/if}
		</div>
	</div>
{/snippet}

<h2 class="mb-2 text-3xl font-bold">Profile</h2>

<div class="flex flex-col gap-1">
	<p>Change your bio, profile picture, or featured project on your profile page:</p>

	<div>
		<Button class="inline-flex items-center gap-2" href={`/users/${data.user.username}`}>
			<img
				src={getPfpPath(data.user)['32']}
				alt="Your user icon"
				class="h-7 w-7 rounded border border-black/10"
			/>
			Visit profile
		</Button>
	</div>
	<form
		method="POST"
		action="?/updateSettings"
		use:enhance={handleEnhance}
		bind:this={formElement}
		class="flex flex-col gap-4 {isPending ? 'opacity-70' : ''}"
	>
		{@render settingToggle(
			'privateProfile',
			'isPrivate',
			'Make my profile private',
			'Moderators can view your profile when this setting is enabled. In addition, note that the Featured Project section will be removed from your profile.',
			{
				get value() {
					return isPrivate
				},
				set value(v) {
					isPrivate = v
				},
			},
		)}
	</form>
</div>
