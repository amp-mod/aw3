import type { PageServerLoad } from './$types'
import { UserData } from './users'

// A simple seeded random function (Mulberry32)
const seededRandom = (seed: number) => {
	return () => {
		let t = (seed += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const seededShuffle = (array: any[], seed: number) => {
	const random = seededRandom(seed)
	const result = [...array]
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1))
		;[result[i], result[j]] = [result[j], result[i]]
	}
	return result
}

export const load: PageServerLoad = async () => {
	const seed = Math.floor(Math.random() * 1000000)

	// Shuffle the lists using the generated seed
	const shuffledData = {
		tw: seededShuffle(UserData.tw, seed),
		addonDevelopers: seededShuffle(UserData.addonDevelopers, seed),
		extensionDevelopers: seededShuffle(UserData.extensionDevelopers, seed),
		docs: seededShuffle(UserData.docs, seed),
		contributors: seededShuffle(UserData.contributors, seed),
		serverAdmins: seededShuffle(UserData.serverAdmins, seed),
	}

	return {
		UserData: shuffledData,
		seed,
	}
}
