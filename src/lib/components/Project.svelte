<script lang="ts">
    import { getPublicUrl } from '$lib/storage-helpers';

    let { project } = $props();

    const styles = {
        // Added 'relative' so the stretched link stays within the card
        card: 'group relative flex flex-col gap-2 rounded-xl p-1 transition-all w-46 shrink-0 border border-black/10 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5',
        thumbContainer:
            'aspect-[4/3] w-full overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900',
        // 'after:absolute after:inset-0' makes this link cover the whole card
        mainLink: 'after:absolute after:inset-0 focus:outline-none',
        title: 'px-1 text-sm font-bold truncate block dark:text-neutral-200 group-hover:text-accent',
        // 'relative z-10' ensures the author link sits on top of the mainLink layer
        authorLink: 'relative z-10 px-1 text-xs text-neutral-500 hover:text-accent transition-colors truncate',
    };
</script>

<div class={styles.card}>
    <div class={styles.thumbContainer}>
        <img
            src={getPublicUrl(`projects/${project.id}/thumbnail.webp`)}
            alt={project.title}
            class="h-full w-full object-cover transition-transform"
            loading="lazy"
        />
    </div>

    <div class="flex w-full flex-col gap-0.5">
        <a href="/projects/{project.id}" class="{styles.title} {styles.mainLink}">
            {project.title}
        </a>

        {#if project.author}
            <a href="/users/{project.author.username}" class={styles.authorLink}>
                by {project.author.username}
            </a>
        {/if}
    </div>
</div>