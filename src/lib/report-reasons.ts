export const reportReasons: Record<string, Record<string, string>> = {
	project: {
		inappropriate: 'Inappropriate language/content',
		horror: 'Blood/gore/extreme horror',
		malicious: 'Malware or malicious extensions',
		copyright: 'Copyright / Uncredited assets',
		other: 'Other',
	},
	user: {
		username: 'Inappropriate username',
		impersonation: 'Impersonating another user',
		harassment: 'Harassment or bullying',
		other: 'Other',
	},
	comment: {
		spam: 'Spam or advertisement',
		harassment: 'Harassment or hate speech',
		inappropriate: 'Inappropriate language',
		other: 'Other',
	},
	studio: {
		spam: 'Spam or advertisement',
		harassment: 'Harassment or hate speech',
		raids: 'This studio is being raided',
		other: 'Other',
	},
} as const
