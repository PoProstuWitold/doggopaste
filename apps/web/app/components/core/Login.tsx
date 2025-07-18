'use client'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaFacebook, FaGithub, FaGoogle } from 'react-icons/fa'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import type { SignInData, SignUpData } from '../../types'

export const Login: React.FC = () => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const [isSignUp, setIsSignUp] = useState(false)

	// Define form types dynamically
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch
	} = useForm<SignInData & SignUpData>()

	const onSubmit = async (formData: SignInData & SignUpData) => {
		if (isSignUp) {
			// sign up logic
			console.info('Sign Up Data:', formData)
			const { email, password, name } = formData
			const { data, error } = await authClient.signUp.email(
				{
					email,
					password,
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
						toast.success(
							`Signed up successfully as ${ctx.data.user.name}. Redirecting...`
						)
						await wait(500)
						router.replace('/')
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
		} else {
			// sign in logic
			console.info('Sign In Data:', formData)
			const { email, password, rememberMe } = formData
			const { data, error } = await authClient.signIn.email(
				{
					email,
					password,
					rememberMe
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
						toast.success(
							`Signed in successfully as ${ctx.data.user.name}. Redirecting...`
						)
						await wait(500)
						router.replace('/')
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
	}

	const toggleForm = (signUp: boolean) => {
		setIsSignUp(signUp)
		reset() // Reset form when switching
	}

	// Social Login
	const socialLogin = async (provider: 'google' | 'github' | 'facebook') => {
		const { data, error } = await authClient.signIn.social({
			provider,
			callbackURL: '/api/redirect'
		})

		console.info(data, error)
		if (data) {
			toast.success(
				`Signed in successfully with ${provider}. Redirecting...`
			)
			await wait(500)
			router.replace('/')
			router.refresh()
		}

		if (error) {
			toast.error(error.message as string)
		}
	}

	return (
		<div className='flex flex-col items-center justify-center'>
			<div className='w-full max-w-md p-6 md:rounded-lg md:shadow-md md:bg-base-200'>
				{/* Tab Indicators */}
				<div className='flex justify-center mb-6'>
					<button
						type='button'
						onClick={() => toggleForm(false)}
						className={`px-4 py-2 w-1/2 text-center font-bold ${
							!isSignUp
								? 'border-b-2 border-primary text-primary'
								: 'border-b-2 border-transparent'
						}`}
					>
						Sign In
					</button>
					<button
						type='button'
						onClick={() => toggleForm(true)}
						className={`px-4 py-2 w-1/2 text-center font-bold ${
							isSignUp
								? 'border-b-2 border-primary text-primary'
								: 'border-b-2 border-transparent'
						}`}
					>
						Sign Up
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					{/* Name (only for Sign Up) */}
					{isSignUp && (
						<div>
							<label
								htmlFor='name'
								className='block text-sm font-medium'
							>
								Name
							</label>
							<input
								type='text'
								id='name'
								{...register('name', { required: isSignUp })}
								className='w-full input input-bordered'
								placeholder='Your Name'
							/>
							{errors.name && (
								<p className='text-sm text-error'>
									Name is required
								</p>
							)}
						</div>
					)}

					{/* Email */}
					<div>
						<label
							htmlFor='email'
							className='block text-sm font-medium'
						>
							Email
						</label>
						<input
							type='email'
							id='email'
							{...register('email', { required: true })}
							className='w-full input input-bordered'
							placeholder='Email Address'
						/>
						{errors.email && (
							<p className='text-sm text-error'>
								Email is required
							</p>
						)}
					</div>

					{/* Password */}
					<div>
						<label
							htmlFor='password'
							className='block text-sm font-medium'
						>
							Password
						</label>
						<input
							type='password'
							id='password'
							{...register('password', {
								required: true,
								minLength: 6
							})}
							className='w-full input input-bordered'
							placeholder='Password'
						/>
						{errors.password && (
							<p className='text-sm text-error'>
								Password must be at least 6 characters long
							</p>
						)}
					</div>

					{/* Confirm Password (only for Sign Up) */}
					{isSignUp && (
						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium'
							>
								Confirm Password
							</label>
							<input
								type='password'
								id='confirmPassword'
								{...register('confirmPassword', {
									required: isSignUp,
									validate: (value) =>
										value === watch('password') ||
										'Passwords do not match'
								})}
								className='w-full input input-bordered'
								placeholder='Confirm Password'
							/>
							{errors.confirmPassword && (
								<p className='text-sm text-error'>
									{errors.confirmPassword.message}
								</p>
							)}
						</div>
					)}

					{/* Remember Me and Forgot Password (only for Sign In) */}
					{!isSignUp && (
						<div className='flex items-center justify-between'>
							<label className='flex items-center space-x-2'>
								<input
									type='checkbox'
									{...register('rememberMe')}
									className='checkbox'
								/>
								<span className='text-sm'>Remember me</span>
							</label>
							<button
								type='button'
								className='text-sm text-secondary hover:underline'
							>
								Forgot password?
							</button>
						</div>
					)}

					{/* Submit Button */}
					<button
						type='submit'
						className='w-full py-2 btn btn-accent'
					>
						Submit
					</button>

					{/* Social Buttons */}
					<div className='flex flex-col space-y-2'>
						<button
							type='button'
							className='btn btn-outline flex items-center justify-center'
							onClick={() => socialLogin('google')}
						>
							<FaGoogle className='w-5 h-5' />
							<span>Continue with Google</span>
						</button>
						<button
							type='button'
							className='btn btn-outline flex items-center justify-center space-x-2'
							onClick={() => socialLogin('github')}
						>
							<FaGithub className='w-5 h-5' />
							<span>Continue with GitHub</span>
						</button>
						<button
							type='button'
							className='btn btn-outline flex items-center justify-center space-x-2'
							onClick={() => socialLogin('facebook')}
						>
							<FaFacebook className='w-5 h-5' />
							<span>Continue with Facebook</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
