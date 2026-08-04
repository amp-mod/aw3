<script lang="ts">
	import { onMount } from 'svelte'
	import { enhance } from '$app/forms'
	import {
		Inbox,
		UserPlus,
		Star,
		Hammer,
		FolderOpen,
		CheckCheck,
		ExternalLink,
		Trash2,
		LoaderCircle,
		PartyPopper,
		XOctagon,
		OctagonX,
		Ban,
	} from '@lucide/svelte'
	import { getPfpPath } from '$lib/storage-helpers'
	import { getLocale } from '$lib/paraglide/runtime.js'

	let { data } = $props()

	// --- State ---
	let allNotifications = $state(data.notifications)
	let cursor = $state(data.nextCursor)
	let hasMore = $state(!!data.nextCursor)
	let isLoading = $state(false)
	let sentinel: HTMLElement | undefined = $state()

	const styles = {
		container: 'm-auto flex max-w-4xl flex-col gap-6 lg:p-8 p-4',
		card: 'group relative border border-neutral-300 dark:border-neutral-800 rounded-lg p-4 transition-all duration-200 bg-white dark:bg-neutral-900 flex gap-4 items-center',
		unreadBorder: 'border-l-4 border-l-accent bg-blue-500/10',
		title: 'text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-3',
		timestamp: 'text-xs text-neutral-500 dark:text-neutral-400 mt-1',
		iconContainer: 'flex h-10 w-10 shrink-0 items-center justify-center rounded',
		metaText: 'text-sm text-neutral-600 dark:text-neutral-400',
	}

	// --- Logic ---
	function getNotificationIcon(type: string) {
		switch (type) {
			case 'follow':
				return { component: UserPlus, color: 'text-blue-500 bg-blue-500/10' }
			case 'featured':
				return { component: Star, color: 'text-amber-500 bg-amber-500/10' }
			case 'system':
				return { component: Hammer, color: 'text-neutral-500 bg-neutral-500/10' }
			case 'welcome':
				return { component: PartyPopper, color: 'text-neutral-500 bg-neutral-500/10' }
			case 'project_update':
				return { component: FolderOpen, color: 'text-accent bg-accent/10' }
			case 'project_banned':
				return { component: Ban, color: 'text-white bg-red-500' }
			default:
				return { component: Inbox, color: 'text-neutral-400 bg-neutral-100' }
		}
	}

	async function loadMore() {
		if (isLoading || !hasMore) return
		isLoading = true
		try {
			const res = await fetch(`/api/notifications?cursor=${cursor}`)
			const result = await res.json()
			if (result.items) {
				allNotifications = [...allNotifications, ...result.items]
				cursor = result.nextCursor
				hasMore = !!result.nextCursor
			}
		} catch (e) {
			console.error('Infinite scroll failed', e)
		} finally {
			isLoading = false
		}
	}

	$effect(() => {
		if (!sentinel) return
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoading) loadMore()
			},
			{ rootMargin: '200px' },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	})

	const unreadCount = $derived(allNotifications.filter((n) => !n.isRead).length)
</script>

<svelte:head>
	<title>Notifications ({unreadCount}) | AmpMod</title>
</svelte:head>

<div class={styles.container}>
	<header
		class="flex items-end justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800"
	>
		<div>
			<h1 class={styles.title}><Inbox size={28} /> Messages</h1>
		</div>
	</header>

	<div class="flex flex-col gap-3">
		{#each allNotifications as note (note.id)}
			{@const iconData = getNotificationIcon(note.type)}
			<div class="{styles.card} {!note.isRead ? styles.unreadBorder : ''}">
				{#if note.issuer}
					<a href="/users/{note.issuer.username}" class="shrink-0">
						<img
							src={getPfpPath(note.issuer)['64']}
							class="h-10 w-10 rounded border border-black/10 dark:border-white/20"
							alt={note.issuer.username}
						/>
					</a>
				{:else}
					<div class="{styles.iconContainer} {iconData.color}">
						<iconData.component size={20} />
					</div>
				{/if}

				<div class="flex flex-1 justify-between">
					<div class="flex items-start justify-between">
						<div class={styles.metaText}>
							{#if note.type === 'follow'}
								<a href="/users/{note.issuer?.username}" class="link">
									{note.issuer?.username}
								</a> followed you
							{:else if note.type === 'featured'}
								<a class="link" href="/projects/{note.metadata?.projID}"
									>{note.metadata?.projTitle}</a
								> has been featured
							{:else if note.type === 'project_banned'}
								{#if note.metadata?.projID}
									<p class="font-bold">
										Your project, <a class="link" href="/projects/{note.metadata?.projID}"
											>{note.metadata?.projTitle}</a
										> has been banned by a moderator.
									</p>
									<p>{note.metadata?.title}</p>
								{/if}
							{:else}
								{note.metadata?.title || 'System Notification'}
							{/if}
						</div>
					</div>

					<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
						{note.metadata?.message || ''}
					</p>

					<div class="flex items-center gap-4">
						<span class={styles.timestamp}>
							{new Date(note.createdAt).toLocaleDateString(getLocale(), {
								day: 'numeric',
								month: 'short',
								hour: '2-digit',
								minute: '2-digit',
							})}
						</span>
						{#if note.targetId}
							<a
								href="/{note.targetType}s/{note.targetId}"
								class="flex items-center gap-1 text-xs font-bold text-accent hover:underline"
							>
								View {note.targetType}
								<ExternalLink size={12} />
							</a>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			{#if !isLoading}
				<div class="flex flex-col items-center justify-center py-20 text-neutral-500">
					<Bell size={48} class="opacity-20 mb-4" />
					<p>All caught up!</p>
				</div>
			{/if}
		{/each}
	</div>

	{#if hasMore}
		<div bind:this={sentinel} class="flex justify-center p-8">
			{#if isLoading}
				<LoaderCircle class="animate-spin text-accent" size={32} />
			{/if}
		</div>
	{/if}
</div>
