import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
	FaArrowRight,
	FaBolt,
	FaFileCode,
	FaGithub,
	FaInfoCircle,
	FaQuestionCircle
} from 'react-icons/fa'
import { MdMenuBook, MdSchool } from 'react-icons/md'
import { FeatureSection } from './components/custom/FeatureSection'
import { getCurrentViewer } from './utils/session'

export const metadata: Metadata = {
	title: 'DoggoPaste',
	description:
		'Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable.'
}

export default async function HomePage() {
	const viewer = await getCurrentViewer()

	return (
		<div className='mx-auto flex w-full max-w-7xl flex-col gap-16 pb-12 sm:gap-20'>
			<section className='relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 px-5 py-8 sm:px-8 sm:py-12 lg:px-12'>
				<div className='absolute inset-y-0 right-0 hidden w-2/5 bg-primary/5 lg:block' />
				<div className='relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]'>
					<div className='min-w-0'>
						<div className='mb-6 flex flex-wrap items-center gap-2'>
							<span
								className={`badge h-auto max-w-full min-w-0 gap-2 py-2 ${viewer ? 'badge-success' : 'badge-ghost'}`}
							>
								<span
									className='h-2 w-2 rounded-full bg-current'
									aria-hidden='true'
								/>
								<span className='min-w-0 truncate'>
									{viewer
										? `Signed in as ${viewer.name}`
										: 'Ready for a guest paste'}
								</span>
							</span>
							<span className='badge badge-outline h-auto py-2'>
								Open source · self-hostable
							</span>
						</div>

						<p className='mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary'>
							Share text your way
						</p>
						<h1 className='max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl'>
							Drop your code. Let Doggo fetch it.
						</h1>
						<p className='mt-5 max-w-2xl text-lg leading-relaxed text-base-content/70 sm:text-xl'>
							Create a feature-rich static paste or open a
							realtime editor for live collaboration without
							leaving the same focused workspace.
						</p>
						<p className='mt-3 max-w-2xl text-sm leading-relaxed text-base-content/60'>
							A focused blend of{' '}
							<Link
								href='https://pastebin.com'
								target='_blank'
								className='link link-hover'
							>
								Pastebin-style sharing
							</Link>{' '}
							and{' '}
							<Link
								href='https://codeshare.io'
								target='_blank'
								className='link link-hover'
							>
								CodeShare-style collaboration
							</Link>
							.
						</p>

						<div className='mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
							<Link
								href='/p/create'
								className='btn btn-primary min-h-12 sm:btn-wide'
							>
								<FaFileCode aria-hidden='true' />
								Create static paste
							</Link>
							<Link
								href='/r'
								className='btn btn-outline min-h-12 sm:btn-wide'
							>
								<FaBolt aria-hidden='true' />
								Open realtime editor
							</Link>
						</div>
					</div>

					<div className='relative mx-auto flex h-56 w-56 items-center justify-center rounded-full border border-primary/20 bg-base-200/60 sm:h-64 sm:w-64 lg:h-72 lg:w-72'>
						<Image
							src='/img/doggo.svg'
							alt='DoggoPaste dog mascot'
							className='h-40 w-40 sm:h-48 sm:w-48'
							width={192}
							height={192}
							priority
						/>
					</div>
				</div>
			</section>

			<section aria-labelledby='choose-mode-title'>
				<div className='mb-6 max-w-2xl'>
					<p className='mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary'>
						Choose a mode
					</p>
					<h2
						id='choose-mode-title'
						className='text-2xl font-bold sm:text-3xl'
					>
						Static when it should stay. Realtime when it should
						move.
					</h2>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<article className='flex min-w-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-6'>
						<div className='mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
							<FaFileCode
								className='h-6 w-6'
								aria-hidden='true'
							/>
						</div>
						<h3 className='text-xl font-bold'>Static paste</h3>
						<p className='mt-2 flex-1 leading-relaxed text-base-content/70'>
							Publish a stable snapshot with syntax, visibility,
							expiration, password protection, encryption, tags
							and folders.
						</p>
						<Link
							href='/p/create'
							className='btn btn-ghost mt-5 w-fit px-0 text-primary'
						>
							Create a paste <FaArrowRight aria-hidden='true' />
						</Link>
					</article>

					<article className='flex min-w-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-6'>
						<div className='mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
							<FaBolt className='h-6 w-6' aria-hidden='true' />
						</div>
						<h3 className='text-xl font-bold'>Realtime paste</h3>
						<p className='mt-2 flex-1 leading-relaxed text-base-content/70'>
							Work in the same public editor with anyone who knows
							its slug, including live content, metadata and
							presence updates.
						</p>
						<Link
							href='/r'
							className='btn btn-ghost mt-5 w-fit px-0 text-secondary'
						>
							Choose a realtime slug{' '}
							<FaArrowRight aria-hidden='true' />
						</Link>
					</article>
				</div>
			</section>

			<FeatureSection />

			<section className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]'>
				<div className='rounded-2xl border border-base-300 bg-base-100 p-6 sm:p-8'>
					<div className='flex items-start gap-4'>
						<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
							<FaInfoCircle
								className='h-5 w-5'
								aria-hidden='true'
							/>
						</div>
						<div className='min-w-0'>
							<h2 className='text-xl font-bold'>
								Learn at your own pace
							</h2>
							<p className='mt-2 text-base-content/70'>
								Use the guide for workflows, the FAQ for quick
								answers, or the API documentation for the
								current HTTP contract.
							</p>
							<div className='mt-5 flex flex-wrap gap-2'>
								<Link
									href='/guide'
									className='btn btn-sm btn-outline'
								>
									<FaInfoCircle aria-hidden='true' /> Guide
								</Link>
								<Link
									href='/faq'
									className='btn btn-sm btn-outline'
								>
									<FaQuestionCircle aria-hidden='true' /> FAQ
								</Link>
								<Link
									href='/api/docs'
									target='_blank'
									className='btn btn-sm btn-outline'
								>
									<MdMenuBook aria-hidden='true' /> API docs
								</Link>
							</div>
						</div>
					</div>
				</div>

				<div className='rounded-2xl border border-base-300 bg-base-200/40 p-6 sm:p-8'>
					<MdSchool
						className='h-8 w-8 text-primary'
						aria-hidden='true'
					/>
					<h2 className='mt-4 text-xl font-bold'>
						Open-source thesis project
					</h2>
					<p className='mt-2 text-sm leading-relaxed text-base-content/70'>
						Built at{' '}
						<Link
							href='https://pollub.pl'
							target='_blank'
							className='link link-primary'
						>
							Lublin University of Technology
						</Link>{' '}
						and available for self-hosting.
					</p>
					<div className='mt-5 flex flex-wrap gap-2'>
						<Link
							href='https://github.com/PoProstuWitold/doggopaste'
							target='_blank'
							className='btn btn-sm btn-primary'
						>
							<FaGithub aria-hidden='true' /> Source
						</Link>
						<Link
							href='https://hub.docker.com/repository/docker/poprostuwitold/doggopaste'
							target='_blank'
							className='btn btn-sm btn-outline'
						>
							Docker Hub
						</Link>
						<Link
							href='https://github.com/PoProstuWitold'
							target='_blank'
							className='btn btn-sm btn-ghost'
						>
							@PoProstuWitold
						</Link>
						<Link
							href='https://github.com/Netr0n07'
							target='_blank'
							className='btn btn-sm btn-ghost'
						>
							@Netr0n07
						</Link>
					</div>
				</div>
			</section>
		</div>
	)
}
