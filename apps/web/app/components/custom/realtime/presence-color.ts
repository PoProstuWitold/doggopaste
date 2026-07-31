const PRESENCE_COLORS = [
	'#e11d48',
	'#db2777',
	'#9333ea',
	'#4f46e5',
	'#0284c7',
	'#0891b2',
	'#059669',
	'#65a30d',
	'#ca8a04',
	'#ea580c'
] as const

export const getPresenceColor = (id: string): string => {
	let hash = 0
	for (let index = 0; index < id.length; index += 1) {
		hash = (hash * 31 + id.charCodeAt(index)) | 0
	}

	return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length] ?? '#0284c7'
}
