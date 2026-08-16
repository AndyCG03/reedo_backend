# Reading Platform API

Backend for a **reading application**. Built with [NestJS](https://nestjs.com), PostgreSQL and TypeScript, following **Vertical Slice Architecture**, **CQRS** and **TDD**, with **Scalar** providing the interactive API documentation and testing playground.

> This is the initial skeleton. It ships with one vertical slice — **User Profile** — as a working reference of the conventions used across the whole codebase.

---

## Table of contents

- [Stack](#stack)
- [Architecture](#architecture)
  - [Vertical slices](#vertical-slices)
  - [CQRS](#cqrs)
  - [Hexagonal ports & adapters](#hexagonal-ports--adapters)
- [Folder structure](#folder-structure)
- [Getting started](#getting-started)
  - [1. Install dependencies](#1-install-dependencies)
  - [2. Environment variables](#2-environment-variables)
  - [3. Run PostgreSQL](#3-run-postgresql)
  - [4. Start the API](#4-start-the-api)
- [API reference (Scalar)](#api-reference-scalar)
- [Testing (TDD)](#testing-tdd)
- [Database migrations](#database-migrations)
- [Environments: local vs dev/prod (Supabase)](#environments-local-vs-devprod-supabase)
- [Working on a new feature](#working-on-a-new-feature)
- [Conventions](#conventions)

---

## Stack

| Concern        | Technology                                                          |
| -------------- | ------------------------------------------------------------------- |
| Runtime        | Node.js 22+, TypeScript 5+                                          |
| Framework      | NestJS 11                                                           |
| ORM/CQRS       | Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`) + `@nestjs/cqrs`  |
| Validation     | `class-validator` + global `ValidationPipe`                         |
| Pagination     | `@nestarc/pagination` (offset + cursor, filtering, sorting)         |
| API docs/test  | OpenAPI (`@nestjs/swagger`) rendered by **Scalar**                  |
| Tests          | Jest (unit, in `tests/`)                                           |
| Config         | `.env` files loaded by `@nestjs/config`; Prisma CLI read `prisma.config.ts` |

---

## Architecture

### Vertical slices

Each feature is an independent **vertical slice** living in `src/modules/<feature>/`. A slice contains everything it needs — controller, commands, queries, handlers, DTOs, domain model, repository port and persistence adapter — so adding or removing a feature never touches code from other slices.

```
HTTP request
      │
      ▼
┌─────────────────────────────────────────────┐
│ modules/users                        │
│  users.module.ts        (transport)   │
│  application/                 (use cases)   │
│    commands/...                             │
│    queries/...                              │
│  domain/                      (business)    │
│  infrastructure/persistence/  (adapters)    │
└─────────────────────────────────────────────┘
```

### CQRS

- **Commands** (write side) are dispatched through the `CommandBus` and handled by command handlers. Example: `CreateUserCommand → CreateUserHandler`.
- **Queries** (read side) are dispatched through the `QueryBus` and handled by query handlers. Example: `GetUserQuery → GetUserHandler`.

This separation makes the read and write models evolvable independently (read models can later be optimized/denormalized without touching writes).

### Hexagonal ports & adapters

Handlers depend only on a **repository port** (interface), never on the database driver:

- Port: `UserRepository` (interface) + `USER_REPOSITORY` DI token.
- Adapter: `PrismaUserRepository` (PostgreSQL via Prisma). It injects the global `PrismaService` and maps between the `User` domain model and the `users` record.

> Timestamps (`createdAt`/`updatedAt`) live on the shared `TimestampedEntity` base class in `src/common/domain/`, so every aggregate gets them for free.

Swapping the storage backend is therefore a **wiring concern**, not a code change across features.

---

## Folder structure

```
.
├── docker-compose.yml              # Local PostgreSQL for development
├── .env                            # Local env values (git-ignored)
├── .env.example                    # Documented env template (commit this)
├── prisma/
│   └── schema.prisma               # Prisma schema (models + datasource)
├── prisma.config.ts                # Prisma CLI configuration (env, migrations)
├── src/
│   ├── main.ts                     # Bootstrap: pipes, OpenAPI, Scalar UI
│   ├── app.module.ts               # Root module (config + Prisma + routes)
│   ├── prisma/
│   │   ├── prisma.module.ts        # Global Prisma module
│   │   └── prisma.service.ts       # PrismaClient + pg driver adapter
│   ├── routes/                     #  ── GENERAL ENDPOINT MAPPER ─────
│   │   ├── routes.module.ts        # Joins every feature module's endpoints
│   │   └── health.endpoint.ts      # GET /health
│   ├── common/
│   │   ├── config/app.config.ts    # Typed, centralized env config
│   │   └── domain/base-entity.ts   # Timestamped interface + abstract base
│   └── modules/
│       └── users/                   #  ── VERTICAL SLICE ─────────────
│           ├── users.module.ts
│           ├── dto/
│           │   └── user.response.dto.ts   # Read model (shared)
│           ├── features/
│           │   ├── create-user/           #  ── FEATURE ────────
│           │   │   ├── create-user.endpoint.ts   (route: POST)
│           │   │   ├── create-user.command.ts
│           │   │   ├── create-user.handler.ts
│           │   │   └── create-user.dto.ts
│           │   ├── get-user/              #  ── FEATURE ────────
│           │   │   ├── get-user.endpoint.ts        (route: GET /:id)
│           │   │   ├── get-user.query.ts
│           │   │   └── get-user.handler.ts
│           │   └── list-users/            #  ── FEATURE ────────
│           │       ├── list-users.endpoint.ts      (route: GET /)
│           │       ├── list-users.query.ts
│           │       └── list-users.handler.ts
│           ├── domain/
│           │   ├── user.ts              (aggregate model)
│           │   └── user.repository.ts   (port INTERFACE + DI token)
│           └── infrastructure/
│               └── persistence/prisma/       (adapter)
└── tests/                            #  ── DEDICATED TEST FOLDER ─────
    └── users/                 # per module
        ├── create-user/      # per feature (slice)
        │   ├── create-user.test.ts
        │   └── create-user.endpoint.test.ts
        ├── get-user/
        │   ├── get-user.test.ts
        │   └── get-user.endpoint.test.ts
        ├── list-users/
        │   ├── list-users.test.ts
        │   └── list-users.endpoint.test.ts
        └── repository/               # persistence adapter tests
            └── prisma-user.repository.test.ts
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

Prisma Client is generated on install (`prisma generate` via `prisma:generate`). Make sure `.env` exists before generating, so the CLI can resolve the schema (the schema maps the `users` table).

### 2. Environment variables

Copy the template and adjust values:

```bash
cp .env.example .env
```

Prisma 7 no longer reads the connection from `schema.prisma` — the runtime connection is injected through a **driver adapter** (`@prisma/adapter-pg`) in `PrismaService`, and the CLI connection comes from `prisma.config.ts`.

| Variable        | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `PORT`          | HTTP port (default `3000`)                                              |
| `DOCS_PATH`     | Public path of the Scalar API reference (default `docs`)                |
| `DATABASE_URL`  | Runtime connection used by Prisma Client (pooled URL on Supabase)       |
| `DIRECT_URL`    | Direct/session connection used by the Prisma CLI for migrations         |

`.env.example` documents **both** environments — the local block and the dev/prod (Supabase) block. See [Environments](#environments-local-vs-devprod-supabase).

### 3. Run PostgreSQL

Using Docker (local only):

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432`. Point `DATABASE_URL`/`DIRECT_URL` at it for local development, or use the Supabase block for dev/prod.

### 4. Start the API

```bash
npm run start:dev
```

The API listens on `http://localhost:3000`.

---

## API reference (Scalar)

Open **http://localhost:3000/docs** in the browser.

Scalar renders the OpenAPI document generated from the code (`@nestjs/swagger` decorators) and lets you **send real requests** against the running API — no extra setup required.

The `GET /users` endpoint uses `@nestarc/pagination`: its query params (`page`, `limit`, `sortBy`, `search`, `filter.{col}`) are auto-documented, but the `filter.{col}` fields are explicit: `filter.username`, `filter.email`, `filter.bio`, `filter.createdAt` and `filter.updatedAt`. Example:

```
GET /users?limit=20&sortBy=createdAt:DESC&search=ali&filter.email=$eq:alice@example.com
```

Current endpoints:

| Method | Path                       | Description                                     |
| ------ | -------------------------- | ----------------------------------------------- |
| `GET`  | `/health`                  | Service health check                            |
| `POST` | `/users`                   | Create a user                                   |
| `GET`  | `/users/:id`               | Get a user by id                                |
| `GET`  | `/users`                   | List users (offset/cursor + filter/sort/search) |

> If you prefer the classic Swagger UI, that's a one-line change in `src/main.ts`.

---

## Testing (TDD)

Tests are written **before/alongside** the code, following a test-first workflow: write the failing test, implement the handler/adapter, make it green.

```bash
# Run all tests (no database required - the repository port is mocked)
npm run test

# Test coverage report
npm run test:cov

# Lint & format
npm run lint
npm run format
```

**Tests live in a dedicated `tests/` folder** at the project root:

```
tests/<module>/<feature-or-slice>/<something>.test.ts
```

e.g. `tests/users/create-user/create-user.test.ts`. They are grouped per module and, inside it, per feature/slice (create, get, list, repository...), each with its own test files.

They mock the repository **interface** (`UserRepository`), the CQRS buses, and — in the adapter test — the `PrismaService` client, so they run **without a real database**.

---

## Database migrations

Schema changes are managed by **Prisma Migrate** in *every* environment (local, dev/prod). Migrations are stored in `prisma/migrations/` (committed to the repo) and applied against whichever database `DIRECT_URL` points to (see `prisma.config.ts`) — the local PostgreSQL when `.env` has the local block, Supabase when it has the dev/prod block.

Because `prisma migrate` needs a session-mode (direct) connection — PgBouncer in transaction mode breaks it — `prisma.config.ts` resolves the CLI connection from `DIRECT_URL`, while the runtime uses `DATABASE_URL`.

**Commands — one workflow for local and dev:**

```bash
# 1) CREATE a migration: generate from schema.prisma changes + apply to the
#    currently configured database (.env). Local: generates the file AND
#    applies it to your local DB. Commit the created
#    prisma/migrations/<timestamp>_<name>/migration.sql to git.
npm run migration:dev

#    Only generate the migration file without applying it (e.g. for review):
npm run migration:generate

# 2) APPLY (push) pending migrations to the currently configured database.
#    Locally: after pulling someone else's migration files, or on a fresh DB.
#    Dev/prod: switch .env to the Supabase block and run it.
npm run migration:run

# 3) RESET a database and re-apply all migrations from scratch (dev only,
#    drops all data): use it locally when the DB drifted from the migrations,
#    e.g. it was previously created with TypeORM auto-sync.
npm run migration:reset

# Status / helpers
npm run migration:status        # show applied / pending migrations
npm run prisma:studio           # inspect data in a browser on localhost:5555
```

### Typical workflows

**Local development (create a migration):**
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate + apply the migration on your local DB, and commit the file
npm run migration:dev
```

**Host local -> dev/prod (Supabase):**
```bash
# 1. Your migration is already committed (created locally with migration:dev)
# 2. Switch .env to the Supabase block (dev/prod)
# 3. Apply only the pending migrations on Supabase
npm run migration:run
```

**Fresh machine / clone (bootstrap a database):**
```bash
# Local: start PostgreSQL first, then apply every migration in order
docker compose up -d
npm run migration:run

# Dev/prod (Supabase): set .env to the Supabase block, then
npm run migration:run
```

> **Migrations only:** there is no `prisma db push` / auto-sync in this project. The schema (`prisma/schema.prisma`) is the single source of truth, and every schema change is expressed as a migration in `prisma/migrations/` and applied with `npm run migration:dev` (local) or `npm run migration:run` (dev/prod). A fresh database is bootstrapped by replaying the full migration history with `npm run migration:run`.

---

## Environments: local vs dev/prod (Supabase)

Two connection variables, two environments. `.env.example` documents both blocks; copy it to `.env` and **uncomment the block you want**, commenting out the other.

| Env       | `DATABASE_URL`                                            | `DIRECT_URL`                                             |
| --------- | --------------------------------------------------------- | -------------------------------------------------------- |
| **LOCAL** | `postgresql://postgres:postgres@localhost:5432/reading_platform` | same URL, direct connection                     |
| **DEV/PROD** | `postgresql://postgres.<ref>@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` (transaction pooler) | `postgresql://postgres.<ref>@aws-0-ca-central-1.pooler.supabase.com:5432/postgres` (session pooler) |

- **Runtime** (`PrismaService`): reads `database.url` → `DATABASE_URL` (pooled, replaces `?pgbouncer=true` handling usually done in code) and passes it to `new PrismaPg(...)`.
- **CLI** (`prisma.config.ts`): reads `DIRECT_URL ?? DATABASE_URL` for `migrate`/`studio`.

To run against Supabase, replace `TU_PASSWORD_SUPABASE` in `.env` with your real Supabase database password (Project Settings → Database). For local development, use the LOCAL block (start PostgreSQL first, e.g. `docker compose up -d`). The app and the Prisma CLI pick up whichever variables are active in `.env` — no code changes required.

---

## Working on a new feature

1. Create a feature folder under `src/modules/<module>/features/<action>/` (e.g. `delete-user/`).
2. Inside it add the **command or query**, the **dto**, the **handler**, and the **endpoint** (`@Controller` class — the feature's route).
3. Write **failing tests** for the handler and the endpoint (mock the repository interface and the CQRS buses).
4. Implement handlers against the repository **port**.
5. Register the new endpoint in the feature module's `controllers` and the handler in its `providers`.
6. The module is already joined to the HTTP layer through `src/routes/routes.module.ts` — only new **modules** need to be imported there.
7. If the feature adds a table/column, add the model to `prisma/schema.prisma`, run `npm run prisma:generate` and generate a migration (see [Database migrations](#database-migrations)).
8. Add tests under `tests/<module>/<feature>/`.

Keep each slice self-contained; shared code that is truly cross-cutting belongs in `src/common/` (e.g. config) or `src/prisma/` (the Prisma client module).

---

## Conventions

- **Code comments are in English**.
- DTOs carry `class-validator` rules (input safety) and `@nestjs/swagger` decorators (documentation). The `GET /users` listing is auto-documented via `@ApiPaginatedResponse` from `@nestarc/pagination`.
- Handlers never talk to HTTP or the database driver directly — only through the repository **port** (interface), which is what makes them mockable in tests.
- Endpoints are thin adapters between HTTP and the CQRS buses.
- Each feature folder contains its own endpoint, handler, command/query and dto; the read model shared by the whole module lives in the module's `dto/` folder.
- `src/routes/routes.module.ts` is the general endpoint mapper: it joins the endpoints of every feature/module.
- Tests live in the dedicated `tests/` folder (per module → per feature/slice) and use `*.test.ts`; the repository **interface**, the CQRS buses and the mocked `PrismaService` make every test run without a database.
- Persistence goes through **Prisma** only: `src/prisma/prisma.service.ts` is the single PrismaClient instance, injected via the `@Global()` `PrismaModule`.
- Schema changes always go through [Prisma Migrate](#database-migrations) in every environment — migrations are the only way to sync the schema (no auto-sync).
- `.env` is git-ignored; commit only `.env.example`.