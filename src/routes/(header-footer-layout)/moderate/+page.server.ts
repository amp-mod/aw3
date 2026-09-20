import { error, fail, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'
import { canPerformAction } from '$lib/server/permissions'

export const load: PageServerLoad = async (event) => {
	if (!canPerformAction(event.locals.user, 'accessModPanel')) {
		return error(403)
	}

	const page = Number(event.url.searchParams.get('p')) || 1
	const reportsPerPage = 20

	// Check if looking up a specific report ID via search parameter
	const reportSearch = Number(event.url.searchParams.get('report')?.trim())
	if (reportSearch && !isNaN(reportSearch)) {
		const report = await db.query.report.findFirst({
			where: and(eq(table.report.id, reportSearch), eq(table.report.isResolved, false)),
		})

		if (!report) {
			return fail(404, { message: 'Unfinished report not found' })
		}

		return { reports: [report], page: 0, totalPages: 0 }
	}

	// Fetch only unresolved reports with pagination
	const reports = await db
		.select({
			id: table.report.id,
			itemId: table.report.itemId,
			itemType: table.report.itemType,
			chosenReason: table.report.chosenReason,
			description: table.report.description,
			creator: table.report.creator,
			isResolved: table.report.isResolved,
		})
		.from(table.report)
		.where(eq(table.report.isResolved, false))
		.limit(reportsPerPage)
		.offset((page - 1) * reportsPerPage)
		.orderBy(desc(table.report.createdAt))

	// Calculate pagination totals based strictly on unresolved reports
	const totalReports = await db.$count(table.report, eq(table.report.isResolved, false))
	const totalPages = Math.ceil(totalReports / reportsPerPage)

	if (totalPages > 0 && page > totalPages) {
		return redirect(302, `/admin/reports`)
	}

	return { reports, page, totalPages }
}

export const actions: Actions = {
	finishReport: async ({ request, locals }) => {
		if (!canPerformAction(locals.user, 'accessModPanel')) {
			return fail(403, { message: 'Unauthorized' })
		}

		const formData = await request.formData()
		const reportId = Number(formData.get('reportId'))

		if (!reportId || isNaN(reportId)) {
			return fail(400, { message: 'Invalid report ID' })
		}

		try {
			await db.update(table.report).set({ isResolved: true }).where(eq(table.report.id, reportId))

			return { success: true }
		} catch {
			return fail(500, { message: 'Failed to update report status' })
		}
	},
}
