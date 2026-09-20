import applecat from './apple-cat.svg'
import dango from './dango.svg'
import ampelectrecuted from './ampelectrecuted.svg'
import kitten from './kitten.svg'
import glassy from './glassy.svg'
import TV from './TV.svg'
import wood from './wood.svg'

export interface Frame {
	name: string
	src: string
}

export const frames: Record<string, Frame> = {
	// Based on Apple Cat, the mascot of AmpMod.
	applecat: {
		name: 'Apple Cat',
		src: applecat,
	},

	// Based on dangos, which are associated with TurboWarp.
	dango: {
		name: 'Dango',
		src: dango,
	},

	// Mimicks Scratch's cat frame (previously exclusive to Scratch Membership before it
	// was shut down). Not the exact same. Intended for those who use it on Scratch.
	kitten: {
		name: 'Kitten',
		src: kitten,
	},

	// A glassy theme.
	// Scrapped.
	// glassy: {
	//     name: 'Glassy',
	//     src: glassy,
	// },

	// A television.
	TV: {
		name: 'TV',
		src: TV,
	},

	// A wooden frame.
	wood: {
		name: 'Wood',
		src: wood,
	},

	// Based on AmpElectrecuted's 2026 profile picture.
	ampelectrecuted: {
		name: 'AmpElectrecuted',
		src: ampelectrecuted,
	},
}
