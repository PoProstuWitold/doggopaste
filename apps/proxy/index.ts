import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import type { Socket } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as connect from 'connect'
import * as finalhandler from 'finalhandler'
import { createProxyMiddleware } from 'http-proxy-middleware'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = resolve(__dirname, '../../')

const mode = process.env.NODE_ENV || 'development'
const command = mode === 'production' ? 'start' : 'dev'

console.info(`[proxy] ${mode} mode`)
spawn('pnpm', ['--filter', 'web', command], {
	cwd: root,
	stdio: 'inherit',
	env: process.env
})
spawn('pnpm', ['--filter', 'api', command], {
	cwd: root,
	stdio: 'inherit',
	env: process.env
})

const app = connect.default()

const apiProxy = createProxyMiddleware({
	target: 'http://localhost:3001/api',
	changeOrigin: true,
	pathRewrite: (path) => (path === '/' ? '' : path)
})

const wsProxy = createProxyMiddleware({
	target: 'ws://localhost:3001/ws',
	changeOrigin: true,
	ws: true
})

const webProxy = createProxyMiddleware({
	target: 'http://localhost:3000',
	changeOrigin: true,
	ws: true
})

app.use('/api', apiProxy)
app.use('/ws', wsProxy)
app.use('/', webProxy)

const server = createServer((req, res) => {
	app(req, res, finalhandler.default(req, res))
})

server.on('upgrade', (req, socket, head) => {
	if (req.url?.startsWith('/ws')) {
		console.log('[proxy] WS upgrade -> Socket.IO')
		wsProxy.upgrade(req, socket as Socket, head)
	} else {
		console.log('[proxy] WS upgrade -> Next.js HMR')
		webProxy.upgrade(req, socket as Socket, head)
	}
})

server.listen(3002, () => {
	console.log('Proxy running on http://localhost:3002')
})
