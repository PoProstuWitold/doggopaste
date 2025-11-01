import { BsCursorFill, BsFillEyeSlashFill, BsFire } from 'react-icons/bs'
import {
	FaBolt,
	FaDog,
	FaFileCode,
	FaFolder,
	FaKey,
	FaUserAlt,
	FaUserSecret,
	FaUserShield
} from 'react-icons/fa'
import { HiOutlineClipboardList } from 'react-icons/hi'
import { IoCopyOutline } from 'react-icons/io5'
import {
	MdDashboard,
	MdDownload,
	MdEmail,
	MdHealthAndSafety,
	MdLabel,
	MdLanguage,
	MdOutlineLink,
	MdOutlineManageAccounts,
	MdPalette,
	MdPassword,
	MdPublic,
	MdSecurity,
	MdTimer
} from 'react-icons/md'
import { PiPuzzlePieceFill } from 'react-icons/pi'
import { RiTeamLine } from 'react-icons/ri'
import { TbBrandDocker, TbCode } from 'react-icons/tb'

export function FeatureSection() {
	return (
		<section className='w-full px-4'>
			<h2 className='text-3xl font-bold text-center mb-6 divider'>
				Features
			</h2>

			<div className='grid gap-4'>
				{/* USER */}
				<details className='collapse bg-base-100 border border-base-300 collapse-arrow'>
					<summary className='collapse-title font-semibold text-xl flex items-center gap-2'>
						<div className='flex items-center gap-2'>
							<FaUserAlt />
							Users
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<MdEmail /> Credential (email & password) auth
							</li>
							<li className='flex items-center gap-2'>
								<FaKey /> OAuth2 authentication with the
								following providers: Google, GitHub, Facebook
							</li>
							<li className='flex items-center gap-2'>
								<MdOutlineLink /> Account linking and unlinking
								with social providers
							</li>
							<li className='flex items-center gap-2'>
								<MdPassword /> Password change with the option
								to log out from all active sessions
							</li>
							<li className='flex items-center gap-2'>
								<MdSecurity /> Session management
							</li>
							<li className='flex items-center gap-2'>
								<MdOutlineManageAccounts /> Profile management
							</li>
							<li className='flex items-center gap-2'>
								<MdPalette /> UI theme selection
							</li>
							<li className='flex items-center gap-2'>
								<FaUserShield /> Role-based access control
								(user, admin) with admin dashboard
							</li>
						</ul>
					</div>
				</details>

				{/* PASTES */}
				<details className='collapse bg-base-100 border border-base-300 collapse-arrow'>
					<summary className='collapse-title font-semibold text-xl flex items-center gap-2'>
						<div className='flex items-center gap-2'>
							<FaFileCode />
							Static Pastes
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<MdDashboard /> Full CRUD for authenticated
								users, and CR access for guests
							</li>
							<li className='flex items-center gap-2'>
								<FaFolder /> Folders for static pastes
							</li>
							<li className='flex items-center gap-2'>
								<MdLabel /> Tags and categories
							</li>
							<li className='flex items-center gap-2'>
								<BsFire /> Burn after read
							</li>
							<li className='flex items-center gap-2'>
								<MdTimer /> Expiration after a specified period
								(e.g., 2 weeks)
							</li>
							<li className='flex items-center gap-2'>
								<BsFillEyeSlashFill /> Sensitive content
								warnings
							</li>
							<li className='flex items-center gap-2'>
								<MdDownload /> Download with correct file
								extensions and name sanitization
							</li>
							<li className='flex items-center gap-2'>
								<HiOutlineClipboardList /> Raw view mode
							</li>
							<li className='flex items-center gap-2'>
								<IoCopyOutline /> One-click copy to clipboard
							</li>
							<li className='flex items-center gap-2'>
								<PiPuzzlePieceFill /> Auto-generated
								human-readable slugs (e.g., "everybody-cold")
							</li>
							<li className='flex items-center gap-2'>
								<MdLanguage /> Syntax highlighting for over 50
								languages, with 10 editor themes
							</li>
							<li className='flex items-center gap-2'>
								<MdPublic /> Public paste feed with pagination
							</li>
							<li className='flex items-center gap-2'>
								<FaUserSecret /> Anonymous static pastes
							</li>
						</ul>
					</div>
				</details>

				{/* REALTIME */}
				<details className='collapse bg-base-100 border border-base-300 collapse-arrow'>
					<summary className='collapse-title font-semibold text-xl flex items-center gap-2'>
						<div className='flex items-center gap-2'>
							<FaBolt />
							Realtime Editors
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<RiTeamLine /> Realtime collaborative code
								editing
							</li>
							<li className='flex items-center gap-2'>
								<BsCursorFill /> Live cursors showing
								participants' positions
							</li>
						</ul>
					</div>
				</details>

				{/* OTHER */}
				<details className='collapse bg-base-100 border border-base-300 collapse-arrow'>
					<summary className='collapse-title font-semibold text-xl flex items-center gap-2'>
						<div className='flex items-center gap-2'>
							<TbCode />
							Other
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<TbBrandDocker /> Easy deployment with Docker &
								reverse proxy (e.g., Caddy)
							</li>
							<li className='flex items-center gap-2'>
								<MdHealthAndSafety /> System status & version
								monitoring
							</li>
							<li className='flex items-center gap-2'>
								<FaDog /> Guide & FAQ pages for easy entry to
								DoggoPaste
							</li>
						</ul>
					</div>
				</details>
			</div>
		</section>
	)
}
