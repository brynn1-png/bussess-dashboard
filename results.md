# Results

## Current State Summary

- M0 verified (`95fdc1d`); M1 **fully verified** (`9253b4c`): pytest 21/21 + Alembic migration on Supabase + live end-to-end auth on real PostgreSQL (session 2, 2026-09-28).
- M2 (TASK-003) **verified** 2026-09-28: pytest 31/31, lint+build clean, live ticket e2e 16/16, user walkthrough confirmed → Completed.
- M3 (TASK-004) **verified** 2026-09-28: pytest 36/36, lint+build clean, live analysis e2e 11/11 on Supabase → Completed (pending commit).
- Full details in the Result Log below.

---

## Result Log

<!-- Format: date, outcome, verification performed, effects -->

### 2026-09-28 — M3 AI Analysis Pipeline (TASK-004)

- **Outcome:** Ticket creation now automatically triggers AI analysis as a post-response background task. Provider abstraction (`AIProvider` protocol) + deterministic `MockProvider` (keyword rules → category, sentiment, priority, summary, suggested response); Pydantic validation gate before persistence; failures persisted as `failed` with sanitized error — the service never raises into a request. Completed analysis writes category/priority back onto the ticket. Real provider deferred (user decision: mock only).
- **Verification performed:**
  - `pytest` → **36/36 passed** (5 new: happy path + write-back + `is_human_confirmed=False`; deterministic mock; provider crash → ticket intact + `failed`; malformed output → validation rejected + no partial persistence; unknown `AI_PROVIDER` → `failed`, creation unaffected)
  - `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` on changed frontend files → no findings
  - Live vs Supabase through running uvicorn → **11/11**: register → create 201 → analysis row `completed` (provider=mock, billing/negative/urgent, fields populated, no error) → ticket write-back verified → `is_human_confirmed` false → walkthrough data deleted
- **Effects:** M4 (admin dashboard) now has AI results to review/confirm; `tickets.category`/`priority` populated for sorting/filtering.
- **Risks/notes:** failure paths verified in pytest only (no live provider switch exists by design); analysis is in-process/synchronous-on-the-side (architecture Decision 5 — background infra deferred); mock is rules-based, recorded as `provider="mock"` per row.

### 2026-09-28 — M2 Ticket Submission + Customer Portal (TASK-003)

- **Outcome:** Full customer-facing feature shipped: ticket API + portal UI (login, register, ticket list, support form, ticket detail with message thread). Implementation notes: opening message also stored in `tickets.description` (NOT NULL, no migration needed); cross-customer access returns **404** (existence not leaked); status changes remain admin-only (M4).
- **Verification performed:**
  - `pytest` → **31/31 passed** (10 new tests incl. cross-customer isolation, 401/403/404/422 paths)
  - `npm run lint` → clean; `npm run build` (tsc + vite) → passes
  - `impeccable detect` (design skill mechanical detector) over changed UI targets → no findings
  - Live e2e vs Supabase through the running uvicorn (16/16): health, register A/B, login, anon 401, create 201 (`open` + initial message), 422 invalid payload, scoped lists, B→A ticket GET/POST 404, follow-up 201 → thread 2, bad credentials 401
  - Cleanup: walkthrough users/customer/ticket rows deleted from Supabase (verified gone); user's own account left untouched
- **Effects:** M3 (AI analysis) and M4 (admin dashboard) now have real data flows to build on. UI verification requires the user's manual two-account walkthrough (desktop browser not connected to this session).
- **Risks/notes:** token stored in localStorage for v1 (documented in TASK-003 §5, revisit at hardening); design decision "inherit + elevate" — portal extends the M0 slate/emerald identity.

### 2026-09-28 — M1 live-database verification & close-out (TASK-002)

