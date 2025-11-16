<a id="top"></a>

# DoggoPaste

## ***"Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable."***

DoggoPaste project monorepo.

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary><h2>Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#features">Features</a>
      <ul>
        <li><a href="#users">Users</a></li>
        <li><a href="#static-pastes">Static Pastes</a></li>
        <li><a href="#realtime-editors">Realtime Editors</a></li>
        <li><a href="#other">Other</a></li>
      </ul>
    </li>
    <li>
      <a href="#description--architecture">Description & Architecture</a>
    </li>
    <li>
      <a href="#scripts">Scripts</a>
      <ul>
        <li><a href="#global-monorepo-scripts">Global monorepo scripts</a></li>
        <li><a href="#app-specific-scripts">App-specific scripts</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#deployment">Deployment</a></li>
        <li><a href="#production">Production</a></li>
        <li><a href="#development">Development</a></li>
      </ul>
    </li>
    <li>
      <a href="#tech-stack">Tech Stack</a>
    </li>
    <li>
      <a href="#documentation">Documentation</a>
    </li>
    <li>
      <a href="#tests">Tests</a>
    </li>
    <li>
      <a href="#authors">Authors</a>
    </li>
    <li>
      <a href="#license">License</a>
    </li>
  </ol>
</details>

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

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Description & Architecture

***DoggoPaste*** is an app that combines features known from Pastebin.com and Codeshare.io into one, FOSS app with modern UI and easy deployment.

The following section provides an overview of each element of the root project structure.

```bash
.
├── apps/                      # Applications in the monorepo
│   ├── api/                   # Backend REST API and WebSockets server built with Hono.js
│   ├── proxy/                 # Entry point running "web" and "api" as child processes on a single port
│   └── web/                   # Frontend app built with Next.js
├── biome.json                 # Biome config for formatting and linting
├── docker-compose.dev.yaml    # Docker config for development environment (only database)
├── docker-compose.prod.yaml   # Docker config for production deployment (entire standalone project)
├── docker-compose.test.yaml   # Docker config for tests
├── package.json               # Root dependencies and scripts
├── pnpm-lock.yaml             # Lockfile for reproducible installs
├── pnpm-workspace.yaml        # Workspace config
└── turbo.json                 # Turborepo config
```

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Scripts

### Global monorepo scripts

Run from within the root app directory, e.g. **``doggopaste``**, using **``turbo run <command>``**:

  - **`build`** – builds all applications for production
  - **`dev --filter=proxy`** – runs all applications in development mode with hot reload on a single port via the proxy
  - **`start --filter=proxy`** – starts all built applications on a single port via the proxy
  - **`check-types`** – performs a full type-safety check across the project
  - **`ncu`** – checks for dependency updates using [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)
  - **`ncu-u`** – applies available dependency updates
  - **`check`** – analyzes the codebase for potential issues using [Biome](https://biomejs.dev/)
  - **`check:fix`** – automatically fixes issues reported by Biome

### App-specific scripts

Run from within the app directory, e.g. **``doggopaste/apps/api``**, using **``pnpm run <command>``**:

  - **`apps/api`**
    - **`db:push`** – synchronizes the database schema *(development use only)*
    - **`db:generate`** – generates a new migration based on the current schema changes
    - **`db:migrate`** – applies pending migrations to the database
    - **`docs`** – generates OpenAPI documentation based on the project's route definitions
    - **`test`** – executes the complete test suite
    - **`test:watch`** – runs the test suite in watch mode with automatic reload

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Usage

### Deployment

```yaml
services:
  doggopaste:
    container_name: doggopaste
    image: poprostuwitold/doggopaste:latest
    environment:
      APP_NAME: "DoggoPaste"
      APP_URL: "https://doggopaste.example.com"
      APP_LAN: ""
      DATABASE_URL: ""
      BETTER_AUTH_SECRET: ""
      GITHUB_CLIENT_ID: ""
      GITHUB_CLIENT_SECRET: ""
    ports:
      - 3002:3002
    restart: unless-stopped
    depends_on:
      - doggopaste_db
    networks:
      - doggopaste_network
      - caddy

  doggopaste_db:
    image: postgres:17
    container_name: doggopaste_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: doggo
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: doggopaste
    volumes:
      - /srv/server/services/doggopaste/db:/var/lib/postgresql/data
    networks:
      - doggopaste_network

networks:
  doggopaste_network:
    driver: bridge
  caddy:
    name: caddy
    external: true
```

### Production

Set environmental variables in ``docker-compose.prod.yaml`` and then launch it:

### Development

1. Install dependencies with ``pnpm``
```bash
pnpm install
```

2. Launch development database with docker
```bash
docker compose -f docker-compose.dev.yaml up
```

3. Create ``.env`` file in ``apps/api`` and run migrations
```ini
DATABASE_URL="postgresql://doggo:changeme@localhost:5432/doggopaste"
```

```bash
cd apps/api && pnpm run db:push
```

4. Create ``.env`` file in ``apps/proxy``

> [!TIP]
> You can generate ``BETTER_AUTH_SECRET`` with Node.js like this: 
> ``node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"``



```ini
APP_NAME="DoggoPaste"
APP_URL="http://localhost:3002"
APP_LAN="http://192.168.x.x:3002" # replace with your LAN IP
DATABASE_URL="postgresql://doggo:changeme@localhost:5432/doggopaste"
BETTER_AUTH_SECRET="" 
```

5a. Launch app in ``development`` mode
```bash
cd apps/proxy
```

```bash
turbo run dev --filter=proxy
```

OR

5b. Launch app in ``production`` mode

In main *DoggoPaste* directory:
```
turbo run build
```

In ``apps/proxy``:
```bash
turbo run start --filter=proxy
```

6. Visit ``http://localhost:3002``

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Tech Stack:
- **[Turborepo](https://turbo.build/repo/docs)** as monorepo solution
- **[Hono](https://hono.dev/)** as API and WebSockets backend framework
- **[Next.js](https://nextjs.org/)** as frontend framework
- **[PostgreSQL](https://www.postgresql.org/)** with **[Drizzle ORM](https://orm.drizzle.team/)** as database
- **[Socket.IO](https://socket.io/)** for realtime communication
- **[Better Auth](https://www.better-auth.com/)** for auth
- **[Headless UI](https://headlessui.com/)** as components
- **[TailwindCSS](https://tailwindcss.com/)** and **[DaisyUI](https://daisyui.com/)** for styling

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Documentation

Documentation for all REST API routes is available at ``/api/docs``.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Tests

Tests are in ``apps/api/__tests__``.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Authors

- [@PoProstuWitold](https://github.com/PoProstuWitold)
- [@Netr0n07](https://github.com/Netr0n07)

<p align="right">(<a href="#top">back to top</a>)</p>

---

## License

[MIT](https://choosealicense.com/licenses/mit/)

<p align="right">(<a href="#top">back to top</a>)</p>
