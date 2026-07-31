'use client'

import { syntaxNames } from '@/app/utils/editor-language'
import type { Syntax } from '../../../types'
import { getContrastTextColor } from '../../../utils/functions'
import { getPresenceColor } from './presence-color'
import type {
	CursorSelection,
	RemotePresenceUpdate,
	RemoteTextPresence
} from './socket-contract'

type RemoteSyntaxPresence = RemotePresenceUpdate & { field: 'syntax' }

const titlePresenceLabel = (
	presence: RemoteTextPresence,
	title: string
): string => {
	const anchor = Math.min(presence.selection.anchor, title.length)
	const head = Math.min(presence.selection.head, title.length)
	const from = Math.min(anchor, head)
	const to = Math.max(anchor, head)
	const name = presence.name || 'Guest'
	if (from === to) return `${name} in title`

	const selected = title.slice(from, to).trim()
	return selected
		? `${name}: “${selected.length > 24 ? `${selected.slice(0, 24)}…` : selected}”`
		: `${name}: ${to - from} characters selected`
}

export const RealtimeMetadataFields = ({
	title,
	syntax,
	disabled,
	remoteTitlePresence,
	remoteSyntaxPresence,
	onTitleChange,
	onSyntaxChange,
	onTitlePresence,
	onSyntaxPresence
}: {
	title: string
	syntax: Syntax
	disabled: boolean
	remoteTitlePresence: readonly RemoteTextPresence[]
	remoteSyntaxPresence: readonly RemoteSyntaxPresence[]
	onTitleChange: (title: string) => void
	onSyntaxChange: (syntaxName: string) => void
	onTitlePresence: (selection: CursorSelection | null) => void
	onSyntaxPresence: (active: boolean) => void
}) => (
	<div className='w-full flex flex-col md:flex-row gap-4'>
		<label className='form-control w-full'>
			<div className='label flex-wrap gap-2'>
				<span className='label-text'>Title</span>
				{remoteTitlePresence.map((presence) => {
					const color = getPresenceColor(presence.id)
					return (
						<span
							key={presence.id}
							className='badge badge-sm max-w-full'
							style={{
								backgroundColor: color,
								borderColor: color,
								color: getContrastTextColor(color)
							}}
							title={titlePresenceLabel(presence, title)}
						>
							<span className='max-w-64 truncate'>
								{titlePresenceLabel(presence, title)}
							</span>
						</span>
					)
				})}
			</div>
			<input
				type='text'
				className='input input-bordered w-full'
				placeholder='Paste Title'
				name='title'
				disabled={disabled}
				value={title}
				onChange={(event) => {
					onTitleChange(event.target.value)
					onTitlePresence({
						anchor: event.currentTarget.selectionStart ?? 0,
						head: event.currentTarget.selectionEnd ?? 0
					})
				}}
				onFocus={(event) =>
					onTitlePresence({
						anchor: event.currentTarget.selectionStart ?? 0,
						head: event.currentTarget.selectionEnd ?? 0
					})
				}
				onSelect={(event) =>
					onTitlePresence({
						anchor: event.currentTarget.selectionStart ?? 0,
						head: event.currentTarget.selectionEnd ?? 0
					})
				}
				onKeyUp={(event) =>
					onTitlePresence({
						anchor: event.currentTarget.selectionStart ?? 0,
						head: event.currentTarget.selectionEnd ?? 0
					})
				}
				onPointerUp={(event) =>
					onTitlePresence({
						anchor: event.currentTarget.selectionStart ?? 0,
						head: event.currentTarget.selectionEnd ?? 0
					})
				}
				onBlur={() => onTitlePresence(null)}
			/>
		</label>

		<label className='form-control w-full'>
			<div className='label flex-wrap gap-2'>
				<span className='label-text'>Syntax</span>
				{remoteSyntaxPresence.map((presence) => {
					const color = getPresenceColor(presence.id)
					return (
						<span
							key={presence.id}
							className='badge badge-sm'
							style={{
								backgroundColor: color,
								borderColor: color,
								color: getContrastTextColor(color)
							}}
						>
							{presence.name || 'Guest'} is choosing a language…
						</span>
					)
				})}
			</div>
			<select
				className='select select-bordered w-full'
				style={{
					color: getContrastTextColor(syntax.color),
					backgroundColor: syntax.color
				}}
				value={syntax.name}
				disabled={disabled}
				onChange={(event) => {
					onSyntaxChange(event.target.value)
					onSyntaxPresence(false)
				}}
				onFocus={() => onSyntaxPresence(true)}
				onPointerDown={() => onSyntaxPresence(true)}
				onKeyDown={(event) => {
					if (event.key === 'Escape') onSyntaxPresence(false)
				}}
				onBlur={() => onSyntaxPresence(false)}
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
