'use client'

import { useEffect, useState } from 'react'

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
		setHTMLTheme(savedTheme)
	}, [defaultTheme])

	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme)
		setHTMLTheme(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	const setHTMLTheme = (newTheme: string) => {
		const root = document.documentElement

		if (newTheme === 'system') {
			const systemTheme = window.matchMedia(
				'(prefers-color-scheme: dark)'
			).matches
				? 'dark'
				: 'light'
			root.setAttribute('data-theme', systemTheme)
		} else {
			root.setAttribute('data-theme', newTheme)
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
