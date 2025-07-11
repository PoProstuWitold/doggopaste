import { BsFillEyeSlashFill, BsFire } from 'react-icons/bs'
import { FaFacebook, FaGithub, FaGoogle, FaUserShield } from 'react-icons/fa'
import { HiOutlineClipboardList } from 'react-icons/hi'
import { IoCopyOutline } from 'react-icons/io5'
import {
	MdAccountCircle,
	MdCategory,
	MdDashboard,
	MdDownload,
	MdEditNote,
	MdEmail,
	MdLabel,
	MdLanguage,
	MdOutlineLink,
	MdOutlineManageAccounts,
	MdPalette,
	MdPassword,
	MdPeople,
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
							<MdAccountCircle />
							User
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<MdEmail /> Credential (email & password) auth
							</li>
							<li className='flex items-center gap-2'>
								<FaGoogle /> OAuth2 with Google
							</li>
							<li className='flex items-center gap-2'>
								<FaGithub /> OAuth2 with GitHub
							</li>
							<li className='flex items-center gap-2'>
								<FaFacebook /> OAuth2 with Facebook
							</li>
							<li className='flex items-center gap-2'>
								<MdOutlineLink /> Linking & unlinking social
								accounts
							</li>
							<li className='flex items-center gap-2'>
								<MdPassword /> Password change with logout-all
							</li>
							<li className='flex items-center gap-2'>
								<MdSecurity /> Session management
							</li>
							<li className='flex items-center gap-2'>
								<MdOutlineManageAccounts /> Profile management
							</li>
							<li className='flex items-center gap-2'>
								<MdPalette /> UI themes
							</li>
							<li className='flex items-center gap-2'>
								<FaUserShield /> Roles (user, admin)
							</li>
						</ul>
					</div>
				</details>

				{/* PASTES */}
				<details className='collapse bg-base-100 border border-base-300 collapse-arrow'>
					<summary className='collapse-title font-semibold text-xl flex items-center gap-2'>
						<div className='flex items-center gap-2'>
							<MdEditNote />
							Pastes
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<MdDashboard /> CRUD for logged in, CR for
								guests
							</li>
							<li className='flex items-center gap-2'>
								<MdLabel /> Tags
							</li>
							<li className='flex items-center gap-2'>
								<MdCategory /> Categories
							</li>
							<li className='flex items-center gap-2'>
								<BsFire /> Burn after read
							</li>
							<li className='flex items-center gap-2'>
								<MdTimer /> Expiration after a period
							</li>
							<li className='flex items-center gap-2'>
								<BsFillEyeSlashFill /> Sensitive content warning
							</li>
							<li className='flex items-center gap-2'>
								<MdDownload /> Download with correct extension
							</li>
							<li className='flex items-center gap-2'>
								<HiOutlineClipboardList /> Raw view
							</li>
							<li className='flex items-center gap-2'>
								<IoCopyOutline /> Copy to clipboard
							</li>
							<li className='flex items-center gap-2'>
								<PiPuzzlePieceFill /> Memorable slugs (e.g.
								"everybody-cold")
							</li>
							<li className='flex items-center gap-2'>
								<MdLanguage /> Syntax highlight (50+ langs, 10
								themes)
							</li>
							<li className='flex items-center gap-2'>
								<MdPublic /> Public feed with pagination
							</li>
						</ul>
					</div>
				</details>

				{/* REALTIME */}
				<details className='collapse bg-base-100 border border-base-300 collapse-arrow'>
					<summary className='collapse-title font-semibold text-xl flex items-center gap-2'>
						<div className='flex items-center gap-2'>
							<MdPeople />
							Realtime Editors
						</div>
					</summary>
					<div className='collapse-content text-sm text-base-content/80'>
						<ul className='grid gap-2 list-none'>
							<li className='flex items-center gap-2'>
								<RiTeamLine /> Real-time code collaboration
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
								Caddy
							</li>
						</ul>
					</div>
				</details>
			</div>
		</section>
	)
}