- **Outcome:** Supabase connectivity established; first Alembic migration created and applied; auth flow verified end-to-end on real PostgreSQL; TASK-002 → Completed.
- **Connection troubleshooting (for future reference):** direct `db.<ref>.supabase.co` = IPv6-only → unreachable on this IPv4-only network; `pooler.<ref>.supabase.co` = NXDOMAIN; working config = **session pooler** `aws-0-ap-southeast-1.pooler.supabase.com:5432` with username **`postgres.<project-ref>`** (bare `postgres` → `ENOIDENTIFIER`); scheme `postgresql+psycopg://`. Documented in `backend/.env.example`.
- **Verification performed:**
  - Connection test → `PostgreSQL 17.6` (aarch64), empty schema
  - `alembic revision --autogenerate` → `7d4a1330581a_create_core_tables.py` (7 tables detected)
  - `alembic upgrade head` → success; tables verified: `users, customers, tickets, ticket_messages, ai_analysis, workflows, workflow_runs, alembic_version`
  - `pytest` → 21/21 passed (unchanged, SQLite)
  - Live uvicorn vs real DB: register **201** → duplicate register **409** → login **200** → `GET /me` **200** (correct profile) → `GET /me` no token **401** → health **200**
  - Cleanup: test user + customer row deleted; `users` count = 0
- **Effects:** Database schema now exists on Supabase; M2 (tickets) can build on it. M1 committed by user as `9253b4c`; migration file + this log await the next commit.
- **Risks/notes:** Test suite still runs on in-memory SQLite by design (decision logged 2026-09-27); `conftest.py` env-var fallback noted as a future safety fix (force SQLite) before demo data exists.

### 2026-09-27 — M1 Data Model + Auth (TASK-002)

- **Outcome:** Seven SQLAlchemy models created; auth layer implemented (register/login/me, bcrypt via passlib 1.7.4 + bcrypt 4.0.1 pinned, PyJWT); role dependencies `get_current_user` (401) / `require_admin` (403); routes thin, logic in `services/auth_service.py`; Alembic `target_metadata` wired to `Base.metadata` + `sys.path` fix for CLI; admin provisioning CLI (`python -m app.cli.create_admin`).
- **Bug found & fixed:** unconfigured `DATABASE_URL` raised `RuntimeError` → opaque HTTP 500. Introduced `ConfigurationError` mapped to **503** with actionable, non-sensitive detail.
- **Verification performed:**
  - `pytest` → **21/21 passed** (security: hash roundtrip, JWT issue/decode/expiry, tampered/forged token rejection; auth: register 201/409/422, login 200/401, me 401/200, require_admin 403/allow, customer profile; admin CLI: role/idempotence/conflict; health regression)
  - Live uvicorn: `/api/health` → 200; `/api/auth/me` (no token, DB unconfigured) → **503** `{"detail":"DATABASE_URL is not configured..."}` — verified, then server stopped
  - `npm run lint` + `npm run build` → pass (frontend unaffected)
- **Effects:** Auth/authorization foundations ready for M2+. Migration against Supabase **deferred** (user: "I'll put Supabase later").
- **Housekeeping:** duplicate TASK-002 spec consolidated into `.ai/task/TASK-002-data-model-auth.md` (deviations recorded there §11).
- **Test note:** tests run on in-memory SQLite (test-only; app store remains PostgreSQL) — see `decisions.md`.

### 2026-09-27 — M0 Project Foundation (TASK-001)

- **Outcome:** Monorepo scaffolded and committed (`95fdc1d`, 40 files). Backend: FastAPI app factory, `GET /api/health`, pydantic-settings env config, Alembic initialized with `DATABASE_URL` wiring. Frontend: Vite + React + TS + Tailwind v4 + React Router shell, `src/services/api.ts`, `/api` dev proxy, ESLint flat config.
- **Verification performed:**
  - `pytest` → 1 passed (health test)
  - `npm run lint` → clean
  - `npm run build` → passes (tsc + vite)
  - Live: `GET http://127.0.0.1:8000/api/health` → 200 `{"status":"ok"}`; `/docs` → 200
  - Live: `GET http://localhost:5173/api/health` → 200 (Vite proxy → backend)
  - `git status` staged list reviewed: no `.env`, `.venv`, `node_modules`, or `dist` tracked
- **Effects:** Project ready for M1 (data model + auth). Known issue fixed en route: missing `vite-env.d.ts` broke `tsc` on CSS import — added.
- **Deferred:** Supabase DB connectivity check pending user creation of `backend/.env`.
