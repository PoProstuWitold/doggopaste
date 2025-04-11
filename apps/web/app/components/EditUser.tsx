'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { EditUserData } from '../types'
import { createDynamicAuthClient } from '../utils/auth-client'
import { wait } from '../utils/functions'

export const EditUser: React.FC = () => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<EditUserData>()

	const onSubmit = async (formData: EditUserData) => {
		console.info('Edit user data:', formData)
		const { name } = formData
		const { data, error } = await authClient.updateUser(
			{
				name
			},
			{
				onRequest: (ctx) => {
					//show loading
					console.info('loading', ctx)
					toast.loading('Loading...', {
						duration: 1000
					})
				},
				onSuccess: async (ctx) => {
					//redirect to the dashboard
					console.info('success', ctx)
					toast.success('Updated user data')
					await wait(500)
					router.replace('/profile')
					router.refresh()
				},
				onError: (ctx) => {
					console.info('error', ctx)
					toast.error(ctx.error.message)
				}
			}
		)
		console.info('data', data)
		console.info('error', error)
	}

	return (
		<>
			{/* Form */}
			<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
				<div>
					<label htmlFor='name' className='block text-sm font-medium'>
						Name
					</label>
					<input
						type='text'
						id='name'
						{...register('name', { required: true })}
						className='w-full input input-bordered'
						placeholder='Your Name'
					/>
					{errors.name && (
						<p className='text-sm text-error'>Name is required</p>
					)}
				</div>

				{/* Submit Button */}
				<button type='submit' className='w-full py-2 btn btn-accent'>
					Submit
				</button>
			</form>
		</>
	)
}
