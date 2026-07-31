export const mapUniqueError = (constraint: string): string => {
	const parts = constraint.split('_')
	if (parts.length < 3) return constraint

	const table = parts[0]
	const field = parts[1]

	if (!table || !field) return constraint

	const entity = table.endsWith('s') ? table.slice(0, -1) : table

	return `${capitalize(entity)} already exists. Use another ${field}.`
}

export const capitalize = (s: string): string => {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

export const getBaseApiUrl = (): string => {
	let basicUrl = ''

	if (typeof window === 'undefined') {
		basicUrl = process.env.DOCKER
			? 'http://doggopaste:3002'
			: 'http://localhost:3002'
		return basicUrl
	}

	const { protocol, hostname, port } = window.location
	const isHttps = protocol === 'https:'

	const actualPort = port || (isHttps ? '443' : '80')

	if (isHttps) {
		basicUrl = `${protocol}//${hostname}`
	} else if (actualPort === '3002') {
		basicUrl = `${protocol}//${hostname}:${actualPort}`
	} else {
		basicUrl = `${protocol}//${hostname}:3001`
	}

	return basicUrl
}

export const setThemeScript = `
(function() {
	try {
		const savedTheme = localStorage.getItem('theme');
		const allowedThemes = ['system', 'light', 'dark', 'oled', 'emerald', 'retro', 'cyberpunk', 'valentine', 'halloween', 'winter', 'business', 'nord'];
		const theme = allowedThemes.includes(savedTheme) ? savedTheme : 'system';
		const root = document.documentElement;
		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			root.setAttribute('data-theme', systemTheme);
		} else {
			root.setAttribute('data-theme', theme);
		}
	} catch (e) {
		console.error('Failed to set theme:', e);
	}
})();
`

export const wait = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

export function getContrastTextColor(hex: string): string {
	// Removes # if present
	const trueHex = hex.replace('#', '')

	// Parses RGB values from hex string
	const r = Number.parseInt(trueHex.substring(0, 2), 16)
	const g = Number.parseInt(trueHex.substring(2, 4), 16)
	const b = Number.parseInt(trueHex.substring(4, 6), 16)

	// Luminance according to W3C standard
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

	// If light background → dark text, otherwise light
	return luminance > 0.5 ? '#000000' : '#ffffff'
}

export const categories = [
	['none', 'None'],
	['cryptocurrency', 'Cryptocurrency'],
	['cybersecurity', 'Cybersecurity'],
	['fixit', 'Fix It'],
	['gaming', 'Gaming'],
	['help', 'Help'],
	['software', 'Software'],
	['note', 'Note'],
	['config', 'Config'],
	['question', 'Question'],
	['log', 'Log'],
	['project', 'Project'],
	['snippet', 'Snippet'],
	['education', 'Education']
] as const

export function getCategoryLabel(value: string): string {
	const found = categories.find(([val]) => val === value)
	return found ? found[1] : value
}

export function firstLetterUppercase(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export const expirationLabels = {
	never: 'Never',
	burn_after_read: 'Burn After Read',
	'10m': '10 Minutes',
	'1h': '1 Hour',
	'1d': '1 Day',
	'1w': '1 Week',
	'2w': '2 Weeks'
}
export function getExpirationLabel(value: string): string {
	return expirationLabels[value as keyof typeof expirationLabels] || value
}
