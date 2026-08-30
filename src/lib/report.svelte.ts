export type ReportType = 'project' | 'user' | 'comment' | 'studio'

export const reportState = $state({
	show: false,
	targetType: 'project' as ReportType,
	targetName: '',

	open(type: ReportType, name: string) {
		this.targetType = type
		this.targetName = name
		this.show = true
	},
})
