'use client'

import { syntaxNames } from '@/app/utils/editor-language'
import type { Syntax } from '../../../types'
import { getContrastTextColor } from '../../../utils/functions'

export const RealtimeMetadataFields = ({
	title,
	syntax,
	disabled,
	onTitleChange,
	onSyntaxChange
}: {
	title: string
	syntax: Syntax
	disabled: boolean
	onTitleChange: (title: string) => void
	onSyntaxChange: (syntaxName: string) => void
}) => (
	<div className='w-full flex flex-col md:flex-row gap-4'>
		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text'>Title</span>
			</div>
			<input
				type='text'
				className='input input-bordered w-full'
				placeholder='Paste Title'
				name='title'
				disabled={disabled}
				value={title}
				onChange={(event) => onTitleChange(event.target.value)}
			/>
		</label>

		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text'>Syntax</span>
			</div>
			<select
				className='select select-bordered w-full'
				style={{
					color: getContrastTextColor(syntax.color),
					backgroundColor: syntax.color
				}}
				value={syntax.name}
				disabled={disabled}
				onChange={(event) => onSyntaxChange(event.target.value)}
			>
				{syntaxNames.map((name) => (
					<option key={name} value={name}>
						{name}
					</option>
				))}
			</select>
		</label>
	</div>
)
