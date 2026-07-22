'use client'

import type { Extension } from '@codemirror/state'
import { useEffect, useRef, useState } from 'react'
import { loadEditorLanguage } from './editor-language'

export const useEditorLanguage = (name: string): Extension => {
	const [language, setLanguage] = useState<Extension>([])
	const requestRef = useRef(0)

	useEffect(() => {
		const request = ++requestRef.current
		setLanguage([])

		void loadEditorLanguage(name).then((extension) => {
			if (request === requestRef.current) setLanguage(extension)
		})

		return () => {
			requestRef.current += 1
		}
	}, [name])

	return language
}
