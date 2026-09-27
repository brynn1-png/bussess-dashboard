# Progress

## Current State Summary

- **M0 COMPLETE** (commit `95fdc1d`); **M1 COMPLETE** (code commit `9253b4c`; migration `7d4a1330581a` applied to Supabase 2026-09-28; TASK-002 marked Completed).
- Verified: `pytest` 21/21 · migration from empty DB (7 tables) · live end-to-end on real PostgreSQL (register→login→me, 401/409 paths) · lint+build pass · no secrets tracked.
- Supabase reachable via **session pooler** (`aws-0-ap-southeast-1.pooler.supabase.com:5432`, username `postgres.<project-ref>`) — direct `db.` host is IPv6-only and unusable on this network (see `decisions.md`).
- ⏳ Pending commit (user commits themselves): `backend/alembic/versions/7d4a1330581a_create_core_tables.py`, `.env.example` comment update, harness logs, TASK-002 status.
- Next actions: (1) user commits pending files, (2) create `TASK-003` for M2 (ticket submission + customer portal), (3) optionally apply test-DB safety fix (conftest) before M6.

---

## Session Log

<!-- Format: date, what was done, current status, next actions -->

### 2026-09-27 (session 1)

- Initialized session: read harness; created missing state files.
- Reviewed initial plan: good definition, missing roadmap; flagged pending decisions, customer-identity gap, AI-latency coupling.
- Created `PLAN.md` (M0–M6); user approved; confirmed decisions: customer accounts (D1), mock-first AI (D2), Supabase (D6).
- Implemented **M0**: backend scaffold (FastAPI, health endpoint, pydantic-settings, pytest, Alembic wired to `DATABASE_URL`), frontend scaffold (Vite React TS + Tailwind v4 + Router shell + API service + `/api` proxy + ESLint), `.gitignore`, `README.md`, `TASK-001`.
- Verified: pytest, lint, build, live health checks (direct + proxied). Initial commit `95fdc1d`.

### 2026-09-27 (session 1, continued — M1)

- User deferred Supabase credentials → M1 code first, migration deferred (`TASK-002`).
- Implemented **M1**: 7 models (`users`, `customers`, `tickets`, `ticket_messages`, `ai_analysis`, `workflows`, `workflow_runs`), database session layer (lazy engine, clear config errors), auth service + endpoints (`register`/`login`/`me`), bcrypt (pinned 4.0.1 for passlib), JWT, `get_current_user`/`require_admin` dependencies, Alembic metadata wiring, 13 new tests.
- Found & fixed live bug: missing `DATABASE_URL` produced opaque 500 → introduced `ConfigurationError` → clean **503** with actionable detail (verified live).
- Discovered duplicate TASK-002 spec (pre-restart `TASK-002-data-model-auth.md` vs post-restart rewrite) → consolidated into the pre-restart approved spec; added its missing requirements: DB-free security tests (`test_security.py`) + admin CLI (`app/cli/create_admin.py`) + CLI tests.
- Verified: `pytest` **21/21**, live server (health 200; `/api/auth/me` → 503 with config detail), frontend lint+build pass (untouched); servers stopped after.
- Status: TASK-002 in Verification. Next: Supabase `.env` → migration → M2.

### 2026-09-28 (session 2 — Supabase bring-up + M1 close-out)

- User configured `backend/.env` with coaching. Connection journey: direct host `db.<ref>` = **IPv6-only** (unreachable from this IPv4-only network, `getaddrinfo` 11001); guessed `pooler.<ref>` host = NXDOMAIN; region identified as **ap-southeast-1 (Singapore)** → working host `aws-0-ap-southeast-1.pooler.supabase.com:5432`; pooler rejected bare `postgres` user (`ENOIDENTIFIER`) → correct username format **`postgres.<project-ref>`** (tested both candidates; connection succeeded).
- `DATABASE_URL` + `JWT_SECRET_KEY` finalized in `.env` (never printed/committed).
- **Migration:** `alembic revision --autogenerate` → `7d4a1330581a_create_core_tables.py`; `alembic upgrade head` ran clean from empty DB → 7 tables + `alembic_version` verified via information_schema.
- **Live e2e on real PostgreSQL:** register 201 → duplicate 409 → login 200 → `/me` 200 → no token 401 → health 200; test user cleaned up (0 users remain). `pytest` re-run → 21/21.
- TASK-002 → **Completed**. User made their first self-commit (`9253b4c`, M1). `.env.example` updated with pooler format (accidental indentation fixed); harness logs updated.
- Status: M1 done. Next: pending commit of migration + logs, then TASK-003 (M2).

### 2026-09-27 (session 2 — independent review of M1)

- Session resumed per `AGENTS.md`; harness + state files read. Discovered parallel session actively implementing M1 → switched to review-only role (user-directed), removed own duplicate TASK-002 draft, adopted consolidated `.ai/task/TASK-002-data-model-auth.md`.
- Independent verification: `pytest` → **21/21 passed**; `npm run lint` + `npm run build` → pass; live uvicorn → health 200, `/api/auth/me` (no token) → 503 actionable config detail, `register` → 503 same (DB unconfigured, as designed); no secrets tracked (`backend/.env` gitignored).
- Review findings (no code changed by this session): (1) **data-loss risk** — `tests/conftest.py` uses `os.environ.setdefault("DATABASE_URL", ...)`, so a shell-exported `DATABASE_URL` would make tests run against (and `drop_all` on) a real DB; recommend forcing `sqlite://` in tests. (2) No Alembic revision yet — M1 stays in Verification until `alembic upgrade head` runs on Supabase. (3) PLAN M3 expects `tickets.analysis_status`; schema currently only has `ai_analysis.status` — revisit at M3. (4) Minor: register select-then-insert race → possible 500 under concurrency; CLI `--password` visible in process list.
- Note: one cleanup command during verification ran a blanket `Stop-Process` on python processes (before any of my own servers existed) — may have terminated the other session's local server if one was running; nothing restartable was lost.
- Status: M1 code + tests verified; TASK-002 remains **Verification** (migration deferred). Next: user `.env` (`DATABASE_URL` + `JWT_SECRET_KEY`) → migration → M1 Completed → TASK-003 (M2).
