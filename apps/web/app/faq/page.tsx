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
			className='link link-primary transition-colors hover:opacity-80'
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
				Both Static Pastes and Realtime Editors support 53 syntaxes in
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
					className='link link-primary font-semibold'
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
		<div
			id='faq-top'
			className='mx-auto flex w-full max-w-5xl flex-col gap-10 pb-16'
		>
			<header className='rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-7'>
				<div className='flex items-start gap-4'>
					<span className='flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary'>
						<FaQuestionCircle
							className='size-6'
							aria-hidden='true'
						/>
					</span>
					<div className='min-w-0 space-y-1'>
						<h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
							FAQ
							<span className='ml-2 hidden text-base font-normal text-base-content/60 sm:inline'>
								[Frequently Asked Questions]
							</span>
						</h1>
						<p className='max-w-2xl text-sm leading-relaxed text-base-content/70 sm:text-base'>
							Here are some of the most frequently asked questions
							about DoggoPaste.
						</p>
					</div>
				</div>

				<nav
					aria-label='Frequently asked questions'
					className='mt-6 rounded-xl border border-base-300 bg-base-200/40 p-4 sm:p-5'
				>
					<h2 className='mb-3 text-sm font-semibold uppercase tracking-wider text-base-content/70'>
						Questions
					</h2>
					<ol className='flex list-decimal flex-col gap-2 pl-5 font-medium marker:text-primary'>
						{faqItems.map((item, index) => (
							<li key={`link-${item.question}`} className='pl-1'>
								<a
									href={`#question-${index + 1}`}
									className='link link-hover break-words transition-colors hover:text-primary'
								>
									{item.question}
								</a>
							</li>
						))}
					</ol>
				</nav>
			</header>

			<div className='flex flex-col gap-4'>
				{faqItems.map((item, index) => (
					<section
						key={`content-${item.question}`}
						id={`question-${index + 1}`}
						aria-labelledby={`question-${index + 1}-heading`}
						className='scroll-mt-24 rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6'
					>
						<div className='flex flex-col'>
							<h2
								id={`question-${index + 1}-heading`}
								className='mb-4 flex min-w-0 items-start gap-2 border-b border-base-300 pb-3 text-lg font-bold sm:text-xl'
							>
								<a
									className='link link-primary shrink-0'
									href={`#question-${index + 1}`}
									aria-label={`Link to question ${index + 1}: ${item.question}`}
								>
									#{index + 1}.
								</a>
								<span className='min-w-0 break-words'>
									{item.question}
								</span>
							</h2>
							<div className='max-w-prose leading-relaxed text-base-content/85'>
								{item.answer}
							</div>

							<a
								className='link link-primary mt-4 flex min-h-11 w-fit items-center gap-2 self-end font-semibold'
								href='#faq-top'
							>
								back to top
								<FaArrowUp
									className='size-3'
									aria-hidden='true'
								/>
							</a>
						</div>
					</section>
				))}
			</div>
		</div>
	)
}
