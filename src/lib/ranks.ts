import { m } from './paraglide/messages'

export const rankMap: Record<number, string> = {
	0: m.newAmpModder(),
	1: m.ampModder(),
	2: m.moderator(),
	3: m.administrator(),
}

export const getRankName = (rank: number | null) => rankMap[rank ?? 0]
export const isStaff = (rank: number | null) => (rank ?? 0) >= 2
export const isOp = (rank: number | null) => (rank ?? 0) >= 3

export const GUEST = -1
export const NEW_AMPMODDER = 0
export const AMPMODDER = 1
export const MODERATOR = 2
export const ADMINISTRATOR = 3
