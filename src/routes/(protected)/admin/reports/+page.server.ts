import { fail, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('p')) || 1
	const reportsPerPage = 20
	const reports = await db
		.select({
			id: table.report.id,
			itemId: table.report.itemId,
			itemType: table.report.itemType,
			chosenReason: table.report.chosenReason,
			description: table.report.description,
			creator: table.report.creator,
		})
		.from(table.report)
		.limit(reportsPerPage)
		.offset((page - 1) * reportsPerPage)
		.orderBy(desc(table.report.createdAt))
	const reportSearch = Number(event.url.searchParams.get('report')?.trim())
	if (reportSearch) {
		const report = await db.query.report.findFirst({
			where: eq(table.report.id, reportSearch),
		})

		if (!report) {
			return fail(404, { message: 'Report not found' })
		}

		return { reports: [report], page: 0, totalPages: 0 }
	}
	const totalReports = await db.$count(table.report)
	const totalPages = Math.ceil(totalReports / reportsPerPage)
	if (totalPages > 0 && page > totalPages) {
		return redirect(302, `/admin/reports`)
	}

	return { reports, page, totalPages }
}

export const actions: Actions = {
	finishReport: async ({ request }) => {
		const formData = await request.formData()
		const reportId = Number(formData.get('reportId'))

		if (!reportId || isNaN(reportId)) {
			return fail(400, { message: 'Invalid report ID' })
		}

		try {
			await db.delete(table.report).where(eq(table.report.id, reportId))

			return { success: true }
		} catch {
			return fail(500, { message: 'Failed to delete report' })
		}
	},
}
