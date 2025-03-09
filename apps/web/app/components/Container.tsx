interface ContainerProps {
	children: React.ReactNode
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
	return (
		<>
			<main
				className={`
					pt-20 
					min-h-[100rem] 
					px-4 
					sm:px-6 
					md:px-8 
					lg:pt-24 
					lg:max-w-5xl 
					lg:mx-auto 
					xl:max-w-6xl
				`}
			>
				{children}
			</main>
		</>
	)
}
