'use client'

import { useEffect, useState } from 'react'

import 'highlight.js/styles/github-dark.css'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/styles/gradient-light.css'
import 'highlight.js/styles/tokyo-night-dark.css'
import 'highlight.js/styles/shades-of-purple.css'
import 'highlight.js/styles/monokai-sublime.css'
import 'highlight.js/styles/stackoverflow-light.css'
import 'highlight.js/styles/nord.css'
import { themeToHighlightStyle } from '../utils/themes'

interface ThemeSelectorProps {
	defaultTheme: string
}

const themes = [
	{ name: 'System', value: 'system' },
	{ name: 'Light', value: 'light' },
	{ name: 'Dark', value: 'dark' },
	{ name: 'Emerald', value: 'emerald' },
	{ name: 'Retro', value: 'retro' },
	{ name: 'Cyberpunk', value: 'cyberpunk' },
	{ name: 'Valentine', value: 'valentine' },
	{ name: 'Halloween', value: 'halloween' },
	{ name: 'Winter', value: 'winter' },
	{ name: 'Business', value: 'business' },
	{ name: 'Nord', value: 'nord' }
]

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
	defaultTheme
}) => {
	const [theme, setTheme] = useState<string>(defaultTheme)

	useEffect(() => {
		const savedTheme = localStorage.getItem('theme') || defaultTheme
		setTheme(savedTheme)
		applyTheme(savedTheme)
	}, [defaultTheme])

	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme)
		applyTheme(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	const applyTheme = (newTheme: string) => {
		const root = document.documentElement

		if (newTheme === 'system') {
			const systemTheme = window.matchMedia(
				'(prefers-color-scheme: dark)'
			).matches
				? 'dark'
				: 'light'
			root.setAttribute('data-theme', systemTheme)
			document.body.setAttribute(
				'data-highlight',
				themeToHighlightStyle[systemTheme] as string
			)
		} else {
			root.setAttribute('data-theme', newTheme)
			document.body.setAttribute(
				'data-highlight',
				themeToHighlightStyle[newTheme] as string
			)
		}
	}

	return (
		<>
			<label htmlFor='Themes' className='sr-only'>
				Choose a theme
			</label>
			<select
				id='Themes'
				value={theme}
				className='max-w-xs select select-ghost font-semibold outline outline-primary text-primary'
				onChange={(e) => handleThemeChange(e.currentTarget.value)}
			>
				{themes.map((themeOption, index) => (
					<option
						key={`${index}:${themeOption.name}`}
						value={themeOption.value}
					>
						{themeOption.name}
					</option>
				))}
			</select>
		</>
	)
}
