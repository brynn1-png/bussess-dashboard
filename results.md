# Results

## Current State Summary

- M0 verified (commit `95fdc1d`); M1 verified via pytest **21/21** + live server checks (independently re-verified, session 2).
- Full details in the Result Log below.

---

## Result Log

<!-- Format: date, outcome, verification performed, effects -->

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
