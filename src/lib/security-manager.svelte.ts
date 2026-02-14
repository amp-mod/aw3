/**
 * @fileoverview Handle Turbowarp security manager.
 * @author AmpElectrecuted
 * modified from:
 * https://github.com/TurboWarp/scratch-vm/blob/develop/src/extension-support/tw-security-manager.js
 */

interface ModalState {
	show: boolean
	type: string | null
	url?: string
	name?: string
	resolve: (value: boolean) => void
	reject: (reason?: never) => void
}

export const modals = $state<ModalState>({
	show: false,
	type: null,
	url: '',
	name: '',
	resolve: () => {},
	reject: () => {},
})

const acceptablePrefixes = [
	'https://ampmod.codeberg.page/extensions/',
	'https://raw.codeberg.page/ampmod/extensions/@pages/',
	'https://extensions.turbowarp.org/',
	'https://pen-group.github.io/extensions/',
	// localhost is useless on public site
]

/**
 * Helper to check if a URL is in our allowlist.
 * @param {string} url
 * @returns {boolean}
 */
const isTrustedURL = (url: string) => {
	return acceptablePrefixes.some((prefix) => url.startsWith(prefix))
}

/**
 * Helper to trigger a modal and wait for user response.
 * @param {string} type The action requiring permission.
 * @param {object} data Contextual data like URL or filename.
 * @returns {Promise<boolean>}
 */
const requestPermission = (
	type: string,
	data: { url?: string; name?: string } = {},
): Promise<boolean> => {
	return new Promise((resolve) => {
		modals.type = type
		modals.url = data.url || ''
		modals.name = data.name || ''
		modals.resolve = (val) => {
			modals.show = false
			resolve(val)
		}
		modals.reject = () => {
			modals.show = false
			resolve(false)
		}
		modals.show = true
	})
}

export const functions = {
	/**
	 * Determine the type of sandbox to use for a certain custom extension.
	 * @param {string} extensionURL The URL of the custom extension.
	 * @returns {'worker'|'iframe'|'unsandboxed'|Promise<'worker'|'iframe'|'unsandboxed'>}
	 */
	getSandboxMode(extensionURL: string) {
		if (isTrustedURL(extensionURL)) return 'unsandboxed'
		return 'iframe'
	},

	/**
	 * Determine whether a custom extension that was stored inside a project may be loaded.
	 * Strictly controlled by prefix; untrusted extensions are rejected.
	 * @param {string} extensionURL The URL of the custom extension.
	 * @returns {boolean}
	 */
	canLoadExtensionFromProject(extensionURL: string) {
		return isTrustedURL(extensionURL)
	},

	/**
	 * Allows last-minute changing of the real URL of the extension that gets loaded.
	 * @param {string} extensionURL The URL requested to be loaded.
	 * @returns {string} The URL to actually load.
	 */
	rewriteExtensionURL(extensionURL: string) {
		return extensionURL
	},

	/**
	 * Determine whether an extension is allowed to fetch a remote resource URL.
	 * @param {string} resourceURL The URL of the resource to fetch.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canFetch(resourceURL: string) {
		if (resourceURL.startsWith('data:') || resourceURL.startsWith('blob:')) return true
		return await requestPermission('fetch', { url: resourceURL })
	},

	/**
	 * Determine whether an extension is allowed to open a new window or tab.
	 * @param {string} websiteURL The URL to open.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canOpenWindow(websiteURL: string) {
		return await requestPermission('openWindow', { url: websiteURL })
	},

	/**
	 * Determine whether an extension is allowed to redirect the current tab.
	 * @param {string} websiteURL The target URL for redirection.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canRedirect(websiteURL: string) {
		return await requestPermission('redirect', { url: websiteURL })
	},

	/**
	 * Determine whether an extension is allowed to record audio from the microphone.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canRecordAudio() {
		return await requestPermission('recordAudio')
	},

	/**
	 * Determine whether an extension is allowed to record video from the camera.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canRecordVideo() {
		return await requestPermission('recordVideo')
	},

	/**
	 * Determine whether an extension is allowed to read values from the clipboard.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canReadClipboard() {
		return await requestPermission('readClipboard')
	},

	/**
	 * Determine whether an extension is allowed to show system notifications.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canNotify() {
		return await requestPermission('notify')
	},

	/**
	 * Determine whether an extension is allowed to access precise geolocation.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canGeolocate() {
		// This is dangerous on a community site. Don't do it.
		alert(
			'This project tried to geolocate you (which some exotic extensions do), which is not supported on the viewer.\nPlease consider the risks and if you really need this functionality, open the project in the editor.',
		)
		return Promise.resolve(false)
	},

	/**
	 * Determine whether an extension is allowed to embed content from a given URL.
	 * @param {string} documentURL The URL of the embed.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canEmbed(documentURL: string) {
		return await requestPermission('embed', { url: documentURL })
	},

	/**
	 * Determine whether an extension is allowed to trigger a file download.
	 * @param {string} resourceURL The URL of the resource to download.
	 * @param {string} name The suggested filename.
	 * @returns {Promise<boolean>|boolean}
	 */
	async canDownload(resourceURL: string, name: string) {
		return await requestPermission('download', { url: resourceURL, name })
	},
}
