# DoggoPaste

## ***"Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable."***

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
- Other:
    - Easy deployment with Docker and Caddy (WIP)

## Usage

### Production

Set environmental variables in ``docker-compose.prod.yaml`` and then launch it:

```bash
docker compose -f docker-compose.prod.yaml up
```

### Development
- Global monorepo scripts (``turbo run <command>``)
    - **``dev --filter=proxy``** - runs all apps in development mode with hot-reload on single port using proxy
    - **``build``** - builds all apps for production
    - **``start --filter=proxy``** - runs all built apps on single port using proxy
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