<script>
  import { Tabs } from 'bits-ui';
  import { Clapperboard, UserRound } from '@lucide/svelte';
  let { data } = $props();

  const styles = {
    button_normal: [
      'inline-flex',
      'rounded-lg',
      'bg-accent',
      'px-4 py-2',
      'items-center gap-2',
      'text-2xl font-bold text-white',
      'hover:bg-accent-secondary',
      'dark:bg-white dark:text-accent-tertiary dark:hover:bg-slate-200'
    ].join(' '),
    button_small: [
      'inline-flex',
      'rounded-full',
      'bg-accent-secondary',
      'px-4 py-2',
      'items-center justify-center gap-2',
      'font-bold text-white'
    ].join(' '),
    tab: 'cursor-pointer rounded-full border border-accent bg-white px-3 py-1 font-bold data-[state=active]:bg-accent data-[state=active]:text-white dark:bg-green-900 outline-none'
  };
</script>

{#if data.user}
  <div class="m-auto flex h-96 max-w-6xl gap-3 p-8">
    <div class="flex grow basis-0 items-center justify-center">
      <h1 class="text-2xl font-bold">Hello, {data.user.username}!</h1>
    </div>

    <div class="flex grow basis-0 flex-col gap-3">
      <Tabs.Root class="flex grow flex-col" value="news">
        <Tabs.List class="mb-2 flex gap-2">
          <Tabs.Trigger value="news" class={styles.tab}>AmpMod News</Tabs.Trigger>
          <Tabs.Trigger value="changelog" class={styles.tab}>Changelog</Tabs.Trigger>
          <Tabs.Trigger value="feed" class={styles.tab}>What's happening?</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content
          value="news"
          class="grow rounded-lg border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-500 dark:bg-neutral-800"
        >
          <p>new update just dropped yay</p>
        </Tabs.Content>

        <Tabs.Content
          value="changelog"
          class="grow rounded-lg border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-500 dark:bg-neutral-800"
        >
          <p>ampmod 0.5</p>
        </Tabs.Content>

        <Tabs.Content
          value="feed"
          class="grow rounded-lg border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-500 dark:bg-neutral-800"
        >
          <p>skibidi toilet just subscribed to you yay</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </div>
{:else}
  <div class="bg-slate-100 p-8 text-accent-secondary dark:bg-accent-tertiary dark:text-white">
    <div class="m-auto max-w-6xl">
      <h1 class="text-4xl leading-tight font-bold">
        Block-based programming, <span
          class="text-yellow-700 drop-shadow-[0_0_10px_#facc15] dark:text-yellow-200 dark:drop-shadow-[0_0_10px_#fef3c7]"
          >amplified</span
        >
      </h1>
      <h3 class="mt-1 text-2xl leading-tight font-bold opacity-60">
        Build games, animations, stories and more
      </h3>
      <div class="mt-4 flex gap-4">
        <a href="/projects/editor" class={styles.button_normal}><Clapperboard /> Try it out</a>
        <a href="/join" class={styles.button_normal}><UserRound /> Join</a>
      </div>
    </div>
  </div>

  <div class="bg-slate-200 p-4 text-accent-secondary dark:bg-accent-tertiary/80 dark:text-white">
    <div class="flex justify-center gap-4">
      <a href="https://ampmod.codeberg.org/manual" class={styles.button_small}>Manual</a>
      <a href="https://ampmod.miraheze.org" class={styles.button_small}>AmpMod Wiki</a>
      <a href="https://codeberg.org/ampmod" class={styles.button_small}>Source Code</a>
    </div>
  </div>
{/if}
