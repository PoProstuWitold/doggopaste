import type { IconType } from 'react-icons'
import { BsFire } from 'react-icons/bs'
import { FaBolt, FaFolder, FaKey } from 'react-icons/fa'
import {
	MdEnhancedEncryption,
	MdLabel,
	MdLanguage,
	MdOutlineFileDownload
} from 'react-icons/md'

const features: Array<{
	title: string
	description: string
	icon: IconType
}> = [
	{
		title: 'Password protection',
		description:
			'Require a password before protected static paste content can be read.',
		icon: FaKey
	},
	{
		title: 'Client-side encryption',
		description:
			'Encrypt content in the browser before it is sent to DoggoPaste.',
		icon: MdEnhancedEncryption
	},
	{
		title: 'Burn after read',
		description:
			'Create a static paste that is removed after its successful read.',
		icon: BsFire
	},
	{
		title: 'Syntax highlighting',
		description:
			'Choose from the supported editor languages and download with a matching extension.',
		icon: MdLanguage
	},
	{
		title: 'Realtime collaboration',
		description:
			'Share a slug and edit title, syntax and content together with live presence.',
		icon: FaBolt
	},
	{
		title: 'Folders',
		description: 'Organize owned static pastes in private, nested folders.',
		icon: FaFolder
	},
	{
		title: 'Tags and categories',
		description:
			'Add compact labels that make an owned paste easier to recognize.',
		icon: MdLabel
	},
	{
		title: 'Raw and download',
		description:
			'Open an authorized paste as plain text or save it as a local file.',
		icon: MdOutlineFileDownload
	}
]

export function FeatureSection() {
	return (
		<section className='w-full' aria-labelledby='features-title'>
			<div className='mb-6'>
				<p className='mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary'>
					Built for useful sharing
				</p>
				<h2
					id='features-title'
					className='text-2xl font-bold sm:text-3xl'
				>
					The tools around your text
				</h2>
				<p className='mt-2 text-base-content/70'>
					Use only the controls you need, from a quick public snippet
					to a protected or collaborative workspace.
				</p>
			</div>

			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
				{features.map((feature) => {
					const Icon = feature.icon
					return (
						<article
							key={feature.title}
							className='min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary/40'
						>
							<div className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary'>
								<Icon className='h-5 w-5' aria-hidden='true' />
							</div>
							<h3 className='font-semibold'>{feature.title}</h3>
							<p className='mt-2 text-sm leading-relaxed text-base-content/70'>
								{feature.description}
							</p>
						</article>
					)
				})}
			</div>
		</section>
	)
}
