interface LoadingProps {
	failureCount?: number
}

export const Loading: React.FC<LoadingProps> = ({ failureCount }) => {
	return (
		<>
			<div className='flex items-center justify-center min-h-[50vh]'>
				<div className='flex flex-col items-center'>
					<div className='w-12 h-12 border-4 border-primary border-dashed rounded-full animate-spin' />
					<p className='mt-2 text-primary text-xl font-semibold'>
						Loading...
					</p>
					{failureCount && failureCount > 0 ? (
						<p className='text-primary text-md font-semibold'>
							Try {failureCount} of 3
						</p>
					) : null}
				</div>
			</div>
		</>
	)
}
