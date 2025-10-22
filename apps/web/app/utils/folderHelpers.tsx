import type { JSX } from 'react'
import { FolderRow } from '../components/custom/FolderRow'
import type { Folder } from '../types'

export function buildFolderTree(folders: Folder[]) {
	const children = new Map<string | null, Folder[]>()
	for (const f of folders) {
		const key = f.parentFolderId ?? null
		const arr = children.get(key) ?? []
		arr.push(f)
		children.set(key, arr)
	}
	for (const arr of children.values())
		arr.sort((a, b) => a.name.localeCompare(b.name))
	return children
}

export function flattenWithIndent(
	children: Map<string | null, Folder[]>,
	parentId: string | null,
	level = 0
): Array<{ id: string; label: string }> {
	const out: Array<{ id: string; label: string }> = []
	const list = children.get(parentId)
	if (!list) return out
	for (const f of list) {
		if (!f?.id) continue
		const name = f?.name ?? '(unnamed)'
		const prefix = level > 0 ? '— '.repeat(level) : ''
		out.push({ id: f.id, label: `${prefix}${name}` })
		out.push(...flattenWithIndent(children, f.id, level + 1))
	}
	return out
}

export function renderFolderBranch(
	byParent: Map<string | null, Folder[]>,
	parentId: string | null,
	level = 0,
	username: string
): JSX.Element | null {
	const children = byParent.get(parentId)
	if (!children || children.length === 0) return null

	return (
		<ul
			className={[
				level === 0
					? 'rounded-xl border border-base-300 bg-base-100/60'
					: '',
				'space-y-1',
				level > 0 ? 'ml-3.5 pl-3.5 border-l border-base-300/100' : ''
			].join(' ')}
		>
			{children.map((f) => (
				<li key={f.id} className='relative'>
					<FolderRow folder={f} username={username}>
						{renderFolderBranch(
							byParent,
							f.id,
							level + 1,
							username
						)}
					</FolderRow>
				</li>
			))}
		</ul>
	)
}
