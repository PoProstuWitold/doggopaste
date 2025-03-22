'use client'

import {
	andromeda,
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
import { createContext, useContext, useEffect, useState } from 'react'

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

const cmThemes: Record<Theme, Extension> = {
	system: andromeda,
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

	useEffect(() => {
		const savedTheme =
			(localStorage.getItem('theme') as Theme) || defaultTheme
		setTheme(savedTheme)
		applyTheme(savedTheme)
	}, [defaultTheme])

	const applyTheme = (newTheme: Theme) => {
		const root = document.documentElement
		const actualTheme =
			newTheme === 'system'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: newTheme

		root.setAttribute('data-theme', actualTheme)
		localStorage.setItem('theme', newTheme)
	}

	const changeTheme = (newTheme: Theme) => {
		setTheme(newTheme)
		applyTheme(newTheme)
	}

	return (
		<ThemeContext.Provider
			value={{ theme, setTheme: changeTheme, cmTheme: cmThemes[theme] }}
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
