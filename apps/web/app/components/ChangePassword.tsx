'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { ChangePasswordData } from '../types'
import { createDynamicAuthClient } from '../utils/auth-client'
import { wait } from '../utils/functions'

export const ChangePassword: React.FC = () => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<ChangePasswordData>()

	const onSubmit = async (formData: ChangePasswordData) => {
		console.info('Change password data:', formData)
		const { currentPassword, newPassword, revokeOtherSessions } = formData
		const { data, error } = await authClient.changePassword(
			{
				currentPassword,
				newPassword,
				revokeOtherSessions
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
					<label
						htmlFor='currentPassword'
						className='block text-sm font-medium'
					>
						Current Password
					</label>
					<input
						type='password'
						id='currentPassword'
						{...register('currentPassword', { required: true })}
						className='w-full input input-bordered'
						placeholder='Your Current Password'
					/>
					{errors.currentPassword && (
						<p className='text-sm text-error'>
							{errors.currentPassword.message}
						</p>
					)}
				</div>
				<div>
					<label
						htmlFor='newPassword'
						className='block text-sm font-medium'
					>
						New Password
					</label>
					<input
						type='password'
						id='newPassword'
						{...register('newPassword', { required: true })}
						className='w-full input input-bordered'
						placeholder='Your New Password'
					/>
					{errors.newPassword && (
						<p className='text-sm text-error'>
							{errors.newPassword.message}
						</p>
					)}
				</div>
				<div>
					<label className='flex items-center space-x-2'>
						<input
							type='checkbox'
							id='revokeOtherSessions'
							{...register('revokeOtherSessions')}
							className='checkbox'
						/>
						<span className='text-sm'>Revoke Other Sessions</span>
					</label>
				</div>

				{/* Submit Button */}
				<button type='submit' className='w-full py-2 btn btn-accent'>
					Submit
				</button>
			</form>
		</>
	)
}
