import { angular } from '@codemirror/lang-angular'
import { cpp } from '@codemirror/lang-cpp'
import { css } from '@codemirror/lang-css'
import { go } from '@codemirror/lang-go'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { less } from '@codemirror/lang-less'
import { markdown } from '@codemirror/lang-markdown'
import { php } from '@codemirror/lang-php'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { sass } from '@codemirror/lang-sass'
import {
	Cassandra,
	MariaSQL,
	MySQL,
	PostgreSQL,
	SQLite,
	StandardSQL,
	sql
} from '@codemirror/lang-sql'
import { vue } from '@codemirror/lang-vue'
import { wast } from '@codemirror/lang-wast'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'

export const setThemeScript = `
(function() {
	try {
		const theme = localStorage.getItem('theme') || 'system';
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

export const extensions = {
	JavaScript: javascript(),
	TypeScript: javascript({ typescript: true }),
	JSX: javascript({ jsx: true }),
	TSX: javascript({ jsx: true, typescript: true }),
	Python: python(),
	'C++': cpp(),
	HTML: html(),
	Angular: angular(),
	CSS: css(),
	Go: go(),
	Java: java(),
	JSON: json(),
	Less: less(),
	Markdown: markdown(),
	PHP: php(),
	Rust: rust(),
	Sass: sass(),
	Vue: vue(),
	WebAssembly: wast(),
	XML: xml(),
	YAML: yaml(),
	SQL: sql(),
	PostgreSQL: sql({ dialect: PostgreSQL }),
	MySQL: sql({ dialect: MySQL }),
	Cassandra: sql({ dialect: Cassandra }),
	SQLite: sql({ dialect: SQLite }),
	MariaDB: sql({ dialect: MariaSQL }),
	StandardSQL: sql({ dialect: StandardSQL }),
	Plaintext: []
}

export const languageColors = new Map<string, string>([
	['JavaScript', '#f1e05a'],
	['TypeScript', '#3178c6'],
	['Python', '#3572A5'],
	['C++', '#f34b7d'],
	['HTML', '#e34c26'],
	['CSS', '#663399'],
	['Go', '#00ADD8'],
	['Java', '#b07219'],
	['PHP', '#4F5D95'],
	['Rust', '#dea584'],
	['Sass', '#a53b70'],
	['Vue', '#41b883'],
	['JSON', '#292929'],
	['Markdown', '#083fa1'],
	['WebAssembly', '#04133b'],
	['XML', '#0060ac'],
	['YAML', '#cb171e'],
	['SQL', '#e38c00'],
	['JSX', '#61dafb'], // non official
	['TSX', '#3178c6'], // non official
	['Angular', '#dd1b16'], // non official
	['Less', '#1d365d'], // non official
	['PostgreSQL', '#336791'], // non official
	['MySQL', '#00758f'], // non official
	['Cassandra', '#1287b1'], // non official
	['SQLite', '#003b57'], // non official
	['MariaDB', '#003545'], // non official
	['StandardSQL', '#e38c00'], // non official
	['Plaintext', '#808080'] // non official
])

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
