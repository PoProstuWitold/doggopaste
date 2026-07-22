import type { Extension } from '@codemirror/state'

export const syntaxNames = [
	'JavaScript',
	'TypeScript',
	'JSX',
	'TSX',
	'Python',
	'C++',
	'HTML',
	'Angular',
	'CSS',
	'Go',
	'Java',
	'JSON',
	'Less',
	'Markdown',
	'PHP',
	'Rust',
	'Sass',
	'C#',
	'Svelte',
	'GraphQL',
	'Vue',
	'WebAssembly',
	'XML',
	'YAML',
	'SQL',
	'PostgreSQL',
	'MySQL',
	'Cassandra',
	'SQLite',
	'MariaDB',
	'StandardSQL',
	'Plaintext',
	'C',
	'HolyC',
	'Dart',
	'Kotlin',
	'Scala',
	'CMake',
	'Cobol',
	'Dockerfile',
	'Erlang',
	'Fortran',
	'Haskell',
	'Lua',
	'Nginx',
	'Pascal',
	'Perl',
	'PowerShell',
	'Shell',
	'R',
	'Ruby',
	'Swift',
	'TOML'
] as const

const languageLoaders: Record<string, () => Promise<Extension>> = {
	JavaScript: async () =>
		(await import('@codemirror/lang-javascript')).javascript(),
	TypeScript: async () =>
		(await import('@codemirror/lang-javascript')).javascript({
			typescript: true
		}),
	JSX: async () =>
		(await import('@codemirror/lang-javascript')).javascript({ jsx: true }),
	TSX: async () =>
		(await import('@codemirror/lang-javascript')).javascript({
			jsx: true,
			typescript: true
		}),
	Python: async () => (await import('@codemirror/lang-python')).python(),
	'C++': async () => (await import('@codemirror/lang-cpp')).cpp(),
	HTML: async () => (await import('@codemirror/lang-html')).html(),
	Angular: async () => (await import('@codemirror/lang-angular')).angular(),
	CSS: async () => (await import('@codemirror/lang-css')).css(),
	Go: async () => (await import('@codemirror/lang-go')).go(),
	Java: async () => (await import('@codemirror/lang-java')).java(),
	JSON: async () => (await import('@codemirror/lang-json')).json(),
	Less: async () => (await import('@codemirror/lang-less')).less(),
	Markdown: async () =>
		(await import('@codemirror/lang-markdown')).markdown(),
	PHP: async () => (await import('@codemirror/lang-php')).php(),
	Rust: async () => (await import('@codemirror/lang-rust')).rust(),
	Sass: async () => (await import('@codemirror/lang-sass')).sass(),
	'C#': async () => (await import('@replit/codemirror-lang-csharp')).csharp(),
	Svelte: async () =>
		(await import('@replit/codemirror-lang-svelte')).svelte(),
	GraphQL: async () => (await import('cm6-graphql')).graphql(),
	Vue: async () => (await import('@codemirror/lang-vue')).vue(),
	WebAssembly: async () => (await import('@codemirror/lang-wast')).wast(),
	XML: async () => (await import('@codemirror/lang-xml')).xml(),
	YAML: async () => (await import('@codemirror/lang-yaml')).yaml(),
	SQL: async () => (await import('@codemirror/lang-sql')).sql(),
	PostgreSQL: async () => {
		const sqlModule = await import('@codemirror/lang-sql')
		return sqlModule.sql({ dialect: sqlModule.PostgreSQL })
	},
	MySQL: async () => {
		const sqlModule = await import('@codemirror/lang-sql')
		return sqlModule.sql({ dialect: sqlModule.MySQL })
	},
	Cassandra: async () => {
		const sqlModule = await import('@codemirror/lang-sql')
		return sqlModule.sql({ dialect: sqlModule.Cassandra })
	},
	SQLite: async () => {
		const sqlModule = await import('@codemirror/lang-sql')
		return sqlModule.sql({ dialect: sqlModule.SQLite })
	},
	MariaDB: async () => {
		const sqlModule = await import('@codemirror/lang-sql')
		return sqlModule.sql({ dialect: sqlModule.MariaSQL })
	},
	StandardSQL: async () => {
		const sqlModule = await import('@codemirror/lang-sql')
		return sqlModule.sql({ dialect: sqlModule.StandardSQL })
	},
	Plaintext: async () => [],
	C: async () => {
		const [{ StreamLanguage }, { c }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/clike')
		])
		return StreamLanguage.define(c)
	},
	HolyC: async () => {
		const [{ StreamLanguage }, { c }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/clike')
		])
		return StreamLanguage.define(c)
	},
	Dart: async () => {
		const [{ StreamLanguage }, { dart }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/clike')
		])
		return StreamLanguage.define(dart)
	},
	Kotlin: async () => {
		const [{ StreamLanguage }, { kotlin }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/clike')
		])
		return StreamLanguage.define(kotlin)
	},
	Scala: async () => {
		const [{ StreamLanguage }, { scala }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/clike')
		])
		return StreamLanguage.define(scala)
	},
	CMake: async () => {
		const [{ StreamLanguage }, { cmake }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/cmake')
		])
		return StreamLanguage.define(cmake)
	},
	Cobol: async () => {
		const [{ StreamLanguage }, { cobol }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/cobol')
		])
		return StreamLanguage.define(cobol)
	},
	Dockerfile: async () => {
		const [{ StreamLanguage }, { dockerFile }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/dockerfile')
		])
		return StreamLanguage.define(dockerFile)
	},
	Erlang: async () => {
		const [{ StreamLanguage }, { erlang }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/erlang')
		])
		return StreamLanguage.define(erlang)
	},
	Fortran: async () => {
		const [{ StreamLanguage }, { fortran }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/fortran')
		])
		return StreamLanguage.define(fortran)
	},
	Haskell: async () => {
		const [{ StreamLanguage }, { haskell }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/haskell')
		])
		return StreamLanguage.define(haskell)
	},
	Lua: async () => {
		const [{ StreamLanguage }, { lua }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/lua')
		])
		return StreamLanguage.define(lua)
	},
	Nginx: async () => {
		const [{ StreamLanguage }, { nginx }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/nginx')
		])
		return StreamLanguage.define(nginx)
	},
	Pascal: async () => {
		const [{ StreamLanguage }, { pascal }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/pascal')
		])
		return StreamLanguage.define(pascal)
	},
	Perl: async () => {
		const [{ StreamLanguage }, { perl }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/perl')
		])
		return StreamLanguage.define(perl)
	},
	PowerShell: async () => {
		const [{ StreamLanguage }, { powerShell }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/powershell')
		])
		return StreamLanguage.define(powerShell)
	},
	Shell: async () => {
		const [{ StreamLanguage }, { shell }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/shell')
		])
		return StreamLanguage.define(shell)
	},
	R: async () => {
		const [{ StreamLanguage }, { r }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/r')
		])
		return StreamLanguage.define(r)
	},
	Ruby: async () => {
		const [{ StreamLanguage }, { ruby }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/ruby')
		])
		return StreamLanguage.define(ruby)
	},
	Swift: async () => {
		const [{ StreamLanguage }, { swift }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/swift')
		])
		return StreamLanguage.define(swift)
	},
	TOML: async () => {
		const [{ StreamLanguage }, { toml }] = await Promise.all([
			import('@codemirror/language'),
			import('@codemirror/legacy-modes/mode/toml')
		])
		return StreamLanguage.define(toml)
	}
}

const languageCache = new Map<string, Promise<Extension>>()

export const loadEditorLanguage = (name: string): Promise<Extension> => {
	const loader =
		languageLoaders[name] ?? languageLoaders.Plaintext ?? (async () => [])
	const cached = languageCache.get(name)
	if (cached) return cached

	const extension = loader().catch(() => [])
	languageCache.set(name, extension)
	return extension
}
