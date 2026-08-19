<script lang="ts">
	import { Pencil, FolderOpen, Gavel, Lock, Save, Loader, UsersRound, X } from '@lucide/svelte'
	import { enhance } from '$app/forms'
	import { rankMap, isStaff } from '$lib/ranks'
	import { md } from '$lib/markdown'
	import Modal from '$lib/components/Modal.svelte'
	import { m } from '$lib/paraglide/messages'
	import Button from '$lib/components/Button.svelte'
	import Tiptap from '$lib/components/Tiptap.svelte'
	import Row from '$lib/components/Row.svelte'
	import UserList from '$lib/components/UserList.svelte'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import DOMPurify from 'isomorphic-dompurify'
	import { getPfpPath, getPublicUrl } from '$lib/storage-helpers.js'
	import ProjectList from '$lib/components/ProjectList.svelte'
	import ComingSoon from '$lib/components/ComingSoon.svelte'

	export const FEATURED_TITLES = [
		'Featured Project', // Index 0
		'Featured Tutorial', // Index 1
		'Work in Progress', // Index 2
		'Remix This!', // Index 3
		'My Favourite Things', // Index 4
		"Why I'm an AmpModder", // Index 5
		'More About Me', // Index 6
		'Play my game!', // Index 7
		'My Collaboration', // Index 8
		'Join the contest!', // Index 9
		'My best work', // Index 10
	]

	let { data } = $props()

	const userProfile = $derived(data.userProfile)
	const featuredProject = $derived(data.featuredProject)
	const isFollowing = $derived(data.isFollowing ?? false)
	const followerCount = $derived(data.followerCount ?? 0)
	const followingCount = $derived(data.followingCount ?? 0)
	const { isOwnProfile, isViewerStaff } = $derived(data)

	let userStatus = $state(data.userProfile?.status)
	let isEditingBio = $state(false)
	let isProjectPickerOpen = $state(false)
	let editedBio = $state(data.userProfile.bio ?? '')
	let isUploadingPfp = $state(false)
	let isBanModalOpen = $state(false)
	let pickedFeaturedTitle = $state(0)
	let isRankUpModalOpen = $state(false)
	let pfpInput: HTMLInputElement | undefined = $state()

	$effect(() => {
		userStatus = data.userProfile.status
		editedBio = data.userProfile.bio ?? ''
		isEditingBio = false
		isBanModalOpen = false
	})

	let joinedDate = $derived(
		(() => {
			try {
				return userProfile.createdAt
					? new Date(userProfile.createdAt).toLocaleDateString(getLocale(), {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						})
					: 'Unknown'
			} catch (e) {
				console.error('Failed to translate joined date!', e)
				return new Date(userProfile.createdAt).toISOString()
			}
		})(),
	)

	const viewerIsOp = $derived(isStaff(data.user?.rank))
	const canEdit = $derived(isOwnProfile || viewerIsOp)

	let displayedProjects = $state([...data.projects]) // Initialize with first batch
	let isLoadingMore = $state(false)
	let hasMore = $state(data.projects.length >= 10)

	async function loadMoreProjects() {
		if (isLoadingMore || !hasMore) return
		isLoadingMore = true

		try {
			const offset = displayedProjects.length
			const response = await fetch(
				`/users/${userProfile.username}/_moreProjects?offset=${offset}&limit=10`,
			)
			const newProjects = await response.json()

			if (newProjects.length < 10) {
				hasMore = false
			}

			displayedProjects = [...displayedProjects, ...newProjects]
		} catch (e) {
			console.error('Failed to load more projects', e)
		} finally {
			isLoadingMore = false
		}
	}

	const styles = {
		sectionCard:
			'border border-neutral-300 dark:border-neutral-700 rounded-xl p-3 flex flex-col min-h-0',
		header: 'flex items-center gap-6 my-3',
		label: 'text-sm font-bold text-accent-secondary dark:text-neutral-300 block',
		pfpWrapper:
			'relative group h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900',
		modalLabel: 'mb-1 block text-xs font-bold text-neutral-500',
		modalInput:
			'w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm outline-none focus:ring-2 focus:ring-accent dark:border-neutral-700 dark:bg-neutral-900',
	}
</script>

<svelte:head>
	<title>{data.private ? 'Private profile' : userProfile.username} - AmpMod</title>
</svelte:head>

