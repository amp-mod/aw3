<script lang="ts">
  import { setLocale } from '$lib/paraglide/runtime';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { m } from '$lib/paraglide/messages.js';
</script>

<h1>{m.hello_world({ name: 'SvelteKit User' })}</h1>
<div>
  <button onclick={() => setLocale('en')}>en</button>
  <button onclick={() => setLocale('es')}>es</button>
  <button onclick={() => setLocale('es-419')}>es-419</button>
  <button onclick={() => setLocale('fr')}>fr</button>
  <button onclick={() => setLocale('ja')}>ja</button>
  <button onclick={() => setLocale('ja-hira')}>ja-hira</button>
  <button onclick={() => setLocale('zh-cn')}>zh-cn</button>
  <button onclick={() => setLocale('zh-tw')}>zh-tw</button>
  <button onclick={() => setLocale('pt-br')}>pt-br</button>
  <button onclick={() => setLocale('de')}>de</button>
  <button onclick={() => setLocale('ru')}>ru</button>
  <button onclick={() => setLocale('uk')}>uk</button>
  <button onclick={() => setLocale('ar')}>ar</button>
  <button onclick={() => setLocale('nb')}>nb</button>
  <button onclick={() => setLocale('bg')}>bg</button>
  <button onclick={() => setLocale('cs')}>cs</button>
  <button onclick={() => setLocale('pl')}>pl</button>
  <button onclick={() => setLocale('tr')}>tr</button>
  <button onclick={() => setLocale('nl')}>nl</button>
  <button onclick={() => setLocale('it')}>it</button>
  <button onclick={() => setLocale('ko')}>ko</button>
  <button onclick={() => setLocale('sv')}>sv</button>
  <button onclick={() => setLocale('fi')}>fi</button>
  <button onclick={() => setLocale('hu')}>hu</button>
  <button onclick={() => setLocale('ro')}>ro</button>
  <button onclick={() => setLocale('id')}>id</button>
  <button onclick={() => setLocale('vi')}>vi</button>
  <button onclick={() => setLocale('th')}>th</button>
</div>
<p>
  If you use VSCode, install the <a
    href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension"
    target="_blank">Sherlock i18n extension</a
  > for a better i18n experience.
</p>
