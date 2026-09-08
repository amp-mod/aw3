import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { storage } from '$lib/storage'
import { failIfCannotPerformAction } from '$lib/server/permissions'
import { Readable } from 'node:stream'

export const POST: RequestHandler = async ({ request, locals, params }) => {
	failIfCannotPerformAction(locals.user, 'createProject')

	const assetName = params.assetName

	// prevent path traversal (e.g. consecutive dots or if there is a slash)
	if (/\.\./.test(assetName) || assetName.includes('/') || assetName.includes('\\')) {
		throw error(400, 'Invalid asset name')
	}

	// get hash from query
	const hash = new URL(request.url).searchParams.get('hash')

	// check if the asset name is a Scratch MD5 filename format
	const isProjectAsset = /^([a-f0-9]{32})\..*$/.test(assetName)
	if (!isProjectAsset) {
		throw error(400, 'Invalid asset name')
	}

	// if so check the hash to see if it matches the asset name
	if (isProjectAsset && hash && hash !== assetName.split('.')[0]) {
		throw error(400, 'Could not verify integrity of the asset')
	}

	const assetPath = `projects/unified-storage/${assetName[0]}/${assetName.slice(0, 2)}/${assetName}`

	try {
		// Skip writing and return 204 if file already exists
		if (await storage.fileExists(assetPath)) {
			return new Response(null, { status: 204 })
		}

		const stream = Readable.fromWeb(request.body as any)

		await storage.write(assetPath, stream)

		return json({ success: true })
	} catch (e: any) {
		if (e?.status) throw e
		console.error(e)
		throw error(500, 'Failed to upload asset')
	}
}
