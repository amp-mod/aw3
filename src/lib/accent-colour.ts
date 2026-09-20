import { colord, extend } from 'colord'
import mixPlugin from 'colord/plugins/mix'

extend([mixPlugin])

export interface AccentTheme {
	primary: string
	secondary: string
	tertiary: string
	light: string
	almostLight: string
}

export function generateAccentVariants(primaryHex: string): AccentTheme {
	const base = colord(primaryHex)

	if (!base.isValid()) {
		throw new Error(`Invalid color provided: ${primaryHex}`)
	}

	return {
		primary: base.toHex(),
		secondary: base.darken(0.12).toHex(),
		tertiary: base.darken(0.25).toHex(),
		light: base.lighten(0.22).toHex(),
		almostLight: base.lighten(0.12).toHex(),
	}
}
