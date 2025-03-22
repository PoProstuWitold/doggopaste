'use client'

import { type Theme, useTheme } from '../context/ThemeContext'

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

export const ThemeSelector = () => {
	const { theme, setTheme } = useTheme()

	return (
		<>
			<label htmlFor='Themes' className='sr-only'>
				Choose a theme
			</label>
			<select
				id='Themes'
				value={theme}
				className='max-w-xs select select-ghost font-semibold outline outline-primary text-primary'
				onChange={(e) => setTheme(e.currentTarget.value as Theme)}
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
