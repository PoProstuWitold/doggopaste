'use client'

import type { Extension } from '@codemirror/state'
import CodeMirror from '@uiw/react-codemirror'
import type { ComponentProps } from 'react'
import { BsShieldLock } from 'react-icons/bs'
import { FaUnlock } from 'react-icons/fa'
import { MdEnhancedEncryption } from 'react-icons/md'
import { useTheme } from '../../../context/ThemeContext'
import type { Paste } from '../../../types'
import { useEditorLanguage } from '../../../utils/use-editor-language'
import { MarkdownPreview } from '../MarkdownPreview'

export function PasteContent({
	content,
	handleUnlock,
	isProcessing,
	isServerLocked,
	passwordInput,
	paste,
	setPasswordInput,
	showLockScreen
}: {
	content: string
	handleUnlock: (event?: React.FormEvent) => Promise<void>
	isProcessing: boolean
	isServerLocked: boolean
	passwordInput: string
	paste: Paste
	setPasswordInput: (password: string) => void
	showLockScreen: boolean
}) {
	const { cmTheme } = useTheme()
	const syntaxExtension = useEditorLanguage(
		showLockScreen ? 'Plaintext' : paste.syntax.name
	)
	const isMarkdown = paste.syntax.name === 'Markdown'

	return (
		<div className='flex flex-col lg:flex-row gap-4'>
			<div className='w-full flex flex-col gap-4 min-w-0'>
				<div className='form-control w-full flex-1 min-w-0 relative'>
					<div className='label'>
						<span className='label-text'>Content</span>
					</div>
					{showLockScreen ? (
						<div className='h-100 bg-base-300 rounded-lg flex flex-col items-center justify-center gap-4 border-2 border-base-content/10'>
							{isServerLocked ? (
								<BsShieldLock className='w-16 h-16 text-warning' />
							) : (
								<MdEnhancedEncryption className='w-16 h-16 text-primary' />
							)}

							<div className='text-center'>
								<h3 className='text-xl font-bold'>
									{isServerLocked
										? 'Server Password Protected'
										: 'Client Encrypted Content'}
								</h3>
								<p
									id='paste-unlock-description'
									className='text-sm opacity-70'
								>
									{isServerLocked
										? 'This paste is protected by a server-side password.'
										: 'This paste is encrypted locally.'}
								</p>
							</div>

							<form
								onSubmit={handleUnlock}
								className='flex gap-2 items-center mt-2'
							>
								<label
									htmlFor='paste-unlock-password'
									className='sr-only'
								>
									Password
								</label>
								<input
									id='paste-unlock-password'
									type='password'
									autoComplete='current-password'
									aria-describedby='paste-unlock-description'
									placeholder={
										isServerLocked
											? 'Enter server password...'
											: 'Enter decryption password...'
									}
									className='input input-bordered w-full max-w-lg'
									value={passwordInput}
									onChange={(event) =>
										setPasswordInput(event.target.value)
									}
								/>
								<button
									type='submit'
									className={`btn ${isServerLocked ? 'btn-warning' : 'btn-primary'}`}
									disabled={!passwordInput || isProcessing}
								>
									{isProcessing ? (
										<span className='loading loading-spinner loading-xs'></span>
									) : (
										<>
											Unlock <FaUnlock />
										</>
									)}
								</button>
							</form>
						</div>
					) : (
						<div className='min-w-0 flex flex-col gap-3'>
							{isMarkdown ? (
								<MarkdownPreview markdown={content}>
									<ReadOnlyCodeMirror
										content={content}
										syntaxExtension={syntaxExtension}
										theme={cmTheme}
									/>
								</MarkdownPreview>
							) : (
								<div className='rounded-lg bg-base-300/80 overflow-auto max-h-162.5'>
									<ReadOnlyCodeMirror
										content={content}
										syntaxExtension={syntaxExtension}
										theme={cmTheme}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function ReadOnlyCodeMirror({
	content,
	syntaxExtension,
	theme
}: {
	content: string
	syntaxExtension: Extension
	theme: ComponentProps<typeof CodeMirror>['theme']
}) {
	return (
		<CodeMirror
			value={content}
			extensions={[syntaxExtension]}
			readOnly={true}
			onChange={() => {}}
			basicSetup={{
				lineNumbers: true,
				highlightActiveLine: true,
				highlightActiveLineGutter: true,
				foldGutter: true,
				tabSize: 4,
				history: false,
				syntaxHighlighting: true
			}}
			className='min-h-75'
			theme={theme}
		/>
	)
}
