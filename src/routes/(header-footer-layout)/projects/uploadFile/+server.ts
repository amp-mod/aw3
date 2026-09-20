import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { storage } from '$lib/storage'
import { failIfCannotPerformAction } from '$lib/server/permissions'
import { Readable } from 'node:stream'
import { createHash } from 'node:crypto'

// Map expected MIME types to their corresponding extensions
const mimeToExtension: Record<string, string> = {
	'image/png': '.png',
	'image/jpeg': '.jpg',
	'image/svg+xml': '.svg',
	'audio/wav': '.wav',
	'audio/x-wav': '.wav',
	'audio/mpeg': '.mp3',
	'audio/mp3': '.mp3',
	'font/ttf': '.ttf',
	'application/font-sfnt': '.ttf',
	'font/otf': '.otf',
	'font/woff': '.woff',
	'font/woff2': '.woff2',
	'application/font-woff': '.woff',
	'application/font-woff2': '.woff2',
}

export const POST: RequestHandler = async ({ request, locals }) => {
	failIfCannotPerformAction(locals.user, 'createProject')

	if (!request.body) {
		throw error(400, 'Missing request body')
	}

	const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
	const ext = contentType ? mimeToExtension[contentType] : undefined

	if (!ext) {
		throw error(400, `Unsupported or missing content type: ${contentType || 'none'}`)
	}

	try {
		const arrayBuffer = await request.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		const hash = createHash('md5').update(buffer).digest('hex')
		const assetName = `${hash}${ext}`
		const assetPath = `projects/unified-storage/${hash[0]}/${hash.slice(0, 2)}/${assetName}`

		if (await storage.fileExists(assetPath)) {
			return new Response(null, { status: 204 })
		}

		const stream = Readable.from(buffer)
		await storage.write(assetPath, stream)

		return json({ success: true, hash, assetName })
	} catch (e: any) {
		if (e?.status) throw e
		console.error(e)
		throw error(500, 'Failed to upload asset')
	}
}
