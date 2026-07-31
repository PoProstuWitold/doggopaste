'use client'

import { useEffect, useState } from 'react'
import {
	FaBolt,
	FaCode,
	FaFileCode,
	FaTags,
	FaUserGroup
} from 'react-icons/fa6'

const sections = [
	{ id: 'admin-users', label: 'Users', icon: FaUserGroup },
	{ id: 'admin-static-pastes', label: 'Static pastes', icon: FaFileCode },
	{ id: 'admin-realtime', label: 'Realtime', icon: FaBolt },
	{ id: 'admin-tags', label: 'Tags', icon: FaTags },
	{ id: 'admin-syntaxes', label: 'Syntaxes', icon: FaCode }
] as const

type SectionId = (typeof sections)[number]['id']

const defaultSectionId: SectionId = 'admin-users'

function isSectionId(value: string): value is SectionId {
	return sections.some(({ id }) => id === value)
}

function openSection(id: SectionId) {
	const details = document.getElementById(id)?.querySelector('details')
	if (details) details.open = true
}

export const AdminNavigation: React.FC = () => {
	const [activeId, setActiveId] = useState<SectionId>(defaultSectionId)

	useEffect(() => {
		function syncWithHash() {
			const hashId = window.location.hash.slice(1)
			const nextId = isSectionId(hashId) ? hashId : defaultSectionId

			setActiveId(nextId)
			openSection(nextId)
		}

		syncWithHash()
		window.addEventListener('hashchange', syncWithHash)

		return () => window.removeEventListener('hashchange', syncWithHash)
	}, [])

	return (
		<nav
			aria-label='Admin dashboard sections'
			className='border-t border-base-300 bg-base-200/50 p-3 sm:p-4'
		>
			<ul className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
				{sections.map(({ id, label, icon: Icon }) => {
					const active = activeId === id

					return (
						<li key={id} className='min-w-0'>
							<a
								href={`#${id}`}
								aria-current={active ? 'location' : undefined}
								onClick={() => {
									setActiveId(id)
									openSection(id)
								}}
								className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto sm:justify-start ${
									active
										? 'border-primary/35 bg-primary/10 text-primary'
										: 'border-transparent hover:border-base-300 hover:bg-base-100'
								}`}
							>
								<Icon aria-hidden='true' className='shrink-0' />
								<span className='truncate'>{label}</span>
							</a>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}
