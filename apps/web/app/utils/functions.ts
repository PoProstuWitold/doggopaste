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
import { StreamLanguage } from '@codemirror/language'
import { c, dart, kotlin, scala } from '@codemirror/legacy-modes/mode/clike'
import { cmake } from '@codemirror/legacy-modes/mode/cmake'
import { cobol } from '@codemirror/legacy-modes/mode/cobol'
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile'
import { erlang } from '@codemirror/legacy-modes/mode/erlang'
import { fortran } from '@codemirror/legacy-modes/mode/fortran'
import { haskell } from '@codemirror/legacy-modes/mode/haskell'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { nginx } from '@codemirror/legacy-modes/mode/nginx'
import { pascal } from '@codemirror/legacy-modes/mode/pascal'
import { perl } from '@codemirror/legacy-modes/mode/perl'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { csharp } from '@replit/codemirror-lang-csharp'
import { svelte } from '@replit/codemirror-lang-svelte'
import { graphql } from 'cm6-graphql'

export const getBaseApiUrl = (): string => {
	let basicUrl = ''

	if (typeof window === 'undefined') {
		basicUrl = process.env.APP_URL ?? 'http://doggopaste:3002'
		console.log('[server] using APP_URL:', basicUrl)
		return basicUrl
	}

	const { protocol, hostname, port } = window.location
	const isHttps = protocol === 'https:'

	const actualPort = port || (isHttps ? '443' : '80') // <--- KLUCZOWA ZMIANA

	if (isHttps) {
		basicUrl = `${protocol}//${hostname}`
		console.log('[https] using HTTPS domain-based API:', basicUrl)
	} else if (actualPort === '3002') {
		basicUrl = `${protocol}//${hostname}:${actualPort}`
		console.log('[proxy] using shared proxy at port 3002:', basicUrl)
	} else {
		basicUrl = `${protocol}//${hostname}:3001`
		console.log('[local dev] using separate API on port 3001:', basicUrl)
	}

	return basicUrl
}

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
	'C#': csharp(),
	Svelte: svelte(),
	GraphQL: graphql(),
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
	Plaintext: [],
	// LEGACY MODES
	C: StreamLanguage.define(c),
	HolyC: StreamLanguage.define(c),
	Dart: StreamLanguage.define(dart),
	Kotlin: StreamLanguage.define(kotlin),
	Scala: StreamLanguage.define(scala),
	CMake: StreamLanguage.define(cmake),
	Cobol: StreamLanguage.define(cobol),
	Dockerfile: StreamLanguage.define(dockerFile),
	Erlang: StreamLanguage.define(erlang),
	Fortran: StreamLanguage.define(fortran),
	Haskell: StreamLanguage.define(haskell),
	Lua: StreamLanguage.define(lua),
	Nginx: StreamLanguage.define(nginx),
	Pascal: StreamLanguage.define(pascal),
	Perl: StreamLanguage.define(perl),
	PowerShell: StreamLanguage.define(powerShell),
	Shell: StreamLanguage.define(shell),
	Ruby: StreamLanguage.define(ruby),
	Swift: StreamLanguage.define(swift),
	TOML: StreamLanguage.define(toml)
}

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
