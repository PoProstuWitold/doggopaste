import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
	FaArrowRight,
	FaArrowUp,
	FaBookOpen,
	FaInfoCircle
} from 'react-icons/fa'
import { HiHashtag } from 'react-icons/hi'
import { SiFacebook, SiGithub, SiGoogle } from 'react-icons/si'

export const metadata: Metadata = {
	title: 'Guide',
	description: 'Learn how to use DoggoPaste'
}

interface GuideItem {
	feature: string
	instructions: ReactNode
}

interface GuideSection {
	name: string
	label: string
	items: GuideItem[]
}

const guideSections: GuideSection[] = [
	{
		name: 'Users',
		label: 'users',
		items: [
			{
				feature: 'Registration & Login',
				instructions: (
					<div className='space-y-4'>
						<p>
							Creating an account allows you to manage your
							pastes, organize them into folders, and sync your
							settings across devices.
						</p>
						<ol className='list-decimal list-inside flex flex-col gap-2 font-medium bg-base-200/50 p-4 rounded-xl'>
							<li>
								Navigate to the{' '}
								<span className='kbd kbd-sm'>/login</span> page.
							</li>
							<li>
								Switch to the <strong>Register</strong> tab for
								new users or <strong>Login</strong> for existing
								users.
							</li>
							<li>Fill the chosen form.</li>
							<li>
								Click <strong>Submit</strong>.
							</li>
						</ol>
					</div>
				)
			},
			{
				feature: 'OAuth2 Login',
				instructions: (
					<div className='space-y-4'>
						<p>
							For a faster sign-in experience, you can use your
							existing accounts from supported providers.
						</p>
						<div className='flex gap-4'>
							<div className='btn btn-outline gap-2 pointer-events-none'>
								<SiGoogle /> Google
							</div>
							<div className='btn btn-outline gap-2 pointer-events-none'>
								<SiGithub /> GitHub
							</div>
							<div className='btn btn-outline gap-2 pointer-events-none'>
								<SiFacebook /> Facebook
							</div>
						</div>
						<div className='alert alert-info text-sm shadow-sm'>
							<FaInfoCircle />
							If you use the same email address for OAuth2 as your
							manual account, they will be automatically linked.
						</div>
					</div>
				)
			},
			{
				feature: 'Accounts Linking',
				instructions: (
					<div className='space-y-4'>
						<div className='bg-base-200/50 p-4 rounded-xl space-y-2'>
							<h4 className='font-bold text-sm uppercase tracking-wide opacity-70'>
								Scenario 1: New Account
							</h4>
							<p>
								Create a new DoggoPaste account using OAuth2
								provider on{' '}
								<span className='kbd kbd-sm'>/login</span> page.
							</p>
						</div>
						<div className='bg-base-200/50 p-4 rounded-xl space-y-2'>
							<h4 className='font-bold text-sm uppercase tracking-wide opacity-70'>
								Scenario 2: Existing Account
							</h4>
							<p>
								If you already have a DoggoPaste account and
								want to link an OAuth2 provider:
							</p>
							<ol className='list-decimal list-inside pl-4 space-y-1 font-medium'>
								<li>
									Go to <strong>Profile</strong> (
									<span className='kbd kbd-xs'>/profile</span>
									).
								</li>
								<li>
									Select the <strong>Accounts</strong> tab.
								</li>
								<li>
									Click <strong>Link Account</strong> of your
									choice.
								</li>
							</ol>
						</div>
					</div>
				)
			},
			{
				feature: 'Password Change',
				instructions: (
					<div className='space-y-2'>
						<p>
							Go to <strong>Profile</strong> (
							<span className='kbd kbd-sm'>/profile</span>), then{' '}
							<strong>Profile</strong> tab and click{' '}
							<strong>Change Password</strong>.
						</p>
						<ul className='list-disc list-inside bg-base-200/50 p-4 rounded-xl'>
							<li>Enter your current password.</li>
							<li>Enter the new password.</li>
							<li>
								(Optional) You can revoke all active sessions.
							</li>
						</ul>
					</div>
				)
			},
			{
				feature: 'Session Management',
				instructions: (
					<div className='space-y-4'>
						<p>
							You can monitor all your active sessions in{' '}
							<strong>Profile</strong> (
							<span className='kbd kbd-sm'>/profile</span>),{' '}
							<strong>Sessions</strong> tab. From here, you can:
						</p>
						<ul className='grid gap-2'>
							<li className='flex items-center gap-2 bg-base-100 p-2 rounded border border-base-200'>
								<span className='badge badge-neutral'>
									Revoke
								</span>
								Revoke individual sessions by clicking the
								button next to each session.
							</li>
							<li className='flex items-center gap-2 bg-base-100 p-2 rounded border border-base-200'>
								<span className='badge badge-neutral'>
									Sign Out
								</span>
								Revoke current session by clicking "Sign Out".
							</li>
							<li className='flex items-center gap-2 bg-base-100 p-2 rounded border border-base-200'>
								<span className='badge badge-error text-error-content'>
									Revoke All
								</span>
								Revoke <strong>all</strong> sessions at once.
							</li>
							<li className='flex items-center gap-2 bg-base-100 p-2 rounded border border-base-200'>
								<span className='badge badge-warning'>
									Revoke Others
								</span>
								Revoke all other sessions except the current
								one.
							</li>
						</ul>
					</div>
				)
			},
			{
				feature: 'UI & Text Editor Themes',
				instructions: (
					<div className='space-y-4'>
						<p>
							You can choose your preferred UI theme in the{' '}
							<strong>Theme</strong> menu in your right corner.
						</p>
						<div className='alert bg-base-200 shadow-sm text-sm'>
							<FaInfoCircle /> All themes have assigned text
							editor themes for a cohesive experience.
						</div>
					</div>
				)
			},
			{
				feature: 'Profile Privacy',
				instructions: (
					<div className='space-y-4'>
						<p>There are 2 profiles in DoggoPaste:</p>
						<div className='grid md:grid-cols-2 gap-4'>
							<div className='card bg-base-200/50 compact border border-base-300'>
								<div className='card-body'>
									<h4 className='card-title text-sm'>
										1. Public Profile
										<span className='badge badge-sm badge-ghost font-normal'>
											/u/USERNAME
										</span>
									</h4>
									<p className='text-sm'>
										Visible to everyone. Contains basic
										details and public pastes. Certain stuff
										such as folders or all pastes are
										visible only to you when logged in. Feel
										free to share your public profile link.
									</p>
								</div>
							</div>
							<div className='card bg-base-200/50 compact border border-base-300'>
								<div className='card-body'>
									<h4 className='card-title text-sm'>
										2. Private Profile
										<span className='badge badge-sm badge-ghost font-normal'>
											/profile
										</span>
									</h4>
									<p className='text-sm'>
										Visible only to you when logged in.
										Contains tabs "Profile", "Accounts",
										"Sessions". Every user has access to
										their own private profile.
									</p>
								</div>
							</div>
						</div>
					</div>
				)
			}
		]
	},
	{
		name: 'Static Pastes',
		label: 'static-pastes',
		items: [
			{
				feature: 'Creating Pastes',
				instructions: (
					<div className='space-y-4'>
						<p>
							The core feature of DoggoPaste. Quickly share code
							snippets or text.
						</p>
						<ol className='list-decimal list-inside flex flex-col gap-2 font-medium bg-base-200/50 p-4 rounded-xl'>
							<li>
								Click <strong>New Paste</strong> in the navbar.
							</li>
							<li>Paste or type your content into the editor.</li>
							<li>
								(Optional) Set a <strong>Title</strong> for
								easier identification.
							</li>
							<li>
								Configure options: <strong>Syntax</strong>,{' '}
								<strong>Expiration</strong>,{' '}
								<strong>Privacy</strong>.
							</li>
							<li>
								Click <strong>Submit</strong>.
							</li>
						</ol>
					</div>
				)
			},
			{
				feature: 'Reading Pastes',
				instructions: (
					<div className='space-y-2'>
						<p>
							You can view public pastes in{' '}
							<span className='kbd kbd-sm'>/p</span>.
						</p>
						<p>
							View individual pastes or unlisted pastes via direct
							link <span className='kbd kbd-sm'>/p/SLUG</span>{' '}
							where "SLUG" is the unique, human-readable
							identifier.
						</p>
						<div className='text-sm opacity-75 italic'>
							Private pastes are only accessible to their owners
							when logged in.
						</div>
					</div>
				)
			},
			{
				feature: 'Updating Pastes',
				instructions: (
					<div className='space-y-4'>
						<p>
							You can edit your own pastes to update their content
							or settings.
						</p>
						<ol className='list-decimal list-inside bg-base-200/50 p-4 rounded-xl space-y-1'>
							<li>
								Navigate to the paste you want to edit (must be
								owned by you).
							</li>
							<li>
								Click the <strong>Edit</strong> button in the
								paste header.
							</li>
							<li>Modify the content or settings as needed.</li>
							<li>
								Click <strong>Save Changes</strong>.
							</li>
						</ol>
					</div>
				)
			},
			{
				feature: 'Deleting Pastes',
				instructions: (
					<div className='space-y-4'>
						<p>
							You can delete any paste you own. Simply visit your
							paste and click <strong>Delete</strong> in the paste
							header, then confirm.
						</p>
						<div className='alert alert-error shadow-sm text-sm'>
							<FaInfoCircle />
							This action is permanent and removes the content
							after confirmation.
						</div>
					</div>
				)
			},
			{
				feature: 'Syntax Highlighting',
				instructions: (
					<div className='space-y-2'>
						<p>
							We support over <strong>50 syntaxes</strong>.
							Default syntax is "Plaintext" with "txt" file
							extension.
						</p>
						<p className='text-sm opacity-80'>
							You can change it in paste form while creating or
							editing a paste.
						</p>
					</div>
				)
			},
			{
				feature: 'Buttons & Actions',
				instructions: (
					<ul className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
						{[
							{
								label: 'Copy',
								desc: 'Copies the entire paste content to clipboard.'
							},
							{
								label: 'Share',
								desc: 'Copies the paste URL to clipboard for easy sharing.'
							},
							{
								label: 'Raw',
								desc: 'Opens the raw text version of the paste in a new tab.'
							},
							{
								label: 'Download',
								desc: 'Downloads the paste content as a text file.'
							},
							{
								label: 'Fork',
								desc: 'Creates a new paste with the same content for further editing.'
							},
							{
								label: 'Edit',
								desc: 'Opens the paste in edit mode (only for owners).'
							},
							{
								label: 'Delete',
								desc: 'Permanently deletes the paste (only for owners).'
							}
						].map((action) => (
							<li
								key={action.label}
								className='bg-base-200/50 p-3 rounded-lg flex flex-col gap-1'
							>
								<span className='font-bold text-primary'>
									{action.label}
								</span>
								<span className='opacity-80'>
									{action.desc}
								</span>
							</li>
						))}
					</ul>
				)
			},
			{
				feature: 'Metadata',
				instructions: (
					<div className='space-y-4'>
						<p>Every paste tracks a variety of metadata:</p>
						<div className='flex flex-wrap gap-2 text-xs'>
							{[
								'Slug',
								'Title',
								'Description',
								'Content',
								'Syntax',
								'Category',
								'Visibility',
								'Hits',
								'Created',
								'Updated',
								'Expiration',
								'Guest Paste',
								'Folder',
								'Length',
								'Password',
								'Encrypted',
								'Tags'
							].map((meta) => (
								<span
									key={meta}
									className='badge badge-outline'
								>
									{meta}
								</span>
							))}
						</div>
					</div>
				)
			},
			{
				feature: 'Anonymous Pastes',
				instructions: (
					<div className='space-y-2'>
						<p>
							You can create pastes without an account. These are
							known as <strong>guest pastes</strong>.
						</p>
						<div className='alert alert-warning py-2 text-sm shadow-sm'>
							<FaInfoCircle /> Guest pastes cannot be edited or
							deleted later.
						</div>
						<p className='text-sm'>
							If you are logged in and still wish to create an
							anonymous paste check "Paste as guest" option in
							"Anonymous" section of paste form. Anonymous pastes
							are mutually exclusive with folder assignment.
						</p>
					</div>
				)
			},
			{
				feature: 'Password-Protected Pastes',
				instructions: (
					<div className='space-y-4'>
						<p>You can secure your pastes in two ways:</p>
						<div className='grid gap-3'>
							<div className='bg-base-200/50 p-3 rounded-lg'>
								<span className='font-bold block mb-1'>
									1. Server-side password
								</span>
								Set a password in the "Password" section.
								Visitors will need to enter this password to
								view the content.
							</div>
							<div className='bg-base-200/50 p-3 rounded-lg'>
								<span className='font-bold block mb-1'>
									2. Client-side encryption
								</span>
								Enable encryption in the "Password" section. The
								content is encrypted in your browser before
								sending.
							</div>
						</div>
						<p className='text-sm opacity-80'>
							If you are confused what to choose there is a little
							button next to "Client-side encryption" checkbox
							that explains the differences.
						</p>
					</div>
				)
			},
			{
				feature: 'Sensitive Content Warning',
				instructions: (
					<div className='space-y-3'>
						<p>
							DoggoPaste checks your paste content against a list
							of sensitive keywords. If any are found, a warning
							banner will be displayed to alert viewers.
						</p>
						<div className='flex flex-wrap items-center gap-2 text-sm'>
							Sensitive words (case insensitive):
							{[
								'token',
								'password',
								'secret',
								'apikey',
								'auth'
							].map((word) => (
								<code
									key={word}
									className='bg-error/10 text-error px-1.5 py-0.5 rounded'
								>
									{word}
								</code>
							))}
						</div>
					</div>
				)
			},
			{
				feature: 'Forks',
				instructions: (
					<p>
						You can create a static paste from the current state of
						the realtime editor by clicking the{' '}
						<strong>Fork</strong> button in the editor header.
					</p>
				)
			}
		]
	},
	{
		name: 'Folders',
		label: 'folders',
		items: [
			{
				feature: 'Creating & Managing Folders',
				instructions: (
					<div className='space-y-4'>
						<p>
							Logged in user can create folders to organize their
							pastes.
						</p>
						<div className='bg-base-200/50 p-4 rounded-xl text-sm'>
							<p className='font-bold mb-2'>How to manage:</p>
							<ol className='list-decimal list-inside space-y-1 mb-4'>
								<li>
									Go to <strong>My DoggoPaste</strong> (
									<span className='kbd kbd-xs'>
										/u/USERNAME
									</span>
									).
								</li>
								<li>
									Open <strong>Your Folders</strong> tab.
								</li>
								<li>
									Click <strong>Manage Folders</strong> (or
									visit{' '}
									<span className='kbd kbd-xs'>
										/u/USERNAME/folders
									</span>
									).
								</li>
								<li>
									Here you can create, rename or delete
									folders.
								</li>
							</ol>
							<p>
								To assign a paste to a folder, use the "Folders"
								section in the paste form (you can also create
								new ones there).
							</p>
						</div>
					</div>
				)
			},
			{
				feature: 'Folder Privacy',
				instructions: (
					<div className='space-y-2'>
						<div className='flex items-center gap-2'>
							<FaInfoCircle className='text-info' />
							<span className='font-bold'>
								Your folders are visible only to you.
							</span>
						</div>
						<p className='text-sm opacity-80'>
							Feel free to share links to them; only you can
							access them when logged in.
						</p>
					</div>
				)
			}
		]
	},
	{
		name: 'Realtime Editors',
		label: 'realtime-editors',
		items: [
			{
				feature: 'Creating Realtime Pastes',
				instructions: (
					<div className='space-y-4'>
						<p className='font-medium'>
							Need to pair program? Use our Realtime Editor.
						</p>
						<ul className='list-disc list-inside bg-base-200/50 p-4 rounded-xl space-y-2'>
							<li>
								Click <strong>New Realtime Editor</strong> in
								the Realtime Editors page (
								<span className='kbd kbd-sm'>/realtime</span>).
							</li>
							<li>
								Or visit{' '}
								<span className='kbd kbd-sm'>/r/SLUG</span>{' '}
								directly to create a new session with that
								identifier.
							</li>
						</ul>
					</div>
				)
			},
			{
				feature: 'Using the Realtime Editor',
				instructions: (
					<div className='space-y-2'>
						<p>
							Share the URL with your friends or colleagues.
							Anyone with the link can join and edit.
						</p>
						<div className='alert bg-base-200 shadow-sm py-2 px-4'>
							<span className='text-sm font-bold'>
								Synced via WebSockets:
							</span>
							<span className='text-sm'>
								Title, Syntax, and Content.
							</span>
						</div>
					</div>
				)
			},
			{
				feature: 'Live Cursors',
				instructions: (
					<div className='space-y-2'>
						<p>See exactly where others are typing in real-time.</p>
						<p className='text-sm opacity-80'>
							Each user gets a unique color and a cursor label
							with their name (or "Anonymous" if not logged in).
						</p>
					</div>
				)
			},
			{
				feature: 'Forks',
				instructions: (
					<p>
						You can create a static paste from the current state of
						the realtime editor by clicking the{' '}
						<strong>Fork</strong> button in the editor header.
					</p>
				)
			}
		]
	},
	{
		name: 'Admin',
		label: 'admin',
		items: [
			{
				feature: 'Becoming Admin',
				instructions: (
					<div className='alert alert-success bg-success/10 text-base-content border-success/20 shadow-sm'>
						<FaInfoCircle /> First registered user becomes admin.
					</div>
				)
			},
			{
				feature: 'Dashboard',
				instructions: (
					<div className='space-y-2'>
						<p>
							Admins have full control over system entities on
							their <strong>Dashboard</strong> page.
						</p>
						<span className='kbd kbd-sm'>/dashboard</span>
					</div>
				)
			},
			{
				feature: 'System Status',
				instructions: (
					<div className='space-y-2'>
						<p>
							Admins can visit <strong>System Status</strong> page
							for checking healthcheck of DoggoPaste.
						</p>
						<span className='kbd kbd-sm'>/status</span>
					</div>
				)
			},
			{
				feature: 'DoggoPaste API',
				instructions: (
					<div className='space-y-2'>
						<p>
							Admins can visit <strong>API Docs</strong> page for
							checking API of DoggoPaste.
						</p>
						<span className='kbd kbd-sm'>/api/docs</span>
					</div>
				)
			}
		]
	}
]

