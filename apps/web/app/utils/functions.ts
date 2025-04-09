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
	MariaSQL: sql({ dialect: MariaSQL }),
	StandardSQL: sql({ dialect: StandardSQL }),
	Plaintext: []
}
