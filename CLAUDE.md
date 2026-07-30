# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A boardgame marketplace ("Dicero" in code, "BoardMates" in the newer vision doc [frontend/Refactor.md](frontend/Refactor.md)) built as three independently deployable services in one repo. There is no monorepo tooling — each service has its own dependencies, its own env file, and is run from its own directory.

| Service | Stack | Port | Env file |
|---|---|---|---|
| [frontend/](frontend/) | Next.js 16 App Router, React 19, JavaScript (not TS), Tailwind v4, zustand | 3007 | none |
| [backend/](backend/) | Express 4, Prisma 7 + PostgreSQL, JWT, Socket.IO | 8080 | `backend/.env` |
| [ai/](ai/) | FastAPI, Ollama, ChromaDB, sentence-transformers | 8001 | `ai/.env` |

Ollama runs on the host at 11434 and is a separate prerequisite (`ollama pull <model>`).

## Current phase: core-team recruitment

The public site is currently a recruitment landing site, not a marketplace. The navbar ([Navbar.jsx](frontend/src/layouts/Navbar.jsx)) exposes only Home / Community *(coming soon)* / Events *(coming soon)* / Join Us / About. The marketplace, chat, profile and admin pages still exist and still work, but nothing links to them.

**The login/register entry points are hidden on purpose.** The navbar renders the account area only when `user` is truthy; the logged-out branch that used to render a "Đăng nhập" button was deliberately removed, and `handleLogout` sends you to `/` rather than `/login`. Admins reach the app by typing `/login` themselves. Don't "fix" the missing button — restoring it is a one-line change when the phase ends (the `t.login` key is still in [translations.js](frontend/src/data/translations.js)).

This is UI-level hiding only, not access control: `/login` and `/register` are still routable and `POST /api/auth/register` still accepts signups. Closing registration for real means gating it in [auth.controller.js](backend/src/controller/auth.controller.js).

## Commands

Each service runs from its own directory; there is no root-level script.

```bash
# frontend/
npm run dev        # dev server on :3007 (port is pinned in package.json, not 3000)
npm run build
npm run lint       # eslint — the only lint/check in the repo

# backend/  (needs backend/.env with DATABASE_URL + JWT_SECRET)
npm start          # node ./bin/www — no dev/watch script; restart manually
npx prisma db push          # push schema without a migration (design phase)
npx prisma migrate dev --name <name>
npx prisma generate         # after any schema change
npx prisma studio           # data browser on :5555
node prisma/seed.js         # create the ADMIN account (admin@bg.com / admin123;
                            # override with ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_USERNAME)

# ai/  (run from repo root, PowerShell)
powershell -ExecutionPolicy Bypass -File ai/scripts/setup.ps1     # creates ai/venv + installs deps
powershell -ExecutionPolicy Bypass -File ai/scripts/run_api.ps1   # uvicorn --reload on :8001
ai/venv/Scripts/python.exe ai/scripts/test_ollama.py              # smoke test: Ollama reachable
ai/venv/Scripts/python.exe ai/scripts/test_embeddings.py          # smoke test: embeddings + Chroma

# all three
docker compose up --build
```

**There is no test suite** — no test runner, no test files, no `test` script in either package.json. The two `ai/scripts/test_*.py` files are smoke scripts, not unit tests. Don't claim tests pass; verify changes by running the affected service.

`pip` is not on PATH on this machine — always go through `ai/venv/Scripts/python.exe -m pip` or `py -m pip`.

## Architecture

### The AI service is not wired up yet

`ai/` is a standalone foundation. Nothing in `backend/` or `frontend/` references port 8001 — the boardgame app and the AI service currently do not talk to each other. [AI_SETUP.md](AI_SETUP.md) §8 describes the *intended* contract: frontend → backend (as BFF, owning auth/rate-limiting) → AI over internal HTTP, never frontend → AI directly. Follow that direction when connecting them.

The AI service exposes `/health`, `POST /v1/chat` (Ollama), `POST /v1/embeddings`, `POST /v1/rag/ingest`, `POST /v1/rag/query` (Chroma). Config is env-driven at import time in [ai/api/main.py](ai/api/main.py); the embedding model and Chroma client are lazy in-process singletons, so the first request after boot is slow. `/v1/chat` silently falls back to the first locally-available Ollama model when `OLLAMA_MODEL` isn't pulled.

### Frontend → backend

Every call is a raw `fetch` to a **hardcoded `http://localhost:8080`** (~15 call sites across pages and components; `axios` is a dependency but unused). There is no API client module and no `NEXT_PUBLIC_*` base URL, which is why the Docker frontend can't reach the backend by service name. If you touch this, centralize it rather than adding another hardcoded literal.

Conventions: pages under `src/app/(main)/` get the shared shell via `MainLayout`; `@/*` maps to `src/*`; Tailwind v4 is configured through `@tailwindcss/postcss` with no `tailwind.config` file. State is zustand with `persist` — `useAuthStore` (key `dicero-auth-storage`, holds `{ ...user, token }`) and `useLanguageStore` (key `language-storage`, defaults to `vi`). Both guard `localStorage` behind a `typeof window` check for SSR.

i18n is a hand-rolled dictionary: `translations[language].<section>` from [frontend/src/data/translations.js](frontend/src/data/translations.js), read per-component as `const t = translations[language].navbar`. New user-facing strings need both `vi` and `en` entries.

**Before writing frontend code**, read [frontend/CLAUDE.md](frontend/CLAUDE.md) → [frontend/AGENTS.md](frontend/AGENTS.md): this Next.js version has breaking changes vs. training data, and the guides in `frontend/node_modules/next/dist/docs/` are the source of truth.

