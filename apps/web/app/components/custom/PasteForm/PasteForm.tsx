'use client'

import { useRouter } from 'next/navigation'
import { useSensitiveContentChecker } from '@/app/utils/useSensitiveContentChecker'
import { usePasteFormState } from './hooks/usePasteFormState'
import { usePasteSubmission } from './hooks/usePasteSubmission'
import { usePasteUnlock } from './hooks/usePasteUnlock'
import { PasteFormPresentation } from './parts/PasteFormPresentation'
import type { PasteFormProps } from './paste-form-config'

export function PasteForm(props: PasteFormProps) {
	const { isAuthenticated, mode, paste, slug, type } = props
	const router = useRouter()
	const form = usePasteFormState({ mode, paste, type })
	const submission = usePasteSubmission({
		methods: form.methods,
		mode,
		slug
	})
	const unlock = usePasteUnlock({
		hasClientLock: form.hasClientLock,
		hasServerLock: form.hasServerLock,
		onUnlocked: () => form.setIsLocked(false),
		paste,
		setValue: form.methods.setValue,
		slug
	})
	const sensitiveContent =
		useSensitiveContentChecker<Parameters<typeof submission.submit>[0]>()

	return (
		<PasteFormPresentation
			acceptSensitiveContent={sensitiveContent.acceptAndSubmit}
			checkSensitiveContent={sensitiveContent.checkAndSubmit}
			hasServerLock={form.hasServerLock}
			isAuthenticated={isAuthenticated}
			isLocked={form.isLocked}
			isSubmitting={submission.isSubmitting}
			isUnlocking={unlock.isUnlocking}
			matchedLines={sensitiveContent.matchedLines}
			methods={form.methods}
			mode={mode}
			onCancelUnlock={() => router.back()}
			onSubmit={submission.submit}
			onUnlock={unlock.handleUnlock}
			paste={paste}
			setShowWarning={sensitiveContent.setShowWarning}
			setUnlockPassword={unlock.setUnlockPassword}
			showWarning={sensitiveContent.showWarning}
			slug={slug}
			type={type}
			unlockPassword={unlock.unlockPassword}
		/>
	)
}
