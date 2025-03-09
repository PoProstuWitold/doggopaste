'use client'
import { authClient } from '@/app/utils/auth-client'
import { useState } from 'react'

export default function Auth() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')

	const signIn = async () => {
		const { data, error } = await authClient.signIn.email({
			email,
			password
		})
		console.log('data', data)
		console.log('error', error)
	}
	const signOut = async () => {
		const { data, error } = await authClient.signOut()
		console.log('data', data)
		console.log('error', error)
	}
	const signUp = async () => {
		const { data, error } = await authClient.signUp.email(
			{
				email,
				password,
				name
			},
			{
				onRequest: (ctx) => {
					//show loading
				},
				onSuccess: (ctx) => {
					//redirect to the dashboard
				},
				onError: (ctx) => {
					alert(ctx.error.message)
				}
			}
		)
		console.log('data', data)
		console.log('error', error)
	}
	const session = async () => {
		const { data, error } = await authClient.getSession()
		console.log('data', data)
		console.log('error', error)
	}
	const sessions = async () => {
		const { data, error } = await authClient.listSessions()
		console.log('data', data)
		console.log('error', error)
	}

	return (
		<div className='flex flex-col items-center justify-center'>
			<div className='w-full max-w-md p-6 bg-base-200 rounded-lg shadow-lg'>
				<h2 className='text-2xl font-bold text-center mb-6'>
					Auth Test Form
				</h2>
				<div className='space-y-4'>
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
							value={name}
							onChange={(e) => setName(e.target.value)}
							className='w-full input input-bordered'
							placeholder='Enter your name'
						/>
					</div>
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
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='w-full input input-bordered'
							placeholder='Enter your email'
						/>
					</div>
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
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className='w-full input input-bordered'
							placeholder='Enter your password'
						/>
					</div>
					<div className='space-y-2'>
						<button
							onClick={signIn}
							type='submit'
							className='w-full btn btn-primary'
						>
							Sign In
						</button>
						<button
							onClick={signUp}
							type='submit'
							className='w-full btn btn-primary'
						>
							Sign Up
						</button>
						<button
							onClick={signOut}
							type='submit'
							className='w-full btn btn-error'
						>
							Sign Out
						</button>
						<button
							onClick={session}
							type='button'
							className='w-full btn btn-secondary'
						>
							Session
						</button>
						<button
							onClick={sessions}
							type='button'
							className='w-full btn btn-accent'
						>
							Sessions
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
