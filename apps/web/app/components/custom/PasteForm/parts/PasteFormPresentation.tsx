'use client'

import type { FormEventHandler } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
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
				className={`flex flex-col gap-4 p-5 rounded-lg bg-base-200 mx-auto max-w-8xl transition-opacity duration-300 ${isLocked ? 'opacity-20 pointer-events-none blur-sm' : 'opacity-100'}`}
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

				<div className='flex flex-col lg:flex-row gap-4'>
					<LeftColumn mode={mode} isAuthenticated={isAuthenticated} />

					<div className='divider lg:divider-horizontal' />

					<div className='w-full lg:w-4/5 flex flex-col gap-4 min-w-0'>
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
