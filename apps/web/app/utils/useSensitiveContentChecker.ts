'use client'
import { useRef, useState } from 'react'
import type { Paste } from '../types'

export interface Match {
	word: string
	lines: number[]
}

export function useSensitiveContentChecker<T>() {
	const [showWarning, setShowWarning] = useState(false)
	const [matchedLines, setMatchedLines] = useState<Match[]>([])
	const formRef = useRef<T | null>(null)

	const riskyWords = ['token', 'password', 'secret', 'apikey', 'auth']

	const checkAndSubmit = (data: T, submitFn: (data: T) => void) => {
		const lines = (data as Paste).content?.split('\n') ?? []
		const matchMap: Record<string, number[]> = {}

		for (let index = 0; index < lines.length; index++) {
			const lineText = lines[index]
			for (const word of riskyWords) {
				if (lineText?.toLowerCase().includes(word.toLowerCase())) {
					const key = word.toLowerCase()
					if (!matchMap[key]) {
						matchMap[key] = []
					}
					matchMap[key].push(index + 1)
				}
			}
		}

		const matches = Object.entries(matchMap).map(([word, lines]) => ({
			word,
			lines
		}))

		if (matches.length > 0) {
			setMatchedLines(matches)
			setShowWarning(true)
			formRef.current = data
		} else {
			submitFn(data)
		}
	}

	const acceptAndSubmit = (submitFn: (data: T) => void) => {
		if (formRef.current) {
			submitFn(formRef.current)
		}
		setShowWarning(false)
	}

	return {
		showWarning,
		setShowWarning,
		matchedLines,
		checkAndSubmit,
		acceptAndSubmit
	}
}
