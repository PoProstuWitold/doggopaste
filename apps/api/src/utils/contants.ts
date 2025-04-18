import os from 'node:os'

const getLocalIPv4Addresses = (): string[] => {
	const interfaces = os.networkInterfaces()
	const addresses: string[] = []

	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name] || []) {
			if (
				iface.family === 'IPv4' &&
				!iface.internal &&
				iface.address.startsWith('192.168.')
			) {
				addresses.push(iface.address)
			}
		}
	}
	return addresses
}

const ipOrigins = getLocalIPv4Addresses().flatMap((ip) => [
	`http://${ip}:3000`,
	`http://${ip}:3001`
])

export const origins = [
	'http://localhost:3000',
	'http://localhost:3001',
	...(process.env.NEXT_WEB_URL ? [process.env.NEXT_WEB_URL] : []),
	...(process.env.HONO_API_URL ? [process.env.HONO_API_URL] : []),
	...ipOrigins
]
