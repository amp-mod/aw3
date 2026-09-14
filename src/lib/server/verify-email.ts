import { sendEmail } from '$lib/server/email'
import emailContent from './emails/verify-email.html?raw'

interface SendVerificationEmailOptions {
	to: string
	verifyID: string
	origin: string
}

export async function sendVerificationEmail({
	to,
	verifyID,
	origin,
}: SendVerificationEmailOptions) {
	const verifyLink = `${origin}/auth/verify-email?id=${verifyID}`

	return sendEmail({
		to,
		subject: 'Click to verify your account',
		data: {
			title: 'Verify your Email',
			content: emailContent.replaceAll('{link}', verifyLink),
		},
	})
}
