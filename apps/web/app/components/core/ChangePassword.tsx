'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { ChangePasswordData } from '@/app/types'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'

export const ChangePassword: React.FC = () => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<ChangePasswordData>()

	const onSubmit = async (formData: ChangePasswordData) => {
		const { currentPassword, newPassword, revokeOtherSessions } = formData
		await authClient.changePassword(
			{
				currentPassword,
				newPassword,
				revokeOtherSessions
			},
			{
				onSuccess: async () => {
					//redirect to the dashboard
					toast.success('Updated user data')
					await wait(500)
					router.replace('/profile')
					router.refresh()
				},
				onError: (ctx) => {
					toast.error(ctx.error.message)
				}
			}
		)
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
