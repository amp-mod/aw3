<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { UserRound, Pencil, FolderOpen, Bold, Italic, List, AlertCircle } from '@lucide/svelte';
  import { enhance } from '$app/forms';
  import { rankMap, isOp } from '$lib/ranks';
  import MarkdownIt from 'markdown-it';

  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from '@tiptap/markdown';

  let { data, form } = $props();
  let userProfile = $state(data.userProfile);
  const { isOwnProfile } = data;

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true
  });

  const viewerIsOp = isOp(data.user?.rank);
  const canEdit = isOwnProfile || viewerIsOp;

  let isEditingBio = $state(false);
  let editedBio = $state(userProfile.bio ?? '');
  let editorElement: HTMLElement | undefined = $state();
  let editor: Editor | undefined = $state();

  $effect(() => {
    if (isEditingBio && editorElement && !editor) {
      editor = new Editor({
        element: editorElement,
        extensions: [StarterKit, Markdown],
        content: editedBio,
        contentType: 'markdown',
        editorProps: {
          attributes: {
            class:
              'prose prose-sm dark:prose-invert focus:outline-none min-h-[150px] p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-b-xl max-w-none'
          }
        },
        onUpdate: ({ editor }) => {
          editedBio = editor.getMarkdown();
        }
      });
    }
    if (!isEditingBio && editor) {
      editor.destroy();
      editor = undefined;
    }
  });

  onDestroy(() => {
    editor?.destroy();
  });

  const styles = {
    sectionCard:
      'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-5 shadow-sm',
    header: 'flex items-center gap-6 my-3',
    label: 'text-sm font-bold text-accent-secondary dark:text-neutral-300 mb-2 block',
    toolbarBtn:
      'p-2 rounded hover:bg-white dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-300'
  };
</script>

<svelte:head>
  <title>{userProfile.username} - AmpMod</title>
</svelte:head>

<div class="m-auto flex max-w-6xl flex-col gap-4 lg:p-8">
  <header class={styles.header}>
    <div
      class="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <UserRound size={56} />
    </div>
    <div class="flex grow flex-col justify-center">
      <h1 class="text-3xl font-bold text-neutral-800 dark:text-white">
        {userProfile.username}{#if userProfile.rank === 3}*{/if}
      </h1>
      <div class="flex items-center gap-1 opacity-50">
        {rankMap[userProfile.rank ?? 0]}
      </div>
    </div>
  </header>

  <div class="flex flex-col gap-6">
    <section class={styles.sectionCard}>
      <div class="mb-2 flex items-center justify-between border-b pb-2 dark:border-neutral-700">
        <span class={styles.label}>About Me</span>
        {#if canEdit && !isEditingBio}
          <button onclick={() => (isEditingBio = true)} class="text-neutral-400 hover:text-accent">
            <Pencil size={16} />
          </button>
        {/if}
      </div>

      {#if form?.message}
        <div
          class="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
        >
          <AlertCircle size={16} />
          {form.message}
        </div>
      {/if}

      {#if isEditingBio}
        <form
          method="POST"
          action="?/updateBio"
          use:enhance={() => {
            return async ({ result, update }) => {
              if (result.type === 'success') {
                // Manually update local state so the UI reflects changes without a full reload
                userProfile.bio = editedBio;
                isEditingBio = false;
              }
              await update();
            };
          }}
          class="flex flex-col"
        >
          <input type="hidden" name="targetUserId" value={userProfile.id} />
          <input type="hidden" name="bio" value={editedBio} />

          <div
            class="flex gap-1 rounded-t-xl border border-b-0 border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-600 dark:bg-neutral-800"
          >
            <button
              type="button"
              class={styles.toolbarBtn}
              onclick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold size={18} />
            </button>
            <button
              type="button"
              class={styles.toolbarBtn}
              onclick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic size={18} />
            </button>
            <button
              type="button"
              class={styles.toolbarBtn}
              onclick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List size={18} />
            </button>
          </div>

          <div bind:this={editorElement}></div>

          <div class="mt-4 flex gap-2">
            <button
              type="submit"
              class="rounded-full bg-accent px-4 py-1 text-sm font-bold text-white hover:bg-accent-secondary"
            >
              Save Profile
            </button>
            <button
              type="button"
              onclick={() => {
                isEditingBio = false;
                editedBio = userProfile.bio ?? '';
              }}
              class="text-sm text-neutral-500"
            >
              Cancel
            </button>
          </div>
        </form>
      {:else}
        <div
          class="prose max-h-[400px] min-h-[100px] max-w-none overflow-auto text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 dark:prose-invert"
        >
          {#if userProfile.bio}
            {@html md.render(userProfile.bio)}
          {:else if isOwnProfile}
            <i class="opacity-50">Tell us about yourself!</i>
          {:else}
            <i class="opacity-50">This user does not have an About Me.</i>
          {/if}
        </div>
      {/if}
    </section>

    <section class={styles.sectionCard}>
      <div class="mb-4 flex items-center justify-between">
        <span class={styles.label}>Shared Projects (0)</span>
        <a
          href="/users/{userProfile.username}/projects"
          class="text-xs font-bold text-accent hover:underline">View all</a
        >
      </div>
      <div
        class="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700"
      >
        <div class="text-center text-neutral-400">
          <FolderOpen class="mx-auto mb-2 opacity-20" size={40} />
          <p class="text-sm">No projects shared yet.</p>
        </div>
      </div>
    </section>
  </div>
</div>
