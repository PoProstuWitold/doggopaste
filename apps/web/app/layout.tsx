import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Container } from './components/Container'
import { Footer } from './components/Footer'
import { Navbar } from './components/NavBar'

export const metadata: Metadata = {
	title: 'PoProstuWitold',
	description: 'Hono Fullstack Template'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<head />
			<body>
				<Navbar />
				<Container>{children}</Container>
				<Footer />
				<Toaster />
			</body>
		</html>
	)
}
