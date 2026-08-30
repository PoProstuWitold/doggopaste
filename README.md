<a id="top"></a>

# DoggoPaste

## ***"Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable."***

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-monorepo-3178C6?logo=typescript&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white">
  <img alt="Hono" src="https://img.shields.io/badge/Hono-REST_API-E36002?logo=hono&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white">
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socketdotio&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-150_passing-brightgreen">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green">
</p>

DoggoPaste is a modern FOSS platform for sharing code and text. It combines durable static pastes with lightweight realtime collaboration in one selfhostable TypeScript monorepo.

The project is also an engineering showcase: a Next.js frontend, Hono REST API, Socket.IO collaboration, PostgreSQL transactions and constraints, Drizzle ORM, Better Auth, browser-side encryption, OpenAPI, and integration tests against a real database.

> [!TIP]
> A small private instance is best deployed as one DoggoPaste application behind Caddy, with PostgreSQL kept on a private Docker network.

---

<details>
  <summary><h2>Table of Contents</h2></summary>
  <ol>
    <li><a href="#why-doggopaste">Why DoggoPaste?</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#tech-stack">Tech stack</a></li>
    <li><a href="#local-development">Local development</a></li>
    <li><a href="#selfhosting-with-caddy">Selfhosting</a></li>
    <li><a href="#tests">Tests</a></li>
    <li><a href="#api-and-operations">API and operations</a></li>
    <li><a href="#known-limitations">Known limitations</a></li>
    <li><a href="#authors">Authors</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

## Why DoggoPaste?

DoggoPaste combines two workflows in one application:

- **Static Pastes** for durable, access-controlled code and text sharing,
- **Realtime Editors** for quick public collaboration through a shared slug.

From a portfolio perspective, the project demonstrates more than a typical CRUD application:

| Area | What the project demonstrates |
|---|---|
| Backend | Hono REST API, middleware, authorization policies, explicit DTOs and OpenAPI |
| Data | PostgreSQL constraints, transactions, migrations, locking and compare-and-swap persistence |
| Realtime | Socket.IO rooms, delta batching, presence, heartbeats, rate limits and reconnect handling |
| Security | Private-as-404 reads, Argon2, AES-GCM, payload limits and atomic burn-after-read |
| Frontend | Next.js App Router, CodeMirror 6, responsive UI, Markdown preview and multiple themes |
| Testing | Unit, contract, migration, security-regression and real-PostgreSQL integration tests |
| Selfhosting | Single-origin proxy, Docker-oriented runtime, health endpoint and Caddy deployment model |

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Features

### Users and administration

- Email and password authentication.
- Optional OAuth with Github, Facebook and Google.
- Account, password, profile and session management.
- Individual session revocation.
- `user` and `admin` roles.
- Responsive administrative dashboard.
- Light, dark and OLED-oriented themes.

### Static pastes

- Authenticated CRUD and anonymous creation.
- Public, unlisted and owner-only private visibility.
- Folders, nested folders, tags, categories and syntax highlighting.
- Password protection and browser-side encryption.
- Expiration and burn-after-read.
- Raw, download, copy and fork workflows.
- Markdown preview with sanitization.

### Realtime editors

- Public collaborative CodeMirror editing.
- Live content, title and syntax updates.
- Remote cursors, selections and participant presence.
- Low-latency in-memory fan-out with periodic PostgreSQL snapshots.
- Revision/CAS persistence and room isolation.

### Interface and developer experience

- Responsive landing page, profiles, guide, FAQ and dashboard.
- Collapsible paste options and Markdown Editor/Preview/Split modes.
- One browser-facing origin for web, REST, Socket.IO and HMR.
- Interactive OpenAPI documentation.
- Health endpoint with PostgreSQL connectivity information.

> [!INFO]
> Detailed user-facing explanations of paste visibility, encryption, burn-after-read and realtime behavior are available inside the application through its Guide and FAQ pages.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Architecture

