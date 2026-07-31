'use client'

import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FaCode, FaColumns, FaEye } from 'react-icons/fa'
import { createSafeMarkdownHtml } from '@/app/components/custom/MarkdownPreview'
import { useTheme } from '@/app/context/ThemeContext'
import type { PasteForm as PasteFormType } from '@/app/types'
import { useEditorLanguage } from '@/app/utils/use-editor-language'

type EditorMode = 'code' | 'split' | 'preview'

interface ContentEditorProps {
	enableMarkdownPreview?: boolean
}

const EDITOR_BASIC_SETUP = {
	lineNumbers: true,
	highlightActiveLine: true,
	highlightActiveLineGutter: true,
	foldGutter: true,
	tabSize: 4,
	history: true,
	syntaxHighlighting: true
}

function MarkdownPreviewPanel({
	content,
	className
}: {
	content: string
	className: string
}) {
	const [previewContent, setPreviewContent] = useState(content)

	useEffect(() => {
		const timeout = window.setTimeout(() => setPreviewContent(content), 150)
		return () => window.clearTimeout(timeout)
	}, [content])

	const renderedMarkdownHtml = useMemo(
		() => createSafeMarkdownHtml(previewContent),
		[previewContent]
	)

	return (
		<section className={className} aria-label='Rendered Markdown preview'>
			<div
				className='markdown-preview min-w-0'
				// biome-ignore lint/security/noDangerouslySetInnerHtml: createSafeMarkdownHtml sanitizes with DOMPurify
				dangerouslySetInnerHTML={{ __html: renderedMarkdownHtml }}
			/>
		</section>
	)
}

export function ContentEditor({
	enableMarkdownPreview = false
}: ContentEditorProps) {
	const { control } = useFormContext<PasteFormType>()
	const { cmTheme } = useTheme()
	const [mode, setMode] = useState<EditorMode>('code')
	const syntax = useWatch<PasteFormType>({ name: 'syntax' })
	const syntaxName = typeof syntax === 'string' ? syntax : 'Plaintext'
	const syntaxExtension = useEditorLanguage(syntaxName)
	const editorExtensions = useMemo(() => [syntaxExtension], [syntaxExtension])
	const isMarkdown = enableMarkdownPreview && syntaxName === 'Markdown'
	const showEditor = !isMarkdown || mode === 'code' || mode === 'split'
	const showPreview = isMarkdown && (mode === 'preview' || mode === 'split')

	return (
		<div className='form-control w-full min-w-0 flex-1'>
			<Controller
				name='content'
				control={control}
				rules={{ required: 'Content is required' }}
				render={({ field, fieldState }) => (
					<>
						<div className='label min-w-0 flex-wrap gap-2'>
							<span className='label-text flex min-w-0 flex-wrap gap-2'>
								<span className='font-semibold'>Content</span>
								{fieldState.error && (
									<span className='text-error' role='alert'>
										{fieldState.error.message}
									</span>
								)}
							</span>

							{isMarkdown && (
								<fieldset className='join'>
									<legend className='sr-only'>
										Markdown view
									</legend>
									<button
										type='button'
										className={`join-item btn btn-xs min-h-11 sm:btn-sm sm:min-h-10 ${mode === 'code' ? 'btn-primary' : 'btn-ghost'}`}
										onClick={() => setMode('code')}
										aria-pressed={mode === 'code'}
									>
										<FaCode aria-hidden='true' />
										<span>Editor</span>
									</button>
									<button
										type='button'
										className={`join-item btn btn-sm hidden min-h-11 sm:inline-flex sm:min-h-10 ${mode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
										onClick={() => setMode('split')}
										aria-pressed={mode === 'split'}
									>
										<FaColumns aria-hidden='true' /> Split
									</button>
									<button
										type='button'
										className={`join-item btn btn-xs min-h-11 sm:btn-sm sm:min-h-10 ${mode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
										onClick={() => setMode('preview')}
										aria-pressed={mode === 'preview'}
									>
										<FaEye aria-hidden='true' /> Preview
									</button>
								</fieldset>
							)}
						</div>

						<div
							className={`flex min-w-0 gap-4 ${isMarkdown && mode === 'split' ? 'flex-col lg:flex-row' : 'flex-col'}`}
						>
							<div
								className={`${showEditor ? 'block' : 'hidden'} min-w-0 ${enableMarkdownPreview ? 'overflow-hidden rounded-xl border border-base-300' : ''} ${isMarkdown && mode === 'split' ? 'w-full lg:w-1/2' : 'w-full'}`}
								aria-hidden={!showEditor}
							>
								<CodeMirror
									value={field.value}
									extensions={editorExtensions}
									onChange={field.onChange}
									basicSetup={EDITOR_BASIC_SETUP}
									className={
										enableMarkdownPreview
											? 'h-[260px] overflow-auto sm:h-[360px] lg:h-[650px]'
											: 'h-[200px] overflow-auto lg:h-[650px]'
									}
									theme={cmTheme}
								/>
							</div>

							{showPreview && (
								<MarkdownPreviewPanel
									content={String(field.value ?? '')}
									className={`h-[260px] min-w-0 overflow-auto rounded-xl border border-base-300 bg-base-200/30 p-4 sm:h-[360px] lg:h-[650px] ${mode === 'split' ? 'w-full lg:w-1/2' : 'w-full'}`}
								/>
							)}
						</div>
					</>
				)}
			/>
		</div>
	)
}
