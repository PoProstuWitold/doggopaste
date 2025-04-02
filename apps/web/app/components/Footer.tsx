export const Footer: React.FC = () => {
	return (
		<>
			<footer className='p-10 bg-base-300'>
				<div className='footer'>
					<div>
						<span className='mb-1 font-bold uppercase'>
							DoggoPaste
						</span>
						<p>
							Combination of a Pastebin and CodeShare. Free and
							selfhostable.
						</p>
					</div>
				</div>
				<div className='my-10 border-t border-base-content' />
				<div className='justify-center mx-auto md:text-center'>
					<p>
						Copyright © {new Date().getFullYear()} Witold Zawada
						(PoProstuWitold), Wiktor Wypyszyński (Netr0n07) - All
						rights reserved. Check the website
						<a
							href='https://github.com/PoProstuWitold/doggopaste'
							target='_blank'
							rel='noreferrer'
							className='mx-1 link'
						>
							source code
						</a>
					</p>
				</div>
			</footer>
		</>
	)
}
