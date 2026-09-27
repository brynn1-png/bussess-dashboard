# TASK-002: Data Model + Authentication (M1)

**Status:** Completed

**Created:** 2026-09-27

**Completed:** 2026-09-28

**Supersedes:** duplicate draft `TASK-002-auth-and-data-model.md` (removed 2026-09-27)

---

## 1. Objective

Create the complete persistent data model (all v1 tables) and a working, server-side enforced authentication/authorization layer: customer signup/login, JWT-based sessions, and role-based FastAPI dependencies. This unblocks every later milestone (tickets M2, AI M3, admin M4).

---

## 2. Problem

M0 delivered only a scaffold (health endpoint, no database access, no auth). Nothing can be built on top until the schema exists, migrations run, and roles are enforceable per `.ai/context.md` §7 (customers isolated; admin routes protected).

---

## 3. Requirements

- SQLAlchemy 2.0 models for: `users` (role: `admin` | `customer`), `customers` (1:1 with user), `tickets`, `ticket_messages`, `ai_analysis`, `workflows`, `workflow_runs`.
- Alembic migration that creates all tables from an empty database.
- Auth endpoints (thin routes → service layer):
  - `POST /api/auth/register` — creates a `customer` user + linked customer record; duplicate email → 409.
  - `POST /api/auth/login` — verifies bcrypt password, returns short-lived JWT access token (D4).
  - `GET /api/auth/me` — returns the authenticated user's profile; 401 without valid token.
- FastAPI dependencies: authenticated-user dependency + `require_admin` (role == admin).
- Business rules enforced **server-side**: token signature + expiry checked; role checked on the backend; customers never receive admin access through visibility tricks (`.ai/context.md` §4, §7).
- Admin provisioning: CLI script to create an admin user (registration must never grant admin).
- Passwords hashed with bcrypt; secrets (JWT secret, DB URL) only via env.

---

## 4. Acceptance Criteria

- [x] `pytest` passes: password hash/verify roundtrip + JWT issue/decode/expiry + tampered/forged token rejection (no DB required) — `tests/test_security.py`
- [x] `pytest` passes: register → login → `/me` happy path — `tests/test_auth.py` (runs on in-memory SQLite; see deviation note below)
- [x] `pytest` passes: bad credentials → 401; duplicate email → 409
- [x] `pytest` passes: `require_admin` rejects customer → 403, accepts admin; missing/invalid token → 401
- [x] `pytest` passes: admin CLI provisions admin role; idempotent; refuses customer-email conflict — `tests/test_admin_cli.py`
- [x] Existing health test still passes; frontend build/lint unaffected (no frontend changes) — re-verified 2026-09-27
- [x] No secrets committed; `.env` remains gitignored
- [x] `alembic upgrade head` succeeds from an empty database — **ran 2026-09-28** against Supabase (revision `7d4a1330581a`; 7 tables verified via information_schema)

---

## 5. Scope

### In Scope

- Backend: models, DB session/engine module, auth schemas, security helpers, auth service, auth routes, role dependencies, admin CLI script.
- Dependencies: PyJWT + bcrypt (passlib) + email-validator.
- Backend tests (unit tests runnable now; migration deferred until DB available).
- Harness log updates at session end.

### Out of Scope

- Ticket/customer/AI/workflow/analytics endpoints (M2–M5).
- Frontend UI for signup/login (later milestone; API only for now).
- Refresh tokens, email verification, password reset, rate limiting.
- Seeding demo data (M6).

---

## 6. Technical Approach (as implemented)

```text
backend/app/api/auth.py         → thin route handlers (validation + error mapping only)
backend/app/api/deps.py         → get_current_user (401) / require_admin (403)
backend/app/services/auth_service.py → register/login use cases
backend/app/core/security.py    → bcrypt hashing + JWT encode/decode
backend/app/database/session.py → lazy engine, get_db dependency, ConfigurationError on missing config
backend/app/models/             → SQLAlchemy 2.0 mapped classes (Mapped[] typing)
backend/app/schemas/auth.py     → Pydantic request/response models
backend/app/cli/create_admin.py → admin provisioning CLI (python -m app.cli.create_admin)
backend/alembic/                → env.py wired to Base.metadata (revision awaits live DB)
```

