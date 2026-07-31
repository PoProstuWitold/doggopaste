'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { EditUserData } from '../../types'
import { createDynamicAuthClient } from '../../utils/auth-client'
import { wait } from '../../utils/functions'

export const EditUser: React.FC = () => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<EditUserData>()

	const onSubmit = async (formData: EditUserData) => {
		const { name } = formData
		await authClient.updateUser(
			{
				name
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
					toast.error(
						ctx.error.message ||
							'User with this name already exists'
					)
				}
			}
		)
	}

	return (
		<>
			{/* Form */}
			<form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
				<div className='space-y-2'>
					<label htmlFor='name' className='block text-sm font-medium'>
						Name
					</label>
					<input
						type='text'
						id='name'
						{...register('name', { required: true })}
						className='input input-bordered w-full'
						placeholder='Your Name'
						aria-invalid={Boolean(errors.name)}
						aria-describedby={
							errors.name ? 'name-error' : undefined
						}
					/>
					{errors.name && (
						<p id='name-error' className='text-sm text-error'>
							Name is required
						</p>
					)}
				</div>

				{/* Submit Button */}
				<button type='submit' className='btn btn-accent w-full'>
					Submit
				</button>
			</form>
		</>
	)
}
