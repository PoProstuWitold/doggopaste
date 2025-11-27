interface ContainerProps {
	children: React.ReactNode
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
	return (
		<main
			className={`
				pt-20 
				pb-20
				min-h-screen
				px-4 
				sm:px-6 
				md:px-8 
				lg:pt-24
				lg:mx-auto
			`}
		>
			{children}
		</main>
	)
}
