'use client'

import type { Extension } from '@uiw/react-codemirror'
import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useState
} from 'react'

const themes = [
	'system',
	'light',
	'dark',
	'emerald',
	'retro',
	'cyberpunk',
	'valentine',
	'halloween',
	'winter',
	'business',
	'nord'
] as const

export type Theme = (typeof themes)[number]

type SystemTheme = 'light' | 'dark'
type ResolvedTheme = Exclude<Theme, 'system'>

const isTheme = (value: string | null): value is Theme =>
	value !== null && themes.includes(value as Theme)

const cmThemePromises = new Map<ResolvedTheme, Promise<Extension>>()

const loadCodeMirrorTheme = (theme: ResolvedTheme): Promise<Extension> => {
	const cached = cmThemePromises.get(theme)
	if (cached) return cached

	const loading = import('@uiw/codemirror-themes-all')
		.then((themes) => {
			switch (theme) {
				case 'light':
					return themes.vscodeLightInit({
						settings: {
							caret: '#000000',
							fontFamily: 'monospace'
						}
					})
				case 'dark':
					return themes.vscodeDarkInit({
						settings: {
							caret: '#c6c6c6',
							fontFamily: 'monospace'
						}
					})
				case 'emerald':
					return themes.githubLight
				case 'retro':
					return themes.duotoneDark
				case 'cyberpunk':
					return themes.tokyoNight
				case 'valentine':
					return themes.okaidia
				case 'halloween':
					return themes.dracula
				case 'winter':
					return themes.duotoneLight
				case 'business':
					return themes.xcodeDark
				case 'nord':
					return themes.nord
				default:
					return []
			}
		})
		.catch(() => [])

	cmThemePromises.set(theme, loading)
	return loading
}

interface ThemeContextType {
	theme: Theme
	setTheme: (theme: Theme) => void
	cmTheme: Extension
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({
	children,
	defaultTheme = 'system'
}: {
	children: React.ReactNode
	defaultTheme?: Theme
}) => {
	const [theme, setTheme] = useState<Theme>(defaultTheme)
	const [systemTheme, setSystemTheme] = useState<SystemTheme | null>(null)
	const [cmTheme, setCmTheme] = useState<Extension>([])

	useLayoutEffect(() => {
		const storedTheme = localStorage.getItem('theme')
		const savedTheme = isTheme(storedTheme) ? storedTheme : defaultTheme

		setTheme(savedTheme)
		if (storedTheme !== savedTheme)
			localStorage.setItem('theme', savedTheme)
	}, [defaultTheme])

	useLayoutEffect(() => {
		const root = document.documentElement
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		const applyTheme = () => {
			const preferredTheme: SystemTheme = mediaQuery.matches
				? 'dark'
				: 'light'
			setSystemTheme(preferredTheme)
			root.setAttribute(
				'data-theme',
				theme === 'system' ? preferredTheme : theme
			)
		}

		applyTheme()
		mediaQuery.addEventListener('change', applyTheme)

		return () => mediaQuery.removeEventListener('change', applyTheme)
	}, [theme])

	useEffect(() => {
		const resolvedTheme = theme === 'system' ? systemTheme : theme
		if (!resolvedTheme) {
			setCmTheme([])
			return
		}

		let current = true
		void loadCodeMirrorTheme(resolvedTheme).then((loadedTheme) => {
			if (current) setCmTheme(loadedTheme)
		})

		return () => {
			current = false
		}
	}, [systemTheme, theme])

	const changeTheme = (newTheme: Theme) => {
		setTheme(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	return (
		<ThemeContext.Provider
			value={{ theme, setTheme: changeTheme, cmTheme }}
		>
			{children}
		</ThemeContext.Provider>
	)
}

export const useTheme = () => {
	const context = useContext(ThemeContext)
	if (!context)
		throw new Error('useTheme must be used within a ThemeProvider')

	return context
}
