'use client'

import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import CodeMirror from '@uiw/react-codemirror'
import { FaFileCode } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { PasteButtons } from './PasteButton'

const extensions = {
	javascript: javascript(),
	typescript: javascript({ typescript: true }),
	jsx: javascript({ jsx: true }),
	tsx: javascript({ jsx: true, typescript: true }),
	python: python(),
	cpp: cpp(),
	html: html(),
	plaintext: []
}

export default function SinglePaste({
	slug,
	content,
	syntax
}: {
	slug: string
	content: string
	syntax: keyof typeof extensions
}) {
	const { cmTheme } = useTheme()

	return (
		<div className='flex flex-col gap-4 p-5 rounded-lg shadow-xl bg-base-200 mx-auto max-w-7xl'>
			<div className='flex lg:flex-row flex-col items-center font-bold text-center gap-4 justify-center'>
				<div className='flex flex-row items-center text-3xl font-bold text-center gap-4 justify-center'>
					<FaFileCode className='w-10 h-10' />
					Paste "{slug}"
				</div>
				<div className='divider lg:divider-horizontal' />
				<PasteButtons slug={slug} />
			</div>

			<div className='flex flex-col lg:flex-row gap-4'>
				<div className='w-full flex flex-col gap-4 min-w-0'>
					<div className='form-control w-full flex-1 min-w-0'>
						<div className='label'>
							<span className='label-text'>Content</span>
						</div>
						<div className='min-w-0'>
							<CodeMirror
								value={content}
								extensions={[extensions[syntax] ?? []]}
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
								className='rounded-lg border overflow-auto h-[650px]'
								theme={cmTheme}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
