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
			<form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
				<div className='space-y-2'>
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
						className='input input-bordered w-full'
						placeholder='Your Current Password'
						aria-invalid={Boolean(errors.currentPassword)}
						aria-describedby={
							errors.currentPassword
								? 'current-password-error'
								: undefined
						}
					/>
					{errors.currentPassword && (
						<p
							id='current-password-error'
							className='text-sm text-error'
						>
							{errors.currentPassword.message}
						</p>
					)}
				</div>
				<div className='space-y-2'>
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
						className='input input-bordered w-full'
						placeholder='Your New Password'
						aria-invalid={Boolean(errors.newPassword)}
						aria-describedby={
							errors.newPassword
								? 'new-password-error'
								: undefined
						}
					/>
					{errors.newPassword && (
						<p
							id='new-password-error'
							className='text-sm text-error'
						>
							{errors.newPassword.message}
						</p>
					)}
				</div>
				<div>
					<label className='flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-base-200/40 p-3'>
						<input
							type='checkbox'
							id='revokeOtherSessions'
							{...register('revokeOtherSessions')}
							className='checkbox checkbox-sm'
						/>
						<span className='text-sm'>Revoke Other Sessions</span>
					</label>
				</div>

				{/* Submit Button */}
				<button type='submit' className='btn btn-accent w-full'>
					Submit
				</button>
			</form>
		</>
	)
}
