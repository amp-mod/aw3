<script lang="ts">
	import { enhance } from '$app/forms'
	import { RefreshCw, Clipboard, ArrowLeft } from '@lucide/svelte'
	import IconScratch from '~icons/simple-icons/scratch'
	import { slide } from 'svelte/transition'
	import Button from '$lib/components/Button.svelte'
	import { goto } from '$app/navigation'

	let { data, form } = $props()
	let loading = $state(false)

	// Reactive state to determine which step we are on
	let currentStep = $derived(form?.step ?? data.step)
	// Reactive state to get the current username being verified
	let currentUsername = $derived(form?.username ?? data.username)
	// Reactive state to get the comment
	let currentComment = $derived(form?.verificationComment ?? data.verificationComment)

	let projects = $state(data.projects)

	function copyToClipboard() {
		navigator.clipboard.writeText(currentComment ?? '')
	}

	function handleCopy(id: number) {
		goto(`/upload?scratch_id=${id}`)
	}
</script>

<div class="mb-6 flex items-center gap-3 pb-2">
	<h3 class="text-2xl font-bold">Scratch account</h3>
	<div class="grow"></div>
	<span>
		Linked to
		<a
			href="https://scratch.mit.edu/users/{data.linkedUsername}"
			class="link text-lg"
			target="_blank"
			rel="noopener noreferer">@{data.linkedUsername}</a
		>
	</span>
</div>

{#if data.isLinked}
	{#if projects.length > 0}
		<div class="grid gap-3">
			{#each projects as project}
				<div
					class="flex items-center justify-between rounded border border-black/10 bg-white/5 p-3 dark:border-white/10"
				>
					<div class="flex items-center gap-3">
						<div class="flex h-20 items-center justify-center overflow-hidden rounded bg-black/20">
							<img src={project.image} alt="" class="aspect-[4/3] h-full object-cover" />
						</div>
						<div>
							<span class="block font-medium">{project.title}</span>
						</div>
					</div>

					<Button onclick={() => handleCopy(project.id)} variant="secondary" size="sm">
						Upload
					</Button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-neutral-500 italic">No projects found for this account.</p>
	{/if}
{:else if currentStep === 1}
	<section in:slide>
		<form
			method="POST"
			action="?/setup"
			use:enhance={() => {
				loading = true
				return ({ update }) => {
					loading = false
					update() // Ensures form state is preserved
				}
			}}
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<p>
						Get the best of both worlds. Sync your projects by linking your Scratch account. To
						verify and link your Scratch account, enter its username below.
					</p>
					<p><i>AmpMod is not affiliated with Scratch.</i></p>
					<input
						type="text"
						name="username"
						placeholder="e.g. griffpatch"
						required
						class="rounded border border-black/10 bg-white/5 p-3 outline-none focus:ring-2 focus:ring-[#855cd6]/50 dark:border-white/10"
					/>
				</div>
				<Button type="submit" disabled={loading}>
					{loading ? 'Processing...' : 'Continue'}
				</Button>
			</div>
		</form>
	</section>
{:else}
	<section in:slide class="flex flex-col gap-6">
		<div class="rounded border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
			<p>
				To prevent impersonation, you need to verify your account. Please copy the text below and
				post it as a comment on <a
					href="https://scratch.mit.edu/users/{currentUsername}"
					class="link"
					target="_blank"
					rel="noopener noreferer">your Scratch profile</a
				>.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<span class="text-xs font-semibold text-neutral-500 uppercase">Copy this comment:</span>
			<div class="relative">
				<textarea
					readonly
					value={currentComment}
					class="h-28 w-full rounded border border-black/10 bg-black/5 p-3 font-mono text-xs dark:border-white/10 dark:bg-white/5"
				></textarea>
				<button
					type="button"
					onclick={copyToClipboard}
					class="absolute top-2 right-2 rounded bg-white p-2 shadow-sm hover:bg-neutral-100 dark:bg-neutral-800"
				>
					<Clipboard size={14} />
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<form
				method="POST"
				action="?/verify"
				use:enhance={() => {
					loading = true
					return ({ update }) => {
						loading = false
						update()
					}
				}}
			>
				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}<RefreshCw size={16} class="mr-2 animate-spin" />{/if}
					Verify Identity
				</Button>
			</form>

			<form method="POST" action="?/reset" use:enhance>
				<button
					type="submit"
					class="flex items-center gap-1 text-xs text-neutral-500 hover:underline"
				>
					<ArrowLeft size={12} /> Use a different username
				</button>
			</form>
		</div>
	</section>
{/if}

{#if form?.message}
	<p transition:slide class="mt-4 text-center text-sm font-medium text-red-500">
		{form.message}
	</p>
{/if}

{#if form?.success}
	<div
		class="mt-4 rounded border border-green-500/20 bg-green-500/10 p-4 text-center font-bold text-green-600"
	>
		Success! Your account is linked.
	</div>
{/if}
