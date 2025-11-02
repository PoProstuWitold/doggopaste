'use client'

import CodeMirror from '@uiw/react-codemirror'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useTheme } from '@/app/context/ThemeContext'
import type { PasteForm as PasteFormType } from '@/app/types'
import { extensions } from '@/app/utils/functions'

export function ContentEditor() {
	const { control } = useFormContext<PasteFormType>()
	const { cmTheme } = useTheme()
	const syntax = useWatch<PasteFormType>({
		name: 'syntax'
	}) as keyof typeof extensions

	return (
		<div className='form-control w-full flex-1 min-w-0'>
			<div className='min-w-0'>
				<Controller
					name='content'
					control={control}
					rules={{ required: 'Content is required' }}
					render={({ field, fieldState }) => (
						<>
							<div className='label'>
								<span className='label-text flex gap-2'>
									<span>Content</span>
									{fieldState.error && (
										<span className='text-error'>
											{fieldState.error.message}
										</span>
									)}
								</span>
							</div>
							<CodeMirror
								value={field.value}
								extensions={[extensions[syntax]]}
								onChange={field.onChange}
								basicSetup={{
									lineNumbers: true,
									highlightActiveLine: true,
									highlightActiveLineGutter: true,
									foldGutter: true,
									tabSize: 4,
									history: true,
									syntaxHighlighting: true
								}}
								className='overflow-auto h-[650px]'
								theme={cmTheme}
							/>
						</>
					)}
				/>
			</div>
		</div>
	)
}
