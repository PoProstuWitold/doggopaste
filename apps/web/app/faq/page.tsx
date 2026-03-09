import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { FaArrowUp, FaQuestionCircle } from 'react-icons/fa'
import { getContrastTextColor } from '../utils/functions'
import { syntaxes } from '../utils/syntaxes'

export const metadata: Metadata = {
	title: 'FAQ',
	description: 'Frequently Asked Questions about DoggoPaste'
}

interface FaqItem {
	question: string
	answer: ReactNode
}

const FaqSyntax: React.FC<{ syntax: string }> = ({ syntax }) => {
	const foundSyntax = syntaxes.find((s) => s.name === syntax)

	if (!foundSyntax) {
		return <span className='badge badge-sm badge-ghost'>{syntax}</span>
	}

	const bgColor = foundSyntax.color || '#808080'

	return (
		<span
			className='badge badge-sm font-semibold border-none'
			style={{
				backgroundColor: bgColor,
				color: getContrastTextColor(bgColor)
			}}
		>
			{foundSyntax.name}
		</span>
	)
}

const FaqLink: React.FC<{
	label: string | ReactNode
	href: string
}> = ({ label, href }) => {
	return (
		<a
			className='link link-primary hover:text-primary-focus transition-colors'
			target='_blank'
			href={href}
			rel='noopener noreferrer'
		>
			{label}
		</a>
	)
}

const faqItems: FaqItem[] = [
	{
		question: 'What is DoggoPaste?',
		answer: (
			<p>
				DoggoPaste is a free and open-source service for sharing text
				snippets in two forms: <b>Static Pastes</b> (like{' '}
				<FaqLink label='Pastebin.com' href='https://pastebin.com/' /> or{' '}
				<FaqLink label='Hastebin.com' href='https://hastebin.com' />)
				and <b>Realtime Editors</b> (like{' '}
				<FaqLink label='CodeShare.io' href='https://codeshare.io/' />
				).
			</p>
		)
	},
	{
		question: 'What is a Static Paste?',
		answer: (
			<p>
				Static Paste is a text sharing method where you can create a
				paste with advanced options (title, description, content, slug,
				category, tags, syntax, expiration, visibility, password,
				encryption, folders, guest mode) and share it via a unique URL.
				These pastes are static and do not support realtime
				collaboration.
			</p>
		)
	},
	{
		question: 'What is a Realtime Editor?',
		answer: (
			<p>
				Realtime Editor is a collaborative text editor that allows
				multiple users to edit the same text simultaneously in real
				time. It is ideal for pair programming, code reviews or any
				situation where live collaboration is needed. Compared to Static
				Pastes, it only allows for changing syntax, title and content.
			</p>
		)
	},
	{
		question: 'What syntaxes are supported?',
		answer: (
			<div>
				Both Static Pastes and Realtime Editors support 52 syntaxes in
				total, including:
				<ul className='list-disc list-inside mt-3 space-y-3'>
					<li>
						<span className='font-semibold'>
							24 Programming Languages
						</span>
						<div className='flex flex-wrap gap-2 mt-2'>
							{[
								'JavaScript',
								'Python',
								'TypeScript',
								'Java',
								'C#',
								'C++',
								'Go',
								'PHP',
								'Rust',
								'Swift',
								'Kotlin',
								'Ruby',
								'R',
								'Dart',
								'C',
								'Scala',
								'Lua',
								'Haskell',
								'Perl',
								'Erlang',
								'Pascal',
								'Fortran',
								'Cobol',
								'HolyC'
							].map((s) => (
								<FaqSyntax key={s} syntax={s} />
							))}
						</div>
					</li>
					<li>
						<span className='font-semibold'>
							10 Web & Frontend Syntaxes
						</span>
						<div className='flex flex-wrap gap-2 mt-2'>
							{[
								'HTML',
								'CSS',
								'Sass',
								'Less',
								'JSX',
								'TSX',
								'Svelte',
								'Vue',
								'Angular',
								'WebAssembly'
							].map((s) => (
								<FaqSyntax key={s} syntax={s} />
							))}
						</div>
					</li>
					<li>
						<span className='font-semibold'>
							7 Database Dialects
						</span>
						<div className='flex flex-wrap gap-2 mt-2'>
							{[
								'PostgreSQL',
								'MySQL',
								'SQLite',
								'MariaDB',
								'SQL',
								'StandardSQL',
								'Cassandra'
							].map((s) => (
								<FaqSyntax key={s} syntax={s} />
							))}
						</div>
					</li>
					<li>
						<span className='font-semibold'>
							12 Configuration / Markup / Data Formats
						</span>
						<div className='flex flex-wrap gap-2 mt-2'>
							{[
								'JSON',
								'XML',
								'YAML',
								'TOML',
								'Markdown',
								'Dockerfile',
								'PowerShell',
								'Shell',
								'CMake',
								'Nginx',
								'GraphQL',
								'Plaintext'
							].map((s) => (
								<FaqSyntax key={s} syntax={s} />
							))}
						</div>
					</li>
				</ul>
			</div>
		)
	},
	{
		question: 'Who created DoggoPaste and why?',
		answer: (
			<p>
				DoggoPaste was created by <b>Witold Zawada</b> (
				<FaqLink
					label='github.com/PoProstuWitold'
					href='https://github.com/PoProstuWitold'
				/>
				) and <b>Wiktor Wypyszyński</b> (
				<FaqLink
					label='github.com/Netr0n07'
					href='https://github.com/Netr0n07'
				/>
				) as an engineering thesis project at{' '}
				<a
					href='https://pollub.pl'
					target='_blank'
					className='font-semibold text-[#bb1e29] hover:underline'
					rel='noopener noreferrer'
				>
					Lublin University of Technology (Politechnika Lubelska)
				</a>
				.
			</p>
		)
	},
	{
		question: 'Can I selfhost it?',
		answer: (
			<div>
				Yes! DoggoPaste is 100% open-source and available on{' '}
				<FaqLink
					label='GitHub'
					href='https://github.com/PoProstuWitold/doggopaste'
				/>{' '}
				and{' '}
				<FaqLink
					label='DockerHub'
					href='https://hub.docker.com/repository/docker/poprostuwitold/doggopaste'
				/>
				.
			</div>
		)
	}
]