- JWT: `PyJWT`, 60-minute access token (env: `JWT_SECRET_KEY`), `sub` = user id, `role` claim.
- Missing config (DB URL / JWT key) → `ConfigurationError` → clean HTTP **503** with actionable detail (never a bare 500).

---

## 7. Affected Areas

### Files / Modules

- New: `backend/app/models/*`, `backend/app/database/*`, `backend/app/schemas/*`, `backend/app/services/auth_service.py`, `backend/app/api/auth.py`, `backend/app/api/deps.py`, `backend/app/core/security.py`, `backend/app/cli/*`, `backend/tests/{conftest,test_security,test_auth,test_admin_cli}.py`
- Modified: `backend/app/main.py`, `backend/app/core/config.py`, `backend/alembic/env.py`, `backend/requirements.txt`, `backend/.env.example`

### Database

- Tables: `users`, `customers`, `tickets`, `ticket_messages`, `ai_analysis`, `workflows`, `workflow_runs` (created by migration — deferred)

### APIs

- New: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

---

## 8. Dependencies

- Python: `sqlalchemy`, `alembic`, `psycopg` (present), `PyJWT`, `passlib[bcrypt]`, `bcrypt==4.0.1` (pinned for passlib compatibility), `email-validator`
- Supabase `DATABASE_URL` (deferred — user action) + `JWT_SECRET_KEY`
- Decisions: D3 (SQLAlchemy + Alembic), D4 (JWT + bcrypt) — approved

---

## 9. Risks

- **DB verification deferred** — migration cannot be claimed verified until `DATABASE_URL` is filled; reported honestly.
- **Auth security mistakes** — conventional stack, mandatory authz tests, secrets env-only.
- **Schema design lock-in** — later milestones depend on this schema.
- **passlib unmaintained** — resolved: pinned `bcrypt==4.0.1` (compatible with passlib 1.7.4); no deviation from D4 needed.

---

## 10. Verification (performed 2026-09-27)

- [x] `pytest` — **21/21 passed** (security unit, auth integration, admin CLI, health regression)
- [x] Live uvicorn: `/api/health` → 200; `/api/auth/me` unconfigured → 503 with actionable detail
- [x] `npm run lint` + `npm run build` — pass (frontend untouched)
- [x] `alembic upgrade head` — **ran 2026-09-28** on Supabase session pooler from empty DB; all 7 tables + `alembic_version` verified
- [x] Live end-to-end **on real PostgreSQL**: register 201 → duplicate register 409 → login 200 → `GET /me` 200 (correct user) → no token 401 → test user deleted (0 users remain)
- [x] `git status` — no `.env`/secrets tracked
- [x] M1 code committed as `9253b4c`; migration file + harness close-out follow-up commit pending user

---

## 11. Notes & Deviations from original spec

- **Test DB:** spec originally required DB-dependent tests to *skip* without `DATABASE_URL`. Implemented instead with **in-memory SQLite** so integration paths are exercised now (approved deviation, logged in `decisions.md`); the real Supabase migration remains a required verification step before Completed status.
- **Dependency naming:** spec's `current_customer` (any authenticated user) implemented as **`get_current_user`** — clearer, since admins authenticate through the same path.
- **Env var naming:** spec's `JWT_SECRET` implemented as **`JWT_SECRET_KEY`**.
- **Route location:** spec's `app/api/routes/auth.py` implemented as `app/api/auth.py` (`app/api/routes.py` already holds the health router; both cannot coexist as `routes.py` + `routes/`).
- **Admin route test:** `require_admin` verified at dependency level — no admin-only endpoint exists yet to test end-to-end (first admin route arrives with M4).
- Dev DB is fresh Supabase; test fixtures create/drop tables — tests must never be pointed at data that matters.
