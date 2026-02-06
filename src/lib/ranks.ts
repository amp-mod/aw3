export const rankMap: Record<number, string> = {
	0: 'New AmpModder',
	1: 'AmpModder',
	2: 'Moderator',
	3: 'Operator',
}

export const getRankName = (rank: number | null) => rankMap[rank ?? 0]
export const isStaff = (rank: number | null) => (rank ?? 0) >= 2
export const isOp = (rank: number | null) => (rank ?? 0) >= 3
