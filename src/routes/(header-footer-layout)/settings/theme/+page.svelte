<script lang="ts">
  import { Loader } from '@lucide/svelte';
  import { onMount } from 'svelte';

  type Theme = {
    accent: 'green' | 'green-old' | 'red' | 'purple' | 'blue' | 'grey' | 'rainbow';
    gui: 'light' | 'light-classic' | 'dark' | 'amoled';
    blocks: 'three' | 'high-contrast' | 'dark';
  };

  const DEFAULT_THEME: Theme = {
    accent: 'green',
    gui: 'light',
    blocks: 'three'
  };

  class ThemeClass {
    accent: Theme['accent'];
    gui: Theme['gui'];
    blocks: Theme['blocks'];

    constructor(accent?: Theme['accent'], gui?: Theme['gui'], blocks?: Theme['blocks']) {
      this.accent = accent ?? DEFAULT_THEME.accent;
      this.gui = gui ?? DEFAULT_THEME.gui;
      this.blocks = blocks ?? DEFAULT_THEME.blocks;
    }
  }

  let theme: ThemeClass | null = null;
  let accentName: string | null = null;
  let guiName: string | null = null;
  let blocksName: string | null = null;

  const ACCENT_NAMES: Record<Theme['accent'], string> = {
    green: 'Green',
    'green-old': 'Green (Classic)',
    red: 'Red',
    purple: 'Purple',
    blue: 'Blue',
    grey: 'Grey',
    rainbow: 'Rainbow'
  };

  const GUI_NAMES: Record<Theme['gui'], string> = {
    light: 'Light',
    'light-classic': 'Light (Classic)',
    dark: 'Dark',
    amoled: 'AMOLED'
    // 'high-contrast': 'High Contrast'
  };

  const BLOCKS_NAMES: Record<Theme['blocks'], string> = {
    three: 'Original',
    'high-contrast': 'High Contrast',
    dark: 'Dark'
  };

  function updateDerivedNames() {
    if (!theme) return;
    accentName = ACCENT_NAMES[theme.accent] ?? 'Unknown';
    guiName = GUI_NAMES[theme.gui] ?? 'Unknown';
    blocksName = BLOCKS_NAMES[theme.blocks] ?? 'Unknown';
  }

  onMount(() => {
    const stored = localStorage.getItem('amp:theme');
    if (stored) {
      const parsed: Partial<Theme> = JSON.parse(stored);
      theme = new ThemeClass(parsed.accent, parsed.gui, parsed.blocks);
    } else {
      theme = new ThemeClass();
    }
    updateDerivedNames();
  });

  function updateTheme<K extends keyof Theme>(key: K, value: Theme[K]) {
    if (!theme) return;

    theme[key] = value;

    const stored: Partial<Theme> = JSON.parse(localStorage.getItem('amp:theme') || '{}');

    if (value === DEFAULT_THEME[key]) {
      delete stored[key];
    } else {
      stored[key] = value;
    }

    if (Object.keys(stored).length === 0) {
      localStorage.removeItem('amp:theme');
    } else {
      localStorage.setItem('amp:theme', JSON.stringify(stored));
    }

    updateDerivedNames();
  }

  function handleAccentChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value as Theme['accent'];
    updateTheme('accent', val);
  }

  function handleGuiChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value as Theme['gui'];
    updateTheme('gui', val);
  }

  function handleBlocksChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value as Theme['blocks'];
    updateTheme('blocks', val);
  }
</script>

<h2 class="mb-3 text-3xl font-bold">Themes</h2>

{#if theme}
  <p class="mb-4">
    The "Customizable editor colours" addon overrides these options. Refresh editors for the change
    to take effect.
  </p>

  <div class="mb-4">
    <label for="accent-select" class="mb-1 block font-bold text-gray-700 dark:text-gray-200"
      >Accent:</label
    >
    <select
      id="accent-select"
      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-100 dark:focus:border-accent dark:focus:ring-accent/40"
      bind:value={theme.accent}
      on:change={handleAccentChange}
    >
      {#each Object.entries(ACCENT_NAMES) as [key, name] (key)}
        <option value={key}>{name}</option>
      {/each}
    </select>
  </div>

  <div class="mb-4">
    <label for="gui-select" class="mb-1 block font-bold text-gray-700 dark:text-gray-200"
      >Theme:</label
    >
    <select
      id="gui-select"
      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-100 dark:focus:border-accent dark:focus:ring-accent/40"
      bind:value={theme.gui}
      on:change={handleGuiChange}
    >
      {#each Object.entries(GUI_NAMES) as [key, name] (key)}
        <option value={key}>{name}</option>
      {/each}
    </select>
  </div>

  <div class="mb-4">
    <label for="blocks-select" class="mb-1 block font-bold text-gray-700 dark:text-gray-200"
      >Block Colours:</label
    >
    <select
      id="blocks-select"
      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-100 dark:focus:border-accent dark:focus:ring-accent/40"
      bind:value={theme.blocks}
      on:change={handleBlocksChange}
    >
      {#each Object.entries(BLOCKS_NAMES) as [key, name] (key)}
        <option value={key}>{name}</option>
      {/each}
    </select>
  </div>
{:else}
  <Loader class="animate-spin opacity-30" size={32} />
  <span class="sr-only">Loading...</span>
{/if}
