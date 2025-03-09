'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function NotFound() {
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
		<>
			<div className='flex flex-col items-center justify-center my-10 text-center'>
				<h1 className='text-4xl font-bold text-error'>404</h1>
				<p className='text-xl text-base-content'>
					Page "{pathname}" not found
				</p>
				<button
					onClick={() => goBack()}
					className='mt-6 btn btn-error'
					type='button'
				>
					Go back
				</button>
			</div>
		</>
	)
}
