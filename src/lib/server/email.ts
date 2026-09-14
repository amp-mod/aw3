import nodemailer from 'nodemailer'
import defaultTemplate from './email-template.html?raw'
import { env } from '$env/dynamic/private'
import logo from '$lib/assets/logo.svg'

export const mustVerifyEmail = !!env.EMAIL_HOST

const transporter = mustVerifyEmail
	? nodemailer.createTransport({
			host: env.EMAIL_HOST,
			port: Number(env.EMAIL_PORT) || 587,
			secure: env.EMAIL_SECURE === 'true',
			auth: {
				user: env.EMAIL_USER,
				pass: env.EMAIL_PASS,
			},
		})
	: null

/**
 * Replaces {{placeholder}} keys in a template string with values from a data object.
 */
function renderTemplate(template: string, data: Record<string, string | number> = {}) {
	return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(data[key] ?? ''))
}

interface SendEmailOptions {
	to: string
	subject: string
	template?: string
	data?: Record<string, string | number>
}

/**
 * Sends an email using the imported template with placeholder values.
 */
export async function sendEmail({
	to,
	subject,
	template = defaultTemplate,
	data = {},
}: SendEmailOptions) {
	if (!mustVerifyEmail || !transporter) {
		console.warn('EMAIL_HOST is not configured. Skipping email send.')
		return null
	}

	const html = renderTemplate(template, data)

	return transporter.sendMail({
		from: `AmpMod <${env.EMAIL_FROM}>`,
		to,
		subject: subject + ' | AmpMod',
		html,
	})
}
