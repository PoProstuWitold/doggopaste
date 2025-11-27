import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaInfoCircle, FaQuestionCircle } from 'react-icons/fa'
import { MdLightbulb, MdMenuBook, MdSchool } from 'react-icons/md'
import { FeatureSection } from './components/custom/FeatureSection'
import { createDynamicAuthClient } from './utils/auth-client'

export const metadata: Metadata = {
	title: 'DoggoPaste',
	description:
		'Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable.'
}

export default async function HomePage() {
	const authClient = createDynamicAuthClient()
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})

	return (
		<>
			{/* Session tracker */}
			<div className='relative'>
				<div className='absolute top-0 right-0 text-sm text-base-content/70'>
					{session.data?.user ? (
						<span className='badge badge-success'>
							Logged in as {session.data.user.name}
						</span>
					) : (
						<span className='badge badge-warning'>
							Not logged in
						</span>
					)}
				</div>
			</div>
			<main className='relative flex flex-col items-center justify-center py-10 gap-8 max-w-6xl mx-auto'>
				{/* Header logo */}
				<div className='flex flex-col items-center gap-4 text-center'>
					<div className='flex flex-col md:flex-row items-center gap-4'>
						<Image
							src='/img/doggo.svg'
							alt='Doggo'
							className='w-32 h-32 md:w-40 md:h-40'
							width={160}
							height={160}
							priority
						/>
						<h1 className='text-5xl md:text-6xl font-extrabold tracking-tight'>
							DoggoPaste
						</h1>
					</div>
					<p className='text-2xl'>
						Drop your code, let Doggo fetch it! Combination of a{' '}
						<Link
							href='https://pastebin.com'
							target='_blank'
							className='link link-primary'
						>
							Pastebin
						</Link>{' '}
						and{' '}
						<Link
							href='https://codeshare.io'
							target='_blank'
							className='link link-primary'
						>
							CodeShare
						</Link>
						.{' '}
						<Link
							href='https://github.com/PoProstuWitold/doggopaste'
							target='_blank'
							className='link link-primary'
						>
							Free
						</Link>{' '}
						and{' '}
						<Link
							href='https://hub.docker.com/repository/docker/poprostuwitold/doggopaste'
							target='_blank'
							className='link link-primary'
						>
							selfhostable
						</Link>
						.
					</p>
				</div>
				<section className='w-full px-4'>
					<h2 className='text-3xl font-bold text-center mb-6 divider'>
						Explore & Learn
					</h2>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto'>
						{/* CARD 1 */}
						<div className='bg-base-200 rounded-box p-6 shadow-xl flex flex-col md:flex-row items-center md:items-center gap-6 h-full'>
							<div className='flex-shrink-0 md:self-center'>
								<MdLightbulb className='text-5xl text-primary' />
							</div>
							<div className='flex flex-col gap-2 text-center md:text-left'>
								<h3 className='text-2xl font-bold'>
									Explore DoggoPaste
								</h3>
								<p className='text-base max-w-prose'>
									Learn how to use DoggoPaste, selfhost it,
									check guide how to use it or Frequently
									Asked Questions.
								</p>
								<div className='flex flex-col sm:flex-row justify-center md:justify-start gap-2 mt-3'>
									<Link
										href='/api/docs'
										target='_blank'
										className='btn btn-accent btn-sm flex items-center gap-2'
									>
										<MdMenuBook className='text-lg' />
										Docs
									</Link>
									<Link
										href='/guide'
										className='btn btn-outline btn-sm flex items-center gap-2'
									>
										<FaInfoCircle className='text-lg' />
										Guide
									</Link>
									<Link
										href='/faq'
										className='btn btn-outline btn-sm flex items-center gap-2'
									>
										<FaQuestionCircle className='text-lg' />
										FAQ
									</Link>
								</div>
							</div>
						</div>

						{/* CARD 2 */}
						<div className='bg-base-200 rounded-box p-6 shadow-xl flex flex-col md:flex-row items-center md:items-center gap-6 h-full'>
							<div className='flex-shrink-0 md:self-center'>
								<MdSchool className='text-5xl text-[#bb1e29]' />
							</div>
							<div className='flex flex-col gap-2 text-center md:text-left'>
								<h3 className='text-2xl font-bold'>
									Engineering Thesis Project
								</h3>
								<p className='text-base max-w-prose'>
									DoggoPaste is an engineering thesis
									developed at{' '}
									<Link
										href='https://pollub.pl'
										target='_blank'
										className='font-semibold text-[#bb1e29] hover:underline'
									>
										Lublin University of Technology
										(Politechnika Lubelska)
									</Link>{' '}
									as part of our bachelor&apos;s degree.
								</p>
								<div className='flex flex-col sm:flex-row justify-center md:justify-start gap-2 mt-3'>
									<Link
										href='https://github.com/PoProstuWitold'
										target='_blank'
										className='btn btn-outline btn-sm flex items-center gap-2'
									>
										<FaGithub className='text-lg' />
										@PoProstuWitold
									</Link>
									<Link
										href='https://github.com/Netr0n07'
										target='_blank'
										className='btn btn-outline btn-sm flex items-center gap-2'
									>
										<FaGithub className='text-lg' />
										@Netr0n07
									</Link>
								</div>
							</div>
						</div>
					</div>
				</section>
				<FeatureSection />
			</main>
		</>
	)
}
