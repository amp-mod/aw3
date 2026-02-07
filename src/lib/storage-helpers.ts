import DefaultPfp from './assets/default-pfp.png'

export const getPublicUrl = (path: string) => {
	return `/uploads/${path}`
}

export const getPfpPath = (path: string | null) => (path ? getPublicUrl(path) : DefaultPfp)
