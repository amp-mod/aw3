<script>
	import defaultThumbnail from '$lib/assets/default-pfp.svg'
	import ProjectGrid from '$lib/components/ProjectGrid.svelte'
</script>

<div class="bg-blue-50 min-h-screen py-12">
	<div class="max-w-6xl mx-auto flex flex-row gap-6">
		<div class="w-72 flex flex-col gap-4">
			<h2 class="text-3xl font-bold">New studio</h2>
			<div
				class="w-full aspect-9/6 rounded-xl overflow-hidden border border-black/10 dark:border-white/10"
			>
				<img src={defaultThumbnail} class="w-full h-full object-fill" alt="Thumbnail of studio" />
			</div>
		</div>
		<div class="grow flex flex-col gap-4">
			<h2 class="font-bold">here would be the tabs where projects, comments, whatever</h2>
			<ProjectGrid
				projects={[
					{
						title: 'studio project',
						author: { username: 'ampmod' },
						actions: {
							label: 'Remove Project',
							onClick: () => {
								alert('boo did i scare you')
							},
						},
					},
				]}
			/>
		</div>
	</div>
</div>