{#if !data.private}
	<div class="m-auto flex max-w-6xl flex-col gap-3 lg:p-8">
		{#if data.isPrivate}
			<div
				class="flex items-center justify-between gap-2 rounded bg-amber-100/50 p-3 text-amber-900 dark:bg-amber-800/10 dark:text-amber-200/80"
			>
				Your profile is private. Only you and the AmpMod moderation team can see it.
				<Button href="/settings/profile">Settings</Button>
			</div>
		{/if}

		<header class={styles.header}>
			<div class={styles.pfpWrapper}>
				<img
					src={getPfpPath(userProfile).full}
					alt={userProfile.username}
					class="h-full w-full object-cover"
				/>

				{#if canEdit}
					<button
						onclick={() => pfpInput?.click()}
						class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
						disabled={isUploadingPfp}
					>
						{#if isUploadingPfp}<Loader class="animate-spin" size={24} />{:else}<Pencil
								size={24}
							/>{/if}
					</button>
					<form
						method="POST"
						action="?/updatePfp"
						enctype="multipart/form-data"
						use:enhance={() => {
							isUploadingPfp = true
							return async () => {
								isUploadingPfp = false
								location.reload()
							}
						}}
						class="hidden"
					>
						<input type="hidden" name="targetUserId" value={userProfile.id} />
						<input
							bind:this={pfpInput}
							type="file"
							name="avatar"
							accept="image/*"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						/>
					</form>
				{/if}
			</div>

			<div class="flex grow flex-col justify-center">
				<div class="flex items-center gap-3">
					<div class="flex w-full items-center gap-4">
						{#if data.isOnline}
							<span class="h-4 w-4 rounded-full bg-green-500" title="Online"></span>
						{/if}
						<h1 class="text-3xl font-bold text-neutral-800 dark:text-white">
							{userProfile.username}{#if userProfile.rank === 3}*{/if}
						</h1>

						<div class="grow"></div>

						{#if data.availableActions?.includes('banUser') && !isOwnProfile}
							<Button onclick={() => (isBanModalOpen = true)} class="flex items-center gap-2">
								<Gavel size={24} />
								{m.adminBan()}
							</Button>
						{/if}

						{#if !isOwnProfile && data.user && data.availableActions.includes('follow')}
							<form
								method="POST"
								action="?/toggleFollow"
								use:enhance={() => {
									return async ({ update }) => {
										await update()
									}
								}}
							>
								<input type="hidden" name="targetUserId" value={userProfile.id} />
								<Button
									type="submit"
									class={[
										'flex items-center gap-2',
										isFollowing && 'bg-neutral-500 hover:bg-neutral-600!',
									]}
								>
									<UsersRound />
									{isFollowing ? 'Unfollow' : 'Follow'}
								</Button>
							</form>
						{/if}
					</div>

					{#if userStatus === 'banned' && data.availableActions?.includes('seeBanStatus')}
						<span
							class="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500"
							>{m.userBanned()}</span
						>
					{/if}
				</div>

				<div class="flex items-center gap-2 text-sm text-neutral-500/80">
					<span>{rankMap[userProfile.rank ?? 0]}</span>
					{#if data.canRankUp}
						<button onclick={() => (isRankUpModalOpen = true)} class="link cursor-pointer">
							(Rank up)
						</button>
					{/if}
					<span>•</span>
					<span>{m.joinedDate({ joinedDate })}</span>
					{#if userProfile.scratchUsername}
						<span>•</span>
						<a href="https://scratch.mit.edu/users/{userProfile.scratchUsername}" class="link">
							Scratch
						</a>
					{/if}
				</div>
			</div>
		</header>

		<div class="flex flex-col gap-6 lg:h-80 lg:flex-row lg:items-stretch">
			<section class="{styles.sectionCard} flex-1">
				<div
					class="mb-2 flex items-center justify-between border-b border-neutral-500/50 pb-2 dark:border-neutral-700"
				>
					<span class={styles.label}>{m.aboutMe()}</span>
					{#if canEdit && !isEditingBio}
						<button
							onclick={() => (isEditingBio = true)}
							class="text-neutral-400 hover:text-accent"
						>
							<Pencil size={16} />
						</button>
					{/if}
				</div>

				{#if isEditingBio}
					<form
						method="POST"
						action="?/updateBio"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success') isEditingBio = false
								await update()
							}
						}}
						class="flex min-h-0 flex-1 flex-col overflow-hidden"
					>
						<input type="hidden" name="targetUserId" value={userProfile.id} />
						<input type="hidden" name="bio" value={editedBio} />
						<Tiptap bind:value={editedBio} placeholder={m.aboutMePlaceholderEdit()} />
						<div class="mt-4 flex shrink-0 gap-2">
							<button
								type="submit"
								class="flex items-center gap-3 rounded-full bg-accent px-4 py-1 text-sm font-bold text-white transition-colors hover:bg-accent-secondary"
							>
								<Save size={18} />
								{m.save()}
							</button>
							<button
								type="button"
								onclick={() => (isEditingBio = false)}
								class="text-sm text-neutral-500">{m.cancel()}</button
							>
						</div>
					</form>
				{:else}
					<div
						class="prose max-w-none flex-1 overflow-auto text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 dark:prose-invert prose-a:font-bold prose-a:text-accent prose-a:no-underline prose-a:hover:underline dark:prose-a:text-accent-light"
					>
						{#if userProfile.bio}
							{@html DOMPurify.sanitize(md.render(userProfile.bio))}
						{:else}
							<i class="opacity-50">
								{isOwnProfile ? m.aboutMePlaceholderEdit() : m.aboutMePlaceholder()}
							</i>
						{/if}
					</div>
				{/if}
			</section>

			<section
				class="{styles.sectionCard} relative flex w-full shrink-0 flex-col overflow-hidden lg:w-100"
			>
				<div class="mb-4 flex items-center justify-between">
					<span class={styles.label}>
						{FEATURED_TITLES[userProfile.featuredProjectTitleIndex ?? 0]}
					</span>
					{#if isOwnProfile && data.availableActions?.includes('setProfileFeaturedProject')}
						<button
							onclick={() => (isProjectPickerOpen = true)}
							class="text-neutral-400 transition-colors hover:text-accent"
						>
							<Pencil size={16} />
						</button>
					{/if}
				</div>

				{#if featuredProject}
					<a
						href="/projects/{featuredProject.id}"
						class="group relative aspect-4/3 overflow-hidden rounded border border-neutral-200 dark:border-neutral-800"
					>
						<img
							src={getPublicUrl(`projects/${featuredProject.id}/thumbnail.webp`)}
							alt={featuredProject.title}
							class="h-full w-full object-cover"
						/>
						<div
							class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"
						></div>
						<div class="absolute bottom-0 p-4">
							<h3 class="line-clamp-1 text-lg font-bold text-white">{featuredProject.title}</h3>
						</div>
					</a>
				{:else}
					<div
						class="flex aspect-[4/3] min-h-[200px] grow items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700"
					>
						<div class="text-center text-neutral-400">
							<FolderOpen class="mx-auto mb-2 opacity-20" size={32} />
							<p class="text-xs">{m.noFeaturedProject()}</p>
						</div>
					</div>
				{/if}
			</section>
		</div>
		<div class="flex flex-col gap-2">
			<Row title="Shared Projects" seeMore="/users/{userProfile.username}/projects">
				<ProjectList projects={data.projects} emptyMessage="No projects yet." />
			</Row>

			<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
				<Row
					title="Following ({followingCount})"
					seeMore="/users/{userProfile.username}/following"
					class="grow"
				>
					<UserList users={data.following} />
				</Row>

				<Row
					title="Followers ({followerCount})"
					seeMore="/users/{userProfile.username}/followers"
					class="grow"
				>
					<UserList users={data.followers} />
				</Row>
			</div>
			<h2 class="text-2xl font-bold">Comments</h2>

			<ComingSoon />
		</div>
	</div>
{:else}
	<div class="m-auto my-20 flex max-w-6xl flex-col items-center gap-4 text-center">
		<Lock size={48} />
		<p>The owner of this account has hidden their profile from public view.</p>
		<Button href="/">Back to homepage</Button>
	</div>
{/if}

<Modal bind:open={isRankUpModalOpen} title="Rank Up!">
	<div class="flex flex-col gap-4">
		<h2 class="text-xl font-bold">Ready to become an AmpModder?</h2>
		<p>Gain access to:</p>

		<ul class="ml-3 list-inside list-disc">
			<li>More extensions on uploaded projects</li>
			<li>Creating galleries</li>
			<li>Uploading larger and more complex projects</li>
		</ul>
		<p>Your New AmpModder rank will be revoked permanently.</p>

		<form
			method="POST"
			action="?/rankUp"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						isRankUpModalOpen = false
					}
					await update()
				}
			}}
			class="mt-2 flex flex-col gap-2"
		>
			<Button type="submit" class="py-2 text-lg">Rank Up Now</Button>
			<button
				type="button"
				onclick={() => (isRankUpModalOpen = false)}
				class="text-sm text-neutral-500 hover:text-neutral-700"
			>
				{m.cancel()}
			</button>
		</form>
	</div>
</Modal>

<Modal bind:open={isProjectPickerOpen} title="Feature a project">
	<div class="mb-6 flex flex-col gap-2">
		<label class={styles.modalLabel} for="titleSelect">
			Choose title for featured project section:
		</label>
		<select id="titleSelect" class={styles.modalInput} bind:value={pickedFeaturedTitle}>
			{#each FEATURED_TITLES as title, i}
				<option value={i}>{title}</option>
			{/each}
		</select>
	</div>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
		{#each displayedProjects as project}
			<form
				method="POST"
				action="?/featureProject"
				use:enhance={() => {
					return async ({ update }) => {
						isProjectPickerOpen = false
						await update()
					}
				}}
			>
				<input type="hidden" name="projectId" value={project.id} />
				<input type="hidden" name="titleIndex" value={pickedFeaturedTitle} />

				<button
					type="submit"
					class="group flex w-full flex-col text-left transition-all hover:scale-95"
				>
					<div
						class="aspect-[4/3] overflow-hidden rounded-lg border-2 {featuredProject?.id ===
						project.id
							? 'border-accent'
							: 'border-neutral-200 dark:border-neutral-700'}"
					>
						<img
							src={getPublicUrl(`projects/${project.id}/thumbnail.webp`)}
							alt={project.title}
							class="h-full w-full object-cover"
						/>
					</div>
					<span class="mt-1 truncate text-xs font-bold dark:text-neutral-200">{project.title}</span>
				</button>
			</form>
		{/each}
	</div>

	{#if hasMore}
		<button
			type="button"
			onclick={loadMoreProjects}
			disabled={isLoadingMore}
			class="mt-4 w-full rounded-lg py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/5 disabled:opacity-50"
		>
			{#if isLoadingMore}
				<Loader class="mr-1 inline animate-spin" size={14} /> Loading...
			{:else}
				View More Projects
			{/if}
		</button>
	{/if}

	{#if featuredProject}
		<form
			method="POST"
			action="?/featureProject"
			use:enhance={() => {
				return async ({ update }) => {
					isProjectPickerOpen = false
					await update()
				}
			}}
			class="mt-6 border-t pt-4 dark:border-neutral-700"
		>
			<input type="hidden" name="projectId" value="" />
			<Button
				type="submit"
				class="flex w-full items-center justify-center gap-4 bg-neutral-200! text-neutral-700! dark:bg-neutral-800! dark:text-neutral-200!"
			>
				<X size={20} /> Remove Featured Project
			</Button>
		</form>
	{/if}
</Modal>

<Modal bind:open={isBanModalOpen} title={m.adminBan()}>
	<div class="flex flex-col gap-2">
		<form
			method="POST"
			action="?/banUser"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						userStatus = 'banned'
						isBanModalOpen = false
					}
					await update()
				}
			}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="targetUserId" value={userProfile.id} />
			<div>
				<label for="duration" class={styles.modalLabel}>{m.duration()}</label>
				<select name="duration" id="duration" class={styles.modalInput}>
					<option value="permanent">{m.permanent()}</option>
					<option value="24h">{m.dayInHours()}</option>
					<option value="7d">{m.weekInDays()}</option>
					<option value="30d">{m.monthInDays()}</option>
					<option value="0">Unban</option>
				</select>
			</div>
			<div>
				<label for="reason" class={styles.modalLabel}>{m.reason()}</label>
				<textarea
					id="reason"
					name="reason"
					placeholder="Violation of community guidelines..."
					class="{styles.modalInput} min-h-[100px] resize-none"
				></textarea>
			</div>
			<div class="mt-2 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (isBanModalOpen = false)}
					class="px-4 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-700"
					>{m.cancel()}</button
				>
				<button
					type="submit"
					class="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
					>{m.adminBanConfirm()}</button
				>
			</div>
		</form>
	</div>
</Modal>
