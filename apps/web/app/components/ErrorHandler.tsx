'use client'
interface ErrorProps {
	name?: string
	statusCode?: number
	failureReason?: string
	onRetry?: () => void
}

export const ErrorHandler: React.FC<ErrorProps> = ({
	name,
	statusCode,
	failureReason = 'Something went wrong',
	onRetry
}) => {
	return (
		<div className='flex flex-col items-center justify-center min-h-[50vh] text-center'>
			<h2 className='text-3xl font-bold text-error'>
				Error - {statusCode || 500} {name || 'Internal Server Error'}
			</h2>
			<p className='mt-2 text-lg text-base-content'>{failureReason}</p>
			<div className='mt-4'>
				{onRetry && (
					<button
						onClick={onRetry}
						className='btn btn-error btn-outline'
						type='button'
					>
						Retry
					</button>
				)}
				{!onRetry && (
					<button
						onClick={() => window.location.reload()}
						className='btn btn-error btn-outline'
						type='button'
					>
						Reload page
					</button>
				)}
			</div>
		</div>
	)
}
