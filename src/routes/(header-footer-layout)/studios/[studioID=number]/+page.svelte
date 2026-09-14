<script>
	import defaultThumbnail from '$lib/assets/default-pfp.png'
</script>

<div class="max-w-5xl my-8 mx-auto flex flex-row gap-4">
	<div class="w-64 flex flex-col gap-4">
		<h2 class="text-3xl font-bold">Studio</h2>
		<div
			class="w-full aspect-video rounded-xl overflow-hidden border border-black/10 dark:border-white/10"
		>
			<img src={defaultThumbnail} class="w-full h-full object-cover" alt="Thumbnail of studio" />
		</div>
	</div>
	<div class="grow flex flex-col gap-4">
		<h2 class="font-bold">things</h2>
	</div>
</div>