```mermaid
flowchart LR
    Browser[Browser]
    Caddy[Caddy / HTTPS]
    Proxy[DoggoPaste proxy<br/>:3002]
    Web[Next.js web<br/>:3000]
    API[Hono API + Socket.IO<br/>:3001]
    DB[(PostgreSQL)]

    Browser -->|HTTPS| Caddy
    Caddy --> Proxy
    Proxy -->|pages, assets and HMR| Web
    Proxy -->|/api and /ws| API
    API -->|Drizzle ORM| DB
```

The monorepo contains three runtime workspaces:

```text
.
├── apps/
│   ├── api/                  # Hono REST, Socket.IO, Better Auth and Drizzle
│   ├── proxy/                # Combined entry point on port 3002
│   └── web/                  # Next.js App Router frontend
├── docker-compose.dev.yaml   # Development PostgreSQL
├── docker-compose.test.yaml  # Isolated test PostgreSQL
├── docker-compose.prod.yaml  # Reference artifact; see deployment warning
├── biome.json
├── pnpm-workspace.yaml
└── turbo.json
```

- `apps/web` owns pages, UI, CodeMirror, browser cryptography and frontend DTOs.
- `apps/api` owns REST routes, auth, authorization, Socket.IO, transactions and persistence.
- `apps/proxy` starts the web/API processes and exposes one application origin.

The proxy manually separates Next.js HMR from Socket.IO upgrades and forwards each connection exactly once.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Tech stack