### Backend

Express-generator layout under `src/`: `routes/` (thin, carry the `@swagger` JSDoc that builds `/api-docs`) → `controller/` (all logic + Prisma calls) → `middleware/`. Mounted at `/api/auth`, `/api/listings`, `/api/orders`, `/api/admin`, `/api/positions`, `/api/users`.

Every JSON response follows `{ success: true, data }` or `{ success: false, message }`. The error handler in [backend/app.js](backend/app.js) only returns JSON for URLs starting with `/api` — the non-API branch still calls `res.render('error')`, but the jade views were deleted and the configured views dir doesn't exist. This app is JSON-only; don't add server-rendered pages without restoring that setup.

Auth is JWT Bearer with payload `{ userId, email, role }`, expiring in 1d. [`authenticate`](backend/src/middleware/authenticate.js) sets `req.user = { id, email, role }` — note `userId` in the token becomes `id` on the request. Role gates go through `requireRole('ADMIN')`. Google OAuth (passport) lives alongside password auth; users may have a null `password`.

Prisma 7 specifics that differ from older versions: `DATABASE_URL` is supplied by [backend/prisma.config.ts](backend/prisma.config.ts), **not** by a `url` in the `datasource` block of [schema.prisma](backend/prisma/schema.prisma). The client is instantiated with the `PrismaPg` adapter over a `pg` Pool in [prismaClient.js](backend/src/middleware/prismaClient.js), and when `DATABASE_URL` is missing it exports a Proxy that throws on first use — the server boots fine and fails only when a query runs, so "server started" doesn't mean the DB is connected.

`DATABASE_URL` points at a **hosted Supabase instance**, not a local Postgres — `db push` and seeds hit a shared remote database, so treat schema changes as shared state.

**Schema drift presents as a generic 500, not as a schema error.** The generated client selects every scalar field in the model, so if the database is missing a column that [schema.prisma](backend/prisma/schema.prisma) declares, any bare `findUnique`/`findFirst` throws — and controllers catch it and return `{ success: false, message: 'Lỗi server' }`. A 500 on login that should have been a 404 or 400 means the `User` table is behind the schema, not that credentials are wrong. Confirm with a raw `information_schema.columns` query before touching auth code. (`count()` and `findMany` with an explicit `select` keep working, which makes the drift look intermittent.)

### The recruitment console is a second, separate auth system

`/api/positions` ([positionsController.js](backend/src/controller/positionsController.js)) does **not** touch Prisma, JWT, or `requireRole('ADMIN')`. It stores open/closed flags for recruitment slots in a plain JSON file at `backend/src/data/positions.json` — a path that doesn't exist until the first write, and a missing file or missing key means *open*. Writes are authorized by an `x-admin-key` header compared against `process.env.ADMIN_SECRET`, which falls back to a hardcoded default when the env var is unset (set `ADMIN_SECRET` in `backend/.env` before this is public). Working with the database down is the point — that's why it doesn't use Prisma.

Its UI is [frontend/src/app/bm-console-7k29x/page.js](frontend/src/app/bm-console-7k29x/page.js) — deliberately outside the `(main)` route group, so it has no navbar or footer, and nothing links to it. The obscure path *is* the access model; don't add it to navigation or rename it casually.

Gotcha: `KNOWN_SLUGS` in the controller is hand-synced with the `slug` values in [frontend/src/data/teams.js](frontend/src/data/teams.js). Add a team on one side only and the API answers 404 for it.

### Domain model

`User → Listing → Order`, with `BoardGame` as shared catalog data referenced by listings. `Listing` is the central entity (type `SELL | RENT | EXCHANGE`, plus a stringly-typed `status` defaulting to `"ACTIVE"`, unlike the other enum'd fields).

Non-obvious behavior in [listingController.js](backend/src/controller/listingController.js): creating a listing **deduplicates BoardGames by exact name** — it reuses an existing game and backfills only its null fields, rather than creating one per listing. On update, if more than one listing points at the game, it forks a new `BoardGame` instead of mutating shared data. The controller also carries fallback branches that retry writes without `categories` when the generated client predates that column.

Uploads go through optional-`require`d multer ([upload.js](backend/src/middleware/upload.js) degrades gracefully if it isn't installed): images only, 5MB cap, written to `backend/public/uploads/boardgames/` and served by `express.static`, with the URL built from the request's host header.

### Realtime

[socket.js](backend/src/realtime/socket.js) initializes Socket.IO in [bin/www](backend/bin/www) (not in `app.js`), authenticates the handshake with the same JWT, and joins each client to a `user:<id>` room. `emitToUser(userId, event, payload)` is the way to push to a user from anywhere.

**Chat is entirely in-memory**: `chat:send` is relayed straight to the recipient's and sender's rooms as `chat:message` with a generated id — there is no `Message` model in the schema and nothing is persisted. Messages vanish on reload/restart. Persisting chat means adding a model + migration first. The client ([socketClient.js](frontend/src/lib/socketClient.js)) keeps one module-level singleton keyed by token, websocket transport only.

## Conventions

Comments, commit-adjacent docs, and user-facing API messages are in Vietnamese; keep matching the file you're editing. Backend files mix `var`/`require` (generator scaffold) with modern `const`/async — follow the local file rather than normalizing.

`AI_SETUP.md` and `backend/MIGRATION_GUIDE.md` are Vietnamese-language setup references worth consulting for environment/Prisma details.
