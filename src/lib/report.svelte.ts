export type ReportType = 'project' | 'user' | 'comment' | 'studio'

export const reportState = $state({
	show: false,
	targetId: '',
	targetType: 'project' as ReportType,
	targetName: '',

	open(id: string, type: ReportType, name: string) {
		this.targetId = id
		this.targetType = type
		this.targetName = name
		this.show = true
	},
})
