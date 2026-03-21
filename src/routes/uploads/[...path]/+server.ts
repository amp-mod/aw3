import { error } from '@sveltejs/kit'
import { storage } from '$lib/storage'
import type { RequestHandler } from './$types'
import { Readable } from 'node:stream'

export const GET: RequestHandler = async ({ params, request }) => {
	const filePath = params.path

	if (!(await storage.fileExists(filePath))) {
		throw error(404, `File ${filePath} not found`)
	}

	const lastModified = await storage.lastModified(filePath)
	const mtime = new Date(lastModified).toUTCString()
	const ETag = `W/"${Buffer.from(`${filePath}-${lastModified}`).toString('base64')}"`

	const ifModifiedSince = request.headers.get('if-modified-since')
	if (ifModifiedSince && ifModifiedSince === mtime) {
		return new Response(null, { status: 304 })
	}

	const nodeStream = await storage.read(filePath)
	const webStream = Readable.toWeb(nodeStream as Readable)
	const mimeType = await storage.mimeType(filePath)

	return new Response(webStream, {
		headers: {
			'Content-Type': mimeType || 'application/octet-stream',
			'Last-Modified': mtime,
			'Cache-Control': 'public, no-cache',
			ETag,
		},
	})
}
