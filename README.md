# DoggoPaste

## ***"Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable."***

DoggoPaste project monorepo. For complete documentation visit route **`/api/docs`** on proxy URL (default: `http://localhost:3002`).

---

## Features
### Users
- Credential (email & password) auth
- OAuth2 authentication with the following providers: Google, GitHub, Facebook
- Account linking and unlinking with social providers
- Password change with the option to log out from all active sessions
- Session management
- Profile management
- UI theme selection
- Role-based access control (user, admin) with admin dashboard
### Static Pastes
- Full CRUD for authenticated users, and CR access for guests
- Folders for static pastes
- Tags and categories
- Burn after read
- Expiration after a specified period (e.g., 2 weeks)
- Sensitive content warnings
- Download with correct file extensions and name sanitization
- Raw view mode
- One-click copy to clipboard
- Auto-generated human-readable slugs (e.g., "everybody-cold")
- Syntax highlighting for over 50 languages, with 10 editor themes
- Public paste feed with pagination
- Anonymous static pastes
### Realtime Editors
- Realtime collaborative code editing
- Live cursors showing participants' positions
### Other
- Easy deployment with Docker & reverse proxy (e.g., Caddy)
- System status & version monitoring
- Guide & FAQ pages for easy entry to DoggoPaste

---

## Usage

### Production

Set environmental variables in ``docker-compose.prod.yaml`` and then launch it:

```bash
docker compose -f docker-compose.prod.yaml up
```

### Development & Core Project Components
Below is a breakdown of the key elements in the project structure relevant for development:
```bash
.
├── apps/                      # Applications in the monorepo
│   ├── api/                   # Backend REST API and WebSockets server built with Hono.js
│   ├── proxy/                 # Entry point running "web" and "api" as child processes on a single port
│   └── web/                   # Frontend app built with Next.js
├── biome.json                 # Biome config for formatting and linting
├── docker-compose.dev.yaml    # Docker config for development environment (only database)
├── docker-compose.prod.yaml   # Docker config for production deployment (entire standalone project)
├── package.json               # Root dependencies and scripts
├── pnpm-lock.yaml             # Lockfile for reproducible installs
├── pnpm-workspace.yaml        # Workspace config
└── turbo.json                 # Turborepo config
```

1. Create `.env` file in `apps/api` (needed for migrations to run):

```ini
DATABASE_URL="postgresql://doggo:changeme@localhost:5432/doggopaste"
```

2. Create `.env` file in `apps/proxy`:

You can generate ``BETTER_AUTH_SECRET`` with Node.js like this: 

``node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"``

```ini
# API
APP_NAME="DoggoPaste"
APP_URL="http://localhost:3002"
APP_LAN="http://192.168.x.x:3002" # replace with your LAN IP
DATABASE_URL="postgresql://doggo:changeme@localhost:5432/doggopaste"
BETTER_AUTH_SECRET="super_secret_doggo" 

GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

3. Install dependencies with ``pnpm install`` and run ``turbo run dev --filter=proxy`` to run app on ``http://localhost:3002``

- Global monorepo scripts (``turbo run <command>``)
    - **``dev --filter=proxy``** - runs all apps in development mode with hot-reload on single port using proxy
    - **``build``** - builds all apps for production
    - **``start --filter=proxy``** - runs all built apps on single port using proxy
    - **``check-types``** - check types
    - **``ncu-u``**: updates *``package.json``* dependencies with ***[NPM Check Update](https://www.npmjs.com/package/npm-check-updates)*** and then installs them
    - **``ncu``**: checks for updates with ***[NPM Check Update](https://www.npmjs.com/package/npm-check-updates)***
    - **``check``** - show potential problems with code using ***[Biome](https://biomejs.dev/)***
    - **``check:fix``** - applies said fixes
- App specific scripts (you have to be in app catalog (e.g. ``doggopaste/apps/api``) and then use ``pnpm run <command>``)
    - **``apps/api``**
        - **``db:push``** - synchronizes database (FOR DEVELOPMENT PURPOSES ONLY!)
        - **``db:generate``** - generates migration
        - **``db:migrate``** - pushes migration
    - **``apps/web``**
        - **``analyze``** - shows analytics for Next.js web app

---

## Tech stack:
- [Turborepo](https://turbo.build/repo/docs) as monorepo solution
- [Hono](https://hono.dev/) as API and WebSockets backend framework
- [Next.js](https://nextjs.org/) as frontend framework
- [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) as database
- [Socket.IO](https://socket.io/) for realtime communication
- [Better Auth](https://www.better-auth.com/) for auth
- [Headless UI](https://headlessui.com/) as components
- [TailwindCSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/) for styling