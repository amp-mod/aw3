<script>
	import { m } from '$lib/paraglide/messages'
</script>

<svelte:head>
	<title>Frequently Asked Questions - AmpMod</title>
</svelte:head>

<div class="bg-accent-secondary p-8 text-center text-white">
	<h1 class="text-3xl font-bold">{m.faq()}</h1>
</div>
<div
	class="text-text m-auto prose max-w-4xl p-4 leading-6 text-black dark:text-white dark:prose-invert prose-a:text-accent dark:prose-a:text-accent-light"
>
	<h2>General</h2>
	<h3>What is AmpMod?</h3>
	<p>
		AmpMod is a block-based programming language built off TurboWarp that adds many small but
		meaningful features to make it even better, such as first-class lists, case sensitivity, and
		custom extensions.
	</p>
	<p>
		With AmpMod, you can create games, animations, art, and more quickly by dragging blocks instead
		of manually typing everything out.
	</p>
	<h3>Why was AmpMod created?</h3>
	<p>
		We believe block-based programming allows people to make projects easily even with little
		programming experience, while also allowing people who have already learned very advanced
		programming languages to make quick prototypes or even real games. That's why we made AmpMod -
		an advanced block-based programming language.
	</p>
	<h3>Which browsers work best with AmpMod?</h3>
	<p>
		AmpMod is primarily tested on Firefox and Chrome. Most browsers released in the last 2 years
		should hopefully work. Support for anything older is untested.
	</p>
	<h2>Custom extensions</h2>
	<h3>What are custom extensions?</h3>
	<p>
		Custom extensions are extensions in AmpMod not built into the app itself, but rather downloaded
		from somewhere else. They can range from unsandboxed extensions on the official AmpMod extension
		gallery to sandboxed extensions on third-party hosts.
	</p>
	<h3>Why did a project ask for permission to do something?</h3>
	<p>
		AmpMod has a security system that extensions can use to ask for permission before doing a
		potentially malicious task.
	</p>
	<p>
		If you packaged your project, these messages are hidden, so there is no need to worry about
		this.
	</p>
	<h2>Projects</h2>
	<h3>Why does my project look weird on the website, but not in the editor?</h3>
	<p>
		The website uses a different version of AmpMod from the editor. It doesn't render everything the
		exact same way. The full AmpMod player can be accessed in the Editor.
	</p>
</div>
