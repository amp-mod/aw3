import { m } from './paraglide/messages'

export const rankMap: Record<number, string> = {
	0: m.newAmpModder(),
	1: m.ampModder(),
	2: m.moderator(),
	3: m.operator(),
}

export const getRankName = (rank: number | null) => rankMap[rank ?? 0]
export const isStaff = (rank: number | null) => (rank ?? 0) >= 2
export const isOp = (rank: number | null) => (rank ?? 0) >= 3
