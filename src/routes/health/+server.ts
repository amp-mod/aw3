import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
	console.log('health')
	return true
}
