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
	['C#', '#178600'],
	['Svelte', '#ff3e00'],
	['GraphQL', '#e10098'],
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
	['Plaintext', '#808080'], // non official
	// LEGACY MODES
	['C', '#555555'],
	['HolyC', '#ffefaf'],
	['Dart', '#00B4AB'],
	['Kotlin', '#A97BFF'],
	['Scala', '#c22d40'],
	['CMake', '#DA3434'],
	['Cobol', '#0058A3'],
	['Dockerfile', '#384d54'],
	['Erlang', '#B83998'],
	['Fortran', '#4d41b1'],
	['Haskell', '#5e5086'],
	['Lua', '#000080'],
	['Nginx', '#009639'],
	['Pascal', '#E3F171'],
	['Perl', '#0298c3'],
	['PowerShell', '#012456'],
	['Shell', '#89e051'],
	['Ruby', '#701516'],
	['Swift', '#F05138'],
	['TOML', '#9c4221']
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
