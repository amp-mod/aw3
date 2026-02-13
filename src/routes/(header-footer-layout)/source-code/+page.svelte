<script>
	import { m } from '$lib/paraglide/messages'
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
		<a href="https://codeberg.org/ampmod/ampmod" class="btn" target="_blank">{m.codeberg()}</a>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeAw3()}</h2>
	<p>
		{m.sourceCodeAw3Desc()}
	</p>
	<div>
		<a href="https://codeberg.org/ampmod/aw3" class="btn" target="_blank">{m.codeberg()}</a>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeWiki()}</h2>
	<p>{m.sourceCodeWikiDesc()}</p>
	<div>
		<a href="https://mediawiki.org" class="btn" target="_blank">{m.sourceCodeMediawiki()}</a>
	</div>

	<h2 class="text-3xl font-bold">{m.sourceCodeForums()}</h2>
	<p>{m.sourceCodeForumsDesc()}</p>
	<div><a href="https://flarum.org" class="btn" target="_blank">{m.sourceCodeFlarum()}</a></div>

	<h2 class="text-3xl font-bold">{m.sourceCodeCloudvar()}</h2>
	<p>{m.sourceCodeCloudvarDesc()}</p>
	<div><a href="#TODO" class="btn" target="_blank">{m.sourceCodeCloudvarAmp()}</a></div>
	<div>
		<a href="https://github.com/TurboWarp/extensions" class="btn" target="_blank"
			>{m.sourceCodeCloudvarTw()}</a
		>
	</div>
	<div>
		<a href="https://docs.turbowarp.org/cloud-variables" class="btn" target="_blank"
			>{m.learnMore()}</a
		>
	</div>
</div>
