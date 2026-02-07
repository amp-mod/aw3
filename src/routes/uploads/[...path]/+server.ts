import { error } from '@sveltejs/kit'
import { storage } from '$lib/storage'
import type { RequestHandler } from './$types'
import { Readable } from 'node:stream'

export const GET: RequestHandler = async ({ params }) => {
	const filePath = params.path

	if (!(await storage.fileExists(filePath))) {
		throw error(404, `File ${filePath} not found`)
	}

	const nodeStream = await storage.read(filePath)

	const webStream = Readable.toWeb(nodeStream as Readable)

	const mimeType = await storage.mimeType(filePath)

	// @ts-expect-error - we're running in node
	return new Response(webStream, {
		headers: {
			'Content-Type': mimeType || 'application/octet-stream',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
