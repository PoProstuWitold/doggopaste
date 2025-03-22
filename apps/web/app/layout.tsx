import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Container } from './components/Container'
import { Footer } from './components/Footer'
import { Navbar } from './components/NavBar'
import { ThemeProvider } from './context/ThemeContext'

export const metadata: Metadata = {
	title: 'DoggoPaste',
	description: 'Drop your code, let Doggo fetch it!'
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
				<ThemeProvider defaultTheme='system'>
					<Navbar />
					<Container>{children}</Container>
					<Footer />
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	)
}
