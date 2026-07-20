'use client'

import {
	dracula,
	duotoneDark,
	duotoneLight,
	githubLight,
	nord,
	okaidia,
	tokyoNight,
	vscodeDarkInit,
	vscodeLightInit,
	xcodeDark
} from '@uiw/codemirror-themes-all'
import type { Extension } from '@uiw/react-codemirror'
import { createContext, useContext, useLayoutEffect, useState } from 'react'

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

const isTheme = (value: string | null): value is Theme =>
	value !== null && themes.includes(value as Theme)

const cmThemes: Record<Theme, Extension> = {
	system: [],
	light: vscodeLightInit({
		settings: {
			caret: '#000000',
			fontFamily: 'monospace'
		}
	}),
	dark: vscodeDarkInit({
		settings: {
			caret: '#c6c6c6',
			fontFamily: 'monospace'
		}
	}),
	emerald: githubLight,
	retro: duotoneDark,
	cyberpunk: tokyoNight,
	valentine: okaidia,
	halloween: dracula,
	winter: duotoneLight,
	business: xcodeDark,
	nord: nord
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

	const changeTheme = (newTheme: Theme) => {
		setTheme(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	const cmTheme =
		theme === 'system'
			? systemTheme
				? cmThemes[systemTheme]
				: cmThemes.system
			: cmThemes[theme]

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
