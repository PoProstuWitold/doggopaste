const bufferToBase64 = (buffer: ArrayBuffer): string => {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

export const encryptWithPassword = async (
	content: string,
	password: string
): Promise<string> => {
	const enc = new TextEncoder()

	const salt = window.crypto.getRandomValues(new Uint8Array(16))

	const iv = window.crypto.getRandomValues(new Uint8Array(12))

	const keyMaterial = await window.crypto.subtle.importKey(
		'raw',
		enc.encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	)

	const key = await window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt']
	)

	const encryptedContent = await window.crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv
		},
		key,
		enc.encode(content)
	)

	const payload = {
		v: 1,
		s: bufferToBase64(salt.buffer),
		iv: bufferToBase64(iv.buffer),
		ct: bufferToBase64(encryptedContent)
	}

	return JSON.stringify(payload)
}

const base64ToBuffer = (base64: string): ArrayBuffer => {
	const binaryString = atob(base64)
	const bytes = new Uint8Array(binaryString.length)
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}
	return bytes.buffer
}

export const decryptWithPassword = async (
	encryptedJson: string,
	password: string
): Promise<string> => {
	try {
		const data = JSON.parse(encryptedJson)
		const { s, iv, ct } = data

		if (!s || !iv || !ct) throw new Error('Invalid encrypted format')

		const salt = base64ToBuffer(s)
		const ivBuffer = base64ToBuffer(iv)
		const ciphertext = base64ToBuffer(ct)
		const enc = new TextEncoder()

		const keyMaterial = await window.crypto.subtle.importKey(
			'raw',
			enc.encode(password),
			'PBKDF2',
			false,
			['deriveKey']
		)

		const key = await window.crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['decrypt']
		)

		const decryptedBuffer = await window.crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: ivBuffer
			},
			key,
			ciphertext
		)

		const dec = new TextDecoder()
		return dec.decode(decryptedBuffer)
	} catch (_e) {
		throw new Error('Decryption failed. Wrong password?')
	}
}
