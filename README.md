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
- [Database providers (PostgreSQL → Supabase / Firebase)](#database-providers-postgresql--supabase--firebase)
- [Working on a new feature](#working-on-a-new-feature)
- [Conventions](#conventions)

---

## Stack

| Concern        | Technology                                                          |
| -------------- | ------------------------------------------------------------------- |
| Runtime        | Node.js 22+, TypeScript 5+                                          |
| Framework      | NestJS 11                                                           |
| CQRS           | `@nestjs/cqrs` (CommandBus / QueryBus)                              |
| Database       | PostgreSQL via TypeORM (see [providers](#database-providers-postgresql--supabase--firebase)) |
| Validation     | `class-validator` + global `ValidationPipe`                         |
| API docs/test  | OpenAPI (`@nestjs/swagger`) rendered by **Scalar**                  |
| Tests          | Jest (unit, in `tests/`)                                           |
| Config         | `.env` files loaded by `@nestjs/config`                             |

---

## Architecture

### Vertical slices

Each feature is an independent **vertical slice** living in `src/modules/<feature>/`. A slice contains everything it needs — controller, commands, queries, handlers, DTOs, domain model, repository port and persistence adapter — so adding or removing a feature never touches code from other slices.

```
HTTP request
      │
      ▼
┌─────────────────────────────────────────────┐
│ modules/user-profile                        │
│  user-profile.controller.ts   (transport)   │
│  application/                 (use cases)   │
│    commands/...                             │
│    queries/...                              │
│  domain/                      (business)    │
│  infrastructure/persistence/  (adapters)    │
└─────────────────────────────────────────────┘
```

### CQRS

- **Commands** (write side) are dispatched through the `CommandBus` and handled by command handlers. Example: `CreateUserProfileCommand → CreateUserProfileHandler`.
- **Queries** (read side) are dispatched through the `QueryBus` and handled by query handlers. Example: `GetUserProfileQuery → GetUserProfileHandler`.

This separation makes the read and write models evolvable independently (read models can later be optimized/denormalized without touching writes).

### Hexagonal ports & adapters

Handlers depend only on a **repository port** (interface), never on the database driver:

- Port: `UserProfileRepository` (interface) + `USER_PROFILE_REPOSITORY` DI token.
- Adapter: `TypeOrmUserProfileRepository` (PostgreSQL). Future adapters (Supabase, Firebase) implement the same port.

Swapping the storage backend is therefore a **wiring concern**, not a code change across features.

---

## Folder structure

```
.
├── docker-compose.yml              # Local PostgreSQL for development
├── .env                            # Local env values (git-ignored)
├── .env.example                    # Documented env template (commit this)
├── src/
│   ├── main.ts                     # Bootstrap: pipes, OpenAPI, Scalar UI
│   ├── app.module.ts               # Root module (config + database + routes)
│   ├── routes/                     #  ── GENERAL ENDPOINT MAPPER ─────
│   │   ├── routes.module.ts        # Joins every feature module's endpoints
│   │   └── health.endpoint.ts      # GET /health
│   ├── common/
│   │   ├── config/app.config.ts   # Typed, centralized env config
│   │   └── database/
│   │       ├── database.module.ts # Global TypeORM connection module
│   │       ├── data-source.ts     # TypeORM CLI data source (migrations)
│   │       └── migrations/        # Generated migration files
│   └── modules/
│       └── user-profile/           #  ── VERTICAL SLICE ─────────────
│           ├── user-profile.module.ts
│           ├── dto/
│           │   └── user-profile.response.dto.ts   # Read model (shared)
│           ├── features/
│           │   ├── create-user-profile/           #  ── FEATURE ────────
│           │   │   ├── create-user-profile.endpoint.ts  (route: POST)
│           │   │   ├── create-user-profile.command.ts
│           │   │   ├── create-user-profile.handler.ts
│           │   │   └── create-user-profile.dto.ts
│           │   └── get-user-profile/              #  ── FEATURE ────────
│           │       ├── get-user-profile.endpoint.ts      (route: GET /:id)
│           │       ├── get-user-profile.query.ts
│           │       └── get-user-profile.handler.ts
│           ├── domain/
│           │   ├── user-profile.ts            (aggregate model)
│           │   └── user-profile.repository.ts (port INTERFACE + DI token)
│           └── infrastructure/
│               └── persistence/typeorm/       (entity + adapter)
└── tests/                            #  ── DEDICATED TEST FOLDER ─────
    └── user-profile/                 # per module
        ├── create-user-profile/      # per feature (slice)
        │   ├── create-user-profile.test.ts
        │   └── create-user-profile.endpoint.test.ts
        ├── get-user-profile/
        │   ├── get-user-profile.test.ts
        │   └── get-user-profile.endpoint.test.ts
        └── repository/               # persistence adapter tests
            └── typeorm-user-profile.repository.test.ts
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the template and adjust values:

```bash
cp .env.example .env
```

All runtime configuration is read from the `.env` file. Key variables:

| Variable            | Default         | Purpose                                      |
| ------------------- | --------------- | -------------------------------------------- |
| `PORT`              | `3000`          | HTTP port                                    |
| `DOCS_PATH`         | `docs`          | Public path of the Scalar API reference      |
| `DATABASE_PROVIDER` | `postgres`      | Storage backend selector (see providers)     |
| `DB_HOST`           | `localhost`     | PostgreSQL host                              |
| `DB_PORT`           | `5432`          | PostgreSQL port                              |
| `DB_USERNAME`       | `postgres`      | PostgreSQL user                              |
| `DB_PASSWORD`       | `postgres`      | PostgreSQL password                          |
| `DB_DATABASE`       | `reading_platform` | Database name                             |
| `DB_SYNCHRONIZE`    | `true`          | Auto-sync schema on boot (dev only)          |
| `DB_MIGRATIONS_RUN` | `false`         | Apply pending migrations at boot (CI/prod)   |
| `DB_SSL`            | `false`         | Enable SSL (required by Supabase)            |

### 3. Run PostgreSQL

Using Docker:

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432` matching the default `.env` values. Alternatively point `DB_*` at any existing PostgreSQL instance.

### 4. Start the API

```bash
npm run start:dev
```

The API listens on `http://localhost:3000`.

---

## API reference (Scalar)

Open **http://localhost:3000/docs** in the browser.

Scalar renders the OpenAPI document generated from the code (`@nestjs/swagger` decorators) and lets you **send real requests** against the running API — no extra setup required.

Current endpoints:

| Method | Path                       | Description          |
| ------ | -------------------------- | -------------------- |
| `GET`  | `/health`                  | Service health check |
| `POST` | `/user-profile`            | Create a user profile |
| `GET`  | `/user-profile/:id`        | Get a user profile   |

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

e.g. `tests/user-profile/create-user-profile/create-user-profile.test.ts`. They are grouped per module and, inside it, per feature/slice (create, get, repository...), each with its own test files.

They mock the repository **interface** (`UserProfileRepository`) and the CQRS buses, so they run **without a database**.

---

## Database migrations

There are two ways to manage the schema. **Do not combine them** on the same environment/database:

| Mode                   | Configuration                      | When to use                                     |
| ---------------------- | ---------------------------------- | ----------------------------------------------- |
| Auto-sync              | `DB_SYNCHRONIZE=true` (default)    | Rapid local development only                    |
| Versioned migrations   | `DB_SYNCHRONIZE=false`             | CI, staging and production (controlled changes) |

Migrations are TypeORM versions of the schema stored in `src/common/database/migrations/` (the committed `InitSchema...` migration is a reference). The CLI connects through `src/common/database/data-source.ts`, which reuses the same `.env` settings as the app.

Commands:

```bash
# Generate a migration by diffing the entities against the current DB schema
npm run migration:generate -- src/common/database/migrations/AddBooks

# Apply all pending migrations
npm run migration:run

# Revert the last applied migration
npm run migration:revert

# List applied / pending migrations
npm run migration:show
```

All commands read the connection from `.env`. To target another database, override inline, e.g. `DB_DATABASE=staging npm run migration:run`.

Two important notes:

- **Always review a generated migration** before applying it — TypeORM diffing is smart but not perfect.
- Every entity must be registered in `src/common/database/data-source.ts`. Unlike the runtime module (which uses `autoLoadEntities`), the CLI cannot discover entities automatically. Keep the list in sync when adding slices.

> **Pitfall:** if a dev database was already created with `DB_SYNCHRONIZE=true`, the initial `InitSchema` migration will conflict (`user_profiles` table already exists). Drop and recreate the database before migrating, or keep auto-sync on that environment.

---

## Database providers (PostgreSQL → Supabase / Firebase)

The storage backend is selectable through `DATABASE_PROVIDER`. Adapters live under `src/modules/<feature>/infrastructure/persistence/<provider>/` and are bound to the repository **port** (e.g. `USER_PROFILE_REPOSITORY`) by the slice module. The domain and application layers never change.

### Switching to Supabase

Supabase exposes a **plain PostgreSQL endpoint**, so the TypeORM adapter stays as-is. Only the connection changes:

1. In `.env`, set `DATABASE_PROVIDER=supabase` and point the `DB_*` variables at the Supabase connection settings (host, port — `5432` direct or `6543` via pgBouncer, user `postgres`, database password, database name) and set `DB_SSL=true`.
2. Apply the schema with `npm run migration:run` (or drop `reading_platform` and run the InitSchema migration fresh).
3. Done — no code changes. Because Supabase is PostgreSQL, `UserProfileEntity` and `TypeOrmUserProfileRepository` work unchanged.

### Switching to Firebase

Firestore is not SQL, so each slice needs a **new adapter** implementing the same port:

1. Create `src/modules/user-profile/infrastructure/persistence/firebase/firebase-user-profile.repository.ts` implementing `UserProfileRepository`. It persists the same `UserProfile` domain model through the Firestore SDK. The TypeORM entity and its `fromDomain`/`toDomain` methods are TypeORM-only and are **not** reused.
2. Install `firebase-admin`, initialize it with credentials exposed via a `FIREBASE_*` env block, and add a provider for it (e.g. in the slice module or `src/common/firebase/`).
3. In `src/modules/user-profile/user-profile.module.ts`, extend the `USER_PROFILE_REPOSITORY` factory to return the new adapter:

```ts
{
  provide: USER_PROFILE_REPOSITORY,
  useFactory: (config: ConfigService, postgres: TypeOrmUserProfileRepository, firebase: FirebaseUserProfileRepository) => {
    const provider = config.get<string>('database.provider') ?? 'postgres';
    switch (provider) {
      case 'postgres':
      case 'supabase':
        return postgres;
      case 'firebase':
        return firebase;
      default:
        throw new Error(`Unsupported DATABASE_PROVIDER "${provider}".`);
    }
  },
  inject: [ConfigService, TypeOrmUserProfileRepository, FirebaseUserProfileRepository],
}
```

4. Uniqueness of `username` on Firebase: the `CreateUserProfileHandler` already guards it with `findByUsername` before writing (business rule), since Firestore has no unique constraint like PostgreSQL.

What changes per provider — summary:

| Thing                          | Supabase                    | Firebase                       |
| ------------------------------ | --------------------------- | ------------------------------ |
| DB connection (`.env`)         | `DB_*` + `DB_SSL=true`      | `FIREBASE_*` credentials       |
| Repository adapter per slice   | reuse TypeORM               | new `FirebaseUserProfileRepository` |
| Schema management             | TypeORM migrations (SQL)    | Firestore is schemaless        |
| `data-source.ts` / `migrations`| unchanged                  | not used                       |
| Domain + application code      | unchanged                  | unchanged                     |

---

## Working on a new feature

1. Create a feature folder under `src/modules/<module>/features/<action>/` (e.g. `delete-user-profile/`).
2. Inside it add the **command or query**, the **dto**, the **handler**, and the **endpoint** (`@Controller` class — the feature's route).
3. Write **failing tests** for the handler and the endpoint (mock the repository interface and the CQRS buses).
4. Implement handlers against the repository **port**.
5. Register the new endpoint in the feature module's `controllers` and the handler in its `providers`.
6. The module is already joined to the HTTP layer through `src/routes/routes.module.ts` — only new **modules** need to be imported there.
7. If the feature adds entities, register them in `src/common/database/data-source.ts` and generate a migration (see [Database migrations](#database-migrations)).
8. Add tests under `tests/<module>/<feature>/`.

Keep each slice self-contained; shared code that is truly cross-cutting belongs in `src/common/` (e.g. config, database).

---

## Conventions

- **Code comments are in English**.
- DTOs carry `class-validator` rules (input safety) and `@nestjs/swagger` decorators (documentation).
- Handlers never talk to HTTP or the database driver directly — only through the repository **port** (interface), which is what makes them mockable in tests.
- Endpoints are thin adapters between HTTP and the CQRS buses.
- Each feature folder contains its own endpoint, handler, command/query and dto; the read model shared by the whole module lives in the module's `dto/` folder.
- `src/routes/routes.module.ts` is the general endpoint mapper: it joins the endpoints of every feature/module.
- Tests live in the dedicated `tests/` folder (per module → per feature/slice) and use `*.test.ts`; the repository **interface** and the CQRS buses make every test run without a database.
- Auto-sync (`DB_SYNCHRONIZE=true`) is for local development only. Use [versioned migrations](#database-migrations) for anything that needs a controlled schema.
- `.env` is git-ignored; commit only `.env.example`.
