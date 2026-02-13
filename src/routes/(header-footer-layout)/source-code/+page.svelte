<script>
	import { m } from '$lib/paraglide/messages'
	import Button from '$lib/components/Button.svelte'
</script>

<div
	class="bg-slate-100 p-8 text-center text-accent-secondary dark:bg-accent-tertiary dark:text-white"
>
	<div class="m-auto flex max-w-4xl flex-col gap-2">
		<h1 class="text-4xl leading-tight font-bold">{m.sourceCode()}</h1>
		<p>
			{m.sourceCodeDesc()}
		</p>
	</div>
</div>

<div class="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 text-black dark:text-white">
	<h2 class="text-3xl font-bold">{m.sourceCodeEditor()}</h2>
	<p>
		{m.sourceCodeEditorDesc()}
	</p>
	<div>
		<Button href="https://codeberg.org/ampmod/ampmod" target="_blank">Codeberg</Button>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeAw3()}</h2>
	<p>
		{m.sourceCodeAw3Desc()}
	</p>
	<div>
		<Button href="https://codeberg.org/aw3" target="_blank">Codeberg</Button>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeWiki()}</h2>
	<p>{m.sourceCodeWikiDesc()}</p>
	<div>
		<Button href="https://mediawiki.org" target="_blank">{m.sourceCodeMediawiki()}</Button>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeForums()}</h2>
	<p>{m.sourceCodeForumsDesc()}</p>
	<div>
		<Button href="https://flarum.org" target="_blank">{m.sourceCodeFlarum()}</Button>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeCloudvar()}</h2>
	<p>{m.sourceCodeCloudvarDesc()}</p>
	<div>
		<Button href="#TODO" target="_blank">{m.sourceCodeCloudvarAmp()}</Button>
	</div>
	<div>
		<Button href="https://github.com/TurboWarp/extensions" target="_blank">
			{m.sourceCodeCloudvarTw()}
		</Button>
	</div>
	<div>
		<Button href="https://docs.turbowarp.org/cloud-variables" target="_blank">
			{m.learnMore()}
		</Button>
	</div>
</div>
