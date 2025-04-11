# DoggoPaste

## ***"Drop your code, let Doggo fetch it!"***

DoggoPaste project monorepo.

## Documentation
For complete documentation visit route **`http://localhost:3001/api/docs`**.

## Features
- User:
    - Credential (email & password) auth,
    - OAuth2 auth with following social providers: Google, Github, Facebook,
    - Linking and unlinking accounts with social providers,
    - Password change with ability to logout from all sessions,
    - Session managment,
    - Profile managment,
    - UI themes,
    - Roles (user, admin)
- Pastes:
    - CRUD for logged in users and CR for guest users,
    - Tags,
    - Categories,
    - Burn after read,
    - Expiration after specified period (e.g., 2 weeks),
    - Sensitive content warning,
    - Download with correct extension,
    - Raw view,
    - Copy to clipboard,
    - Auto generated memorable slugs (e.g., "everybody-cold"),
    - Syntax highlighting for over 50 languages with 10 different editor themes,
    - Public pastes feed with pagination
- Realtime pastes/collab editors:
    - Real-time code collaboration

## Usage

### Enviromental variables

Create ``.env`` in ``apps/api`` with following content:
```ini
# App
APP_NAME="DoggoPaste"
NEXT_WEB_URL="http://localhost:3000"
HONO_API_URL="http://localhost:3001"

# Database (matches docker-compose.dev.yaml)
DATABASE_URL="postgresql://doggo:changeme@localhost:5432/doggopaste"

# Better Auth
BETTER_AUTH_SECRET="super_secret_doggo" # replace with output of "openssl rand -base64 32"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

Create ``.env.local`` in ``apps/web`` with following content:
```ini
# URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_HONO_API_URL="http://localhost:3001"
INTERNAL_HONO_API_URL="http://localhost:3001" # for server-side requests; different in Docker than NEXT_PUBLIC_*
```

- Global monorepo scripts (``turbo run <command>``)
    - **``dev``** - runs all apps in development mode with hot-reload
    - **``build``** - builds all apps for production
    - **``start``** - runs all built apps
    - **``check-types``** - check types
    - **``ncu-u``**: updates *``package.json``* dependencies with ***[NPM Check Update](https://www.npmjs.com/package/npm-check-updates)*** and then installs them
    - **``ncu``**: checks for updates with ***[NPM Check Update](https://www.npmjs.com/package/npm-check-updates)***
    - **``check``** - show potential problems with code using ***[Biome](https://biomejs.dev/)***
    - **``check:fix``** - applies said fixes
- App specific scripts (you have to be in app katalog (e.g. ``doggopaste/apps/api``) and then use ``pnpm run <command>``)
    - **``apps/api``**
        - **``db:push``** - synchronizes database (FOR DEVELOPMENT PURPOSES ONLY!)
        - **``db:generate``** - generates migration
        - **``db:migrate``** - pushes migration
    - **``apps/web``**
        - **``analyze``** - shows analytics for Next.js web app

## Tech stack:
- [Turborepo](https://turbo.build/repo/docs) as monorepo solution,
- [Hono](https://hono.dev/) as API and WebSockets backend framework,
- [Next.js](https://nextjs.org/) as frontend framework,
- [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) as database,
- [Better Auth](https://www.better-auth.com/) for auth,
- [Headless UI](https://headlessui.com/) as components,
- [TailwindCSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/) for styling