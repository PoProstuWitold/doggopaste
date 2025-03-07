# DoggoPaste

## ***"Drop your code, let Doggo fetch it!"***

DoggoPaste project monorepo.

## Usage

- Global monorepo scripts (``turbo run <command>``)
    - **``dev``** - runs all apps in development mode with hot-reload
    - **``build``** - builds all apps for production
    - **``start``** - runs all built apps
    - **``check-types``** - check types
    - **``ncu-u``**: updates *``package.json``* dependencies with ***[NPM Check Update](https://www.npmjs.com/package/npm-check-updates)*** and then installs them
    - **``check``** - show potential problems with code using ***[Biome](https://biomejs.dev/)***
    - **``check:fix``** - applies said fixes
- App specific scripts (you have to be in app katalog (e.g. ``doggopaste/apps/api``) and then use ``pnpm run <command>``)
    - **``apps/api``**
        - **``db:push``** - synchronizes database (FOR DEVELOPMENT PURPOSES ONLY!)
        - **``db:generate``** - generates migration
        - **``db:migrate``** - pushes migration
    - **``apps/web``**
        - **``analyze``** - shows analytics for Next.js web app