export default function FaqPage() {
	return (
		<div className='flex flex-col gap-10 max-w-5xl mx-auto w-full'>
			{/* Header */}
			<div className='flex flex-col gap-4'>
				<div className='flex items-center gap-3 border-b border-base-300 pb-3'>
					<FaQuestionCircle className='w-8 h-8 text-primary' />
					<h1 className='text-3xl font-bold'>
						FAQ{' '}
						<span className='text-base-content/60 text-lg font-normal ml-2 hidden sm:inline'>
							[Frequently Asked Questions]
						</span>
					</h1>
				</div>

				<p className='text-lg'>
					Here are some of the most frequently asked questions about
					DoggoPaste:
				</p>

				{/* Question list (Table of Contents) */}
				<nav className='bg-base-200/50 p-4 rounded-lg'>
					<ol className='list-decimal list-inside flex flex-col gap-2 font-medium'>
						{faqItems.map((item, index) => (
							<li key={`link-${item.question}`}>
								<a
									href={`#question-${index + 1}`}
									className='link link-hover hover:text-primary transition-colors'
								>
									{item.question}
								</a>
							</li>
						))}
					</ol>
				</nav>
			</div>

			{/* Actual questions */}
			<div className='flex flex-col gap-8'>
				{faqItems.map((item, index) => (
					<div
						key={`content-${item.question}`}
						id={`question-${index + 1}`}
						className='scroll-mt-24 flex flex-col gap-6'
					>
						<section className='flex flex-col'>
							<h2 className='text-xl md:text-2xl font-bold border-b border-base-300 pb-2 mb-3 flex gap-2'>
								<a
									className='link link-primary'
									href={`#question-${index + 1}`}
								>
									#{index + 1}.
								</a>
								{item.question}
							</h2>
							<div className='text-base-content/90 leading-relaxed pl-1 md:pl-4'>
								{item.answer}
							</div>

							{/* Back to top */}
							<a
								className='self-end link-primary font-semibold link mt-2 flex items-center gap-2'
								href='/faq#'
							>
								back to top
								<FaArrowUp className='w-3 h-3' />
							</a>
						</section>
					</div>
				))}
			</div>
		</div>
	)
}