export default function GuidePage() {
	return (
		<div className='min-h-screen bg-base-200/30 pb-20'>
			<div className='container mx-auto max-w-5xl px-4 py-8 flex flex-col gap-12'>
				{/* Header / Hero Section */}
				<div className='card bg-base-100 shadow-xl border border-base-200'>
					<div className='card-body gap-6'>
						<div className='flex items-start gap-4'>
							<div className='p-3 bg-primary/10 rounded-xl text-primary'>
								<FaInfoCircle className='w-8 h-8' />
							</div>
							<div className='flex flex-col gap-2'>
								<h1 className='text-3xl font-extrabold tracking-tight'>
									DoggoPaste Guide
								</h1>
								<p className='text-lg leading-relaxed'>
									Learn how to use DoggoPaste.
								</p>
							</div>
						</div>

						{/* Navigation Pills */}
						<div className='bg-base-200/50 rounded-box p-5'>
							<h3 className='font-bold uppercase tracking-wider mb-3 ml-1 flex items-center gap-2'>
								<FaBookOpen /> Table of Contents
							</h3>
							<nav className='flex flex-wrap gap-2 w-full'>
								{guideSections.map((section) => (
									<a
										key={section.name}
										href={`#${section.label}`}
										className='btn btn-outline btn-secondary flex-auto min-w-[10rem] justify-between'
									>
										<span className='truncate'>
											{section.name}
										</span>
										<FaArrowRight className='w-4 h-4 ml-2 shrink-0' />
									</a>
								))}
							</nav>
						</div>
					</div>
				</div>

				{/* Actual Guide Sections */}
				<div className='flex flex-col gap-16'>
					{guideSections.map((section) => (
						<div
							key={section.name}
							id={section.label}
							className='scroll-mt-24 flex flex-col gap-6'
						>
							{/* Section Header */}
							<div className='flex items-center gap-4'>
								<div className='h-px flex-1 bg-base-300'></div>
								<h2 className='text-2xl font-bold text-primary flex items-center gap-2'>
									<HiHashtag className='w-5 h-5 opacity-50' />
									{section.name}
								</h2>
								<div className='h-px flex-1 bg-base-300'></div>
							</div>

							{/* Section Items Grid */}
							<div className='grid gap-6 md:grid-cols-1'>
								{section.items.map((item) => (
									<div
										key={item.feature}
										className='card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow duration-300'
									>
										<div className='card-body'>
											<h3 className='card-title text-lg border-b border-base-100 pb-2 mb-2'>
												{item.feature}
											</h3>
											<div className='prose prose-sm max-w-none'>
												{item.instructions}
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Back to top */}
							<a
								className='self-end link-primary font-semibold link mt-2 flex items-center gap-2'
								href='/guide#'
							>
								back to top
								<FaArrowUp className='w-3 h-3' />
							</a>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
