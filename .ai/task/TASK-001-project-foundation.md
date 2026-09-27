# TASK-001: Project Foundation (M0)

**Status:** Approved

**Created:** 2026-09-27

---

## 1. Objective

Stand up the monorepo foundation for the AI Business Automation Platform: FastAPI backend with health check and env-based config, Vite React TypeScript frontend with routing shell and API service pattern, Alembic initialized against Supabase PostgreSQL, and run instructions — per `PLAN.md` milestone M0.

---

## 2. Problem

No implementation code exists. Every later milestone depends on a working, tested scaffold.

---

## 3. Requirements

- Git repository initialized with a sensible `.gitignore` (no secrets or artifacts committed)
- `backend/`: FastAPI app, `GET /api/health`, config via pydantic-settings + env (`DATABASE_URL`), pytest wired
- `frontend/`: Vite + React + TypeScript + Tailwind CSS + React Router shell; `src/services/` API service pattern; `/api` proxied to backend in dev
- Alembic initialized and configured to use `DATABASE_URL` (Supabase session/direct connection for migrations — not transaction pooler)
- `.env.example` documenting required env vars; `.env` gitignored
- `README.md` with run instructions

---

## 4. Acceptance Criteria

- [ ] `pytest` passes (health endpoint test)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Backend runs; `GET /api/health` returns HTTP 200
- [ ] Frontend dev server proxies `/api/health` to backend
- [ ] No secrets or build artifacts tracked by git
- [ ] DB connectivity to Supabase verified once `.env` is populated (or explicitly deferred)

---

## 5. Scope

### In Scope

- Scaffold, config, health check, routing shell, Alembic init, docs

### Out of Scope

- Database models/migrations (M1)
- Auth (M1)
- Any business features

---

## 6. Technical Approach

- Backend layout follows `.ai/architecture.md` §3 (`app/api`, `app/core`, `tests/`)
- Frontend uses `src/services/` for API communication (architecture §6)
- Stack per PLAN.md decisions D3 (SQLAlchemy + Alembic), D5 (Vite/React/TS/Tailwind/Router), D6 (Supabase PostgreSQL)

---

## 7. Affected Areas

### Files / Modules

- New: `backend/`, `frontend/`, `README.md`, `.gitignore`, `.env.example`

### Database

- None (Alembic initialized only; no migrations)

### APIs

- `GET /api/health`

---

## 8. Dependencies

- Python 3.12.10, Node 24, npm 11, Git 2.54 (verified installed)
- Supabase project credentials in `.env` (user-provided)

---

## 9. Risks

- Supabase transaction pooler (port 6543) rejects DDL — migrations must use direct/session connection
- Env-specific Windows paths in scripts

---

## 10. Verification

- [ ] `pytest`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual: health endpoint returns 200 via curl-equivalent
- [ ] Review changed files

---

## 11. Notes

- User decision 2026-09-27: **Supabase** for hosting PostgreSQL (replaces local PG from D6).
