'use client'
import { usePathname, useRouter } from 'next/navigation'
import { FiArrowLeft, FiHome, FiSearch } from 'react-icons/fi'

export const NotFoundClient = () => {
	const router = useRouter()
	const pathname = usePathname()

	const goBack = () => {
		if (window.history.length > 1) {
			router.back()
		} else {
			router.push('/')
		}
	}

	return (
		<main className='min-h-[70vh] flex items-center justify-center px-6'>
			<div className='hero bg-base-100'>
				<div className='hero-content text-center'>
					<div className='max-w-xl'>
						<h1 className='text-4xl md:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-2'>
							<FiSearch
								className='w-10 h-10 font-bold'
								aria-hidden
							/>
							404 Not Found
						</h1>

						<p className='mt-3 text-base md:text-lg text-base-content/80'>
							It looks like the page you're after is missing or
							the link is outdated.
						</p>
						<p className='mt-1 text-sm text-base-content/70'>
							Please check the URL or return to the homepage.
						</p>
						<div className='mt-6'>
							<div className='mx-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200 border border-base-300'>
								<span className='text-xs opacity-70'>
									Requested path
								</span>
								<code className='text-sm font-semibold'>
									"{pathname}"
								</code>
							</div>
						</div>
						<div className='mt-6 flex flex-col sm:flex-row gap-3 justify-center'>
							<button
								type='button'
								onClick={goBack}
								className='btn btn-error'
							>
								<FiArrowLeft className='w-5 h-5' aria-hidden />
								Go back
							</button>
							<button
								type='button'
								onClick={() => router.push('/')}
								className='btn btn-primary btn-outline'
							>
								<FiHome className='w-5 h-5' aria-hidden />
								Home page
							</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