- **[Turborepo](https://turbo.build/repo/docs)** and **pnpm workspaces**
- **[Next.js](https://nextjs.org/)** App Router and **React**
- **[Hono](https://hono.dev/)** REST API
- **[Socket.IO](https://socket.io/)** realtime transport
- **[PostgreSQL](https://www.postgresql.org/)** and **[Drizzle ORM](https://orm.drizzle.team/)**
- **[Better Auth](https://www.better-auth.com/)**
- **[CodeMirror](https://codemirror.net/)**
- **[Tailwind CSS](https://tailwindcss.com/)**, **[DaisyUI](https://daisyui.com/)** and **[Headless UI](https://headlessui.com/)**
- **Zod**, **Argon2**, **Web Crypto**, **Biome** and **OpenAPI**

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Local development

### Requirements

- Node.js `>=24`
- pnpm
- PostgreSQL 17, or Docker with Compose

### 1. Install dependencies

```bash
corepack enable
pnpm install --frozen-lockfile
```

### 2. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yaml up -d
```

### 3. Create `apps/proxy/.env`

```dotenv
APP_NAME=DoggoPaste
APP_URL=http://localhost:3002
DATABASE_URL=postgresql://doggo:replace-this-password@localhost:5432/doggopaste
BETTER_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters

# Optional - configure both or neither.
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# Optional for intentional cross-subdomain cookies.
# COOKIE_DOMAIN=.example.com
```

> [!TIP]
> Generate a Better Auth secret with:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
> ```

### 4. Start DoggoPaste

```bash
turbo run dev --filter=proxy
```

Open <http://localhost:3002>.

| Port | Service | Exposure |
|---:|---|---|
| `3000` | Next.js web | Internal upstream |
| `3001` | Hono API and Socket.IO | Internal upstream |
| `3002` | Combined DoggoPaste proxy | Browser or Caddy upstream |
| `5432` | Development PostgreSQL | Development only |
| `5433` | Test PostgreSQL | Loopback only |

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Selfhosting

A small selfhosted deployment can use:

```text
Internet
   │
   ▼
Caddy :80/:443
   │
   ▼
DoggoPaste :3002
   │
   ▼
PostgreSQL :5432
private network only
```

### Caddyfile

```caddyfile
doggopaste.example.com {
    reverse_proxy doggopaste:3002
}
```

Caddy handles HTTPS and forwards normal HTTP, Socket.IO polling and WebSocket upgrades through the same origin.

> [!IMPORTANT]
> Expose only Caddy publicly. Keep PostgreSQL and DoggoPaste's internal ports private to Docker networks or the host firewall.



Before making an instance public:

- keep a single API instance unless shared realtime coordination is added,
- add upstream abuse controls for anonymous creation and connections,
- replace first-user admin bootstrap with a controlled mechanism,
- configure backups and data retention,
- verify graceful shutdown and recovery.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Scripts

Run monorepo tasks from the repository root:

| Command | Purpose |
|---|---|
| `turbo run dev --filter=proxy` | Start web, API and proxy in development mode |
| `turbo run build` | Build all workspaces |
| `turbo run start --filter=proxy` | Start the built runtime |
| `turbo run check` | Run Biome checks |
| `turbo run typecheck` | Run TypeScript checks |
| `turbo run test` | Run automated tests |
| `turbo run docs --filter=api` | Regenerate OpenAPI JSON |

Database operations are API workspace scripts:

```bash
pnpm --dir apps/api db:push       # development only
pnpm --dir apps/api db:generate   # generate a migration
pnpm --dir apps/api db:migrate    # apply committed migrations
```

> [!IMPORTANT]
> Use `db:push` only for development. Review and apply committed migrations for deployments.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Tests

```bash
docker compose -f docker-compose.test.yaml up -d
turbo run test
docker compose -f docker-compose.test.yaml stop doggopaste_db_test
```

The current suite contains **150 tests** across:

- unit and schema validation,
- OpenAPI and DTO contracts,
- fresh-database migrations,
- authorization and security regressions,
- PostgreSQL transactions and constraints,
- atomic burn-after-read races,
- Socket.IO room isolation, ordering and rate limiting,
- revision/CAS conflicts and blocked-database scenarios.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## API and operations

- Interactive API documentation: `/api/docs`
- OpenAPI JSON: `/api/openapi`
- Generated document: `apps/api/openapi/openapi.json`
- Health endpoint: `GET /api/health`

The health endpoint verifies PostgreSQL connectivity and returns `200` or `503`.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Known limitations

<details>
  <summary><strong>Production and product limitations</strong></summary>

- Realtime rooms are public to everyone who knows the slug.
- Realtime consistency currently assumes one API instance.
- Revision/CAS is not OT or CRDT and does not semantically merge overlapping edits.
- Abrupt disconnects or delayed conflict handling can still lose provisional realtime changes.
- Realtime raw, download and fork can lag behind the current editor until persistence completes.
- Anonymous creation needs deployment-wide abuse controls before public exposure.
- Human-readable slugs must not be treated as high-entropy secrets.
- CSE combined with burn-after-read does not yet provide a strict one-read guarantee.
- Expired records are hidden but are not automatically purged.
- First-admin bootstrap, graceful shutdown, database timeouts, metrics and production Docker hardening remain open work.
- Frontend and full E2E behavior are not automatically tested.

</details>

> [!NOTE]
> These limitations are documented deliberately. DoggoPaste is intended to be an honest engineering portfolio project and a practical selfhosting codebase, not a black-box claim of unlimited production readiness.

<p align="right">(<a href="#top">back to top</a>)</p>

---

## Contributing and reporting issues

Use the [GitHub issue tracker](https://github.com/PoProstuWitold/doggopaste/issues) for reproducible bugs and feature discussions.

Do not publish credentials, session tokens, private paste links or other secrets in a public issue.

---

## Authors

- [Witold Zawada (@PoProstuWitold)](https://github.com/PoProstuWitold)
- [Wiktor Wypyszyński (@Netr0n07)](https://github.com/Netr0n07)

<p align="right">(<a href="#top">back to top</a>)</p>

---

## License

DoggoPaste is licensed under the [MIT License](LICENSE).

Copyright (c) 2025-2026 Witold Zawada (PoProstuWitold) and Wiktor Wypyszyński (Netr0n07).

<p align="right">(<a href="#top">back to top</a>)</p>
