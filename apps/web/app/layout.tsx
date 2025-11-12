import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { Container } from './components/core/Container'
import { Footer } from './components/core/Footer'
import { Navbar } from './components/core/NavBar'
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
					<Toaster
						toastOptions={{
							className:
								'!tracking-wider !font-semibold !bg-base-300 !backdrop-blur !text-base-content',
							success: {
								icon: (
									<FiCheckCircle className='!text-success w-6 h-6' />
								)
							},
							error: {
								icon: (
									<FiXCircle className='!text-error w-6 h-6' />
								)
							}
						}}
					/>
				</ThemeProvider>
			</body>
		</html>
	)
}
