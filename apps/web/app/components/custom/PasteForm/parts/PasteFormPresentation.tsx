'use client'

import { type FormEventHandler, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
import { FaChevronLeft, FaChevronRight, FaSlidersH } from 'react-icons/fa'
import type { Paste, PasteForm as PasteFormValues } from '@/app/types'
import type { PasteFormMode, PasteSourceType } from '../paste-form-config'
import { ContentEditor } from './ContentEditor'
import { DescriptionField } from './DescriptionField'
import { ForkInfo } from './ForkInfo'
import { Header } from './Header'
import { LeftColumn } from './LeftColumn'
import { SensitiveWarningDialog } from './SensitiveWarningDialog'
import { UnlockDialog } from './UnlockDialog'

type SubmitPaste = (data: PasteFormValues) => void | Promise<void>

interface PasteFormPresentationProps {
	acceptSensitiveContent: (submit: SubmitPaste) => void
	checkSensitiveContent: (data: PasteFormValues, submit: SubmitPaste) => void
	hasServerLock: boolean
	isAuthenticated: boolean
	isLocked: boolean
	isSubmitting: boolean
	isUnlocking: boolean
	matchedLines: Array<{ word: string; lines: number[] }>
	methods: UseFormReturn<PasteFormValues>
	mode: PasteFormMode
	onCancelUnlock: () => void
	onSubmit: SubmitPaste
	onUnlock: FormEventHandler<HTMLFormElement>
	paste?: Paste
	setShowWarning: (show: boolean) => void
	setUnlockPassword: (password: string) => void
	showWarning: boolean
	slug?: string
	type?: PasteSourceType
	unlockPassword: string
}

function getSubmitLabel(mode: PasteFormMode, isSubmitting: boolean): string {
	if (mode === 'fork') return isSubmitting ? 'Forking...' : 'Create Fork'
	if (mode === 'edit') return isSubmitting ? 'Saving...' : 'Save Changes'
	return isSubmitting ? 'Creating...' : 'Submit'
}

export function PasteFormPresentation({
	acceptSensitiveContent,
	checkSensitiveContent,
	hasServerLock,
	isAuthenticated,
	isLocked,
	isSubmitting,
	isUnlocking,
	matchedLines,
	methods,
	mode,
	onCancelUnlock,
	onSubmit,
	onUnlock,
	paste,
	setShowWarning,
	setUnlockPassword,
	showWarning,
	slug,
	type,
	unlockPassword
}: PasteFormPresentationProps) {
	const [optionsOpen, setOptionsOpen] = useState(true)
	const optionsCanCollapse = mode === 'create'
	const lockedClasses = isLocked
		? 'opacity-20 pointer-events-none blur-sm'
		: 'opacity-100'

	return (
		<FormProvider {...methods}>
			<UnlockDialog
				hasServerLock={hasServerLock}
				isLocked={isLocked}
				isUnlocking={isUnlocking}
				mode={mode}
				onCancel={onCancelUnlock}
				onPasswordChange={setUnlockPassword}
				onSubmit={onUnlock}
				unlockPassword={unlockPassword}
			/>

			<form
				onSubmit={methods.handleSubmit((data) =>
					checkSensitiveContent(data, onSubmit)
				)}
				className={
					optionsCanCollapse
						? `mx-auto flex w-full max-w-[100rem] min-w-0 flex-col gap-5 rounded-2xl border border-base-300 bg-base-100 p-4 transition-opacity duration-300 sm:p-6 ${lockedClasses}`
						: `mx-auto flex max-w-8xl flex-col gap-4 rounded-lg bg-base-200 p-5 transition-opacity duration-300 ${lockedClasses}`
				}
			>
				<Header
					mode={mode}
					type={type}
					slug={slug}
					pasteSlug={paste?.slug}
				/>

				{mode === 'fork' && paste && (
					<ForkInfo
						type={type}
						slug={paste.slug}
						title={paste.title}
					/>
				)}

				<DescriptionField />

				{optionsCanCollapse && (
					<div className='flex justify-end'>
						<button
							type='button'
							className='btn btn-sm btn-outline min-h-11 gap-2'
							onClick={() => setOptionsOpen((open) => !open)}
							aria-expanded={optionsOpen}
							aria-controls='paste-options-panel'
						>
							<FaSlidersH aria-hidden='true' />
							{optionsOpen ? 'Hide options' : 'Show options'}
							{optionsOpen ? (
								<FaChevronLeft
									className='hidden lg:block'
									aria-hidden='true'
								/>
							) : (
								<FaChevronRight
									className='hidden lg:block'
									aria-hidden='true'
								/>
							)}
						</button>
					</div>
				)}

				{optionsCanCollapse ? (
					<div
						className={`grid min-w-0 gap-5 transition-[grid-template-columns] duration-200 ${optionsOpen ? 'lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}
					>
						<div
							id='paste-options-panel'
							className={`${optionsOpen ? 'block' : 'hidden'} min-w-0 rounded-2xl border border-base-300 bg-base-200/35 p-4`}
						>
							<LeftColumn
								mode={mode}
								isAuthenticated={isAuthenticated}
							/>
						</div>

						<div className='flex w-full min-w-0 flex-col gap-4'>
							<ContentEditor enableMarkdownPreview />
							<button
								type='submit'
								className='btn btn-primary w-full'
								disabled={isSubmitting || isLocked}
							>
								{getSubmitLabel(mode, isSubmitting)}
							</button>
						</div>
					</div>
				) : (
					<div className='flex flex-col gap-4 lg:flex-row'>
						<div className='w-full lg:w-1/5'>
							<LeftColumn
								mode={mode}
								isAuthenticated={isAuthenticated}
							/>
						</div>

						<div className='divider lg:divider-horizontal' />

						<div className='flex w-full min-w-0 flex-col gap-4 lg:w-4/5'>
							<ContentEditor />
							<button
								type='submit'
								className='btn btn-primary w-full'
								disabled={isSubmitting || isLocked}
							>
								{getSubmitLabel(mode, isSubmitting)}
							</button>
						</div>
					</div>
				)}
			</form>

			<SensitiveWarningDialog
				isOpen={showWarning}
				onCancel={() => setShowWarning(false)}
				onAccept={() => acceptSensitiveContent(onSubmit)}
				matchedLines={matchedLines}
			/>
		</FormProvider>
	)
}
