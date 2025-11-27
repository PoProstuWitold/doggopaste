import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
	FaArrowRight,
	FaArrowUp,
	FaBookOpen,
	FaInfoCircle
} from 'react-icons/fa'
import { HiHashtag } from 'react-icons/hi'

export const metadata: Metadata = {
	title: 'Guide',
	description: 'Learn how to use DoggoPaste'
}

interface GuideItem {
	feature: string
	instructions: ReactNode
}

interface GuideSection {
	name: string
	label: string
	items: GuideItem[]
}

const guideSections: GuideSection[] = [
	{
		name: 'Users',
		label: 'users',
		items: [
			{
				feature: 'TO DO',
				instructions: <p>TO DO</p>
			}
		]
	},
	{
		name: 'Static Pastes',
		label: 'static-pastes',
		items: [
			{
				feature: 'TO DO',
				instructions: <p>TO DO</p>
			}
		]
	},
	{
		name: 'Folders',
		label: 'folders',
		items: [
			{
				feature: 'TO DO',
				instructions: <p>TO DO</p>
			}
		]
	},
	{
		name: 'Realtime Editors',
		label: 'realtime-editors',
		items: [
			{
				feature: 'TO DO',
				instructions: <p>TO DO</p>
			}
		]
	},
	{
		name: 'Admin',
		label: 'admin',
		items: [
			{
				feature: 'TO DO',
				instructions: <p>TO DO</p>
			}
		]
	}
]

export default function GuidePage() {
	return (
		<div className='min-h-screen bg-base-200/30 pb-20'>
			<div className='container mx-auto max-w-5xl px-4 py-8 flex flex-col gap-12'>
				{/* Header / Hero Section */}
				<div className='card bg-base-100 shadow-xl border border-base-200'>
					<div className='card-body gap-6'>
						<div className='flex items-start gap-4'>
							<div className='p-3 bg-primary/10 rounded-xl text-primary'>
								<FaInfoCircle className='w-8 h-8' />
							</div>
							<div className='flex flex-col gap-2'>
								<h1 className='text-3xl font-extrabold tracking-tight'>
									DoggoPaste Guide
								</h1>
								<p className='text-lg leading-relaxed'>
									Learn how to use DoggoPaste.
								</p>
							</div>
						</div>

						{/* Navigation Pills */}
						<div className='bg-base-200/50 rounded-box p-5'>
							<h3 className='font-bold uppercase tracking-wider mb-3 ml-1 flex items-center gap-2'>
								<FaBookOpen /> Table of Contents
							</h3>
							<nav className='flex flex-wrap gap-2'>
								{guideSections.map((section) => (
									<a
										key={section.name}
										href={`#${section.label}`}
										className='btn btn-outline btn-secondary'
									>
										{section.name}
										<FaArrowRight className='w-4 h-4 ml-1' />
									</a>
								))}
							</nav>
						</div>
					</div>
				</div>

				{/* Actual Guide Sections */}
				<div className='flex flex-col gap-16'>
					{guideSections.map((section) => (
						<div
							key={section.name}
							id={section.label}
							className='scroll-mt-24 flex flex-col gap-6'
						>
							{/* Section Header */}
							<div className='flex items-center gap-4'>
								<div className='h-px flex-1 bg-base-300'></div>
								<h2 className='text-2xl font-bold text-primary flex items-center gap-2'>
									<HiHashtag className='w-5 h-5 opacity-50' />
									{section.name}
								</h2>
								<div className='h-px flex-1 bg-base-300'></div>
							</div>

							{/* Section Items Grid */}
							<div className='grid gap-6 md:grid-cols-1'>
								{section.items.map((item) => (
									<div
										key={item.feature}
										className='card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow duration-300'
									>
										<div className='card-body'>
											<h3 className='card-title text-lg border-b border-base-100 pb-2 mb-2'>
												{item.feature}
											</h3>
											<div className='prose prose-sm max-w-none'>
												{item.instructions}
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Back to top */}
							<a
								className='self-end link-primary font-semibold link mt-2 flex items-center gap-2'
								href='/guide#'
							>
								back to top
								<FaArrowUp className='w-3 h-3' />
							</a>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
