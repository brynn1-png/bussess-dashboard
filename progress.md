# Progress

## Current State Summary

- **M0 COMPLETE** (`95fdc1d`); **M1 COMPLETE** (`9253b4c` + migration `7d4a1330581a` on Supabase, TASK-002 Completed); **M2 COMPLETE** (TASK-003 Completed — user walkthrough confirmed; committed through `a0ce746`); **M3 COMPLETE** (TASK-004 Completed, committed as `1c66b85`); **M4 COMPLETE** (TASK-005 Completed — user walkthrough confirmed 2026-09-28, committed as `46d182e`); **M5 COMPLETE** (TASK-006 Completed — walkthrough confirmed, committed as `3570f8d` and **pushed to origin/master**): workflow engine + analytics (details in session 6). M6 (TASK-007) implemented 2026-09-28 — seed CLI + Ollama provider + polish + README/architecture sync, verified (pytest 72 + 1 skip, lint/build/detector clean, live seed→remove data-survival check).
- Supabase reachable via **session pooler** (`aws-0-ap-southeast-1.pooler.supabase.com:5432`, username `postgres.<project-ref>`) — direct `db.` host is IPv6-only (see `decisions.md`).
- ⏳ Pending (M6 exit): (1) user e2e walkthrough with demo data, ~~(2) live `AI_PROVIDER=ollama` check~~ **DONE 2026-09-28 — Ollama cloud, `gpt-oss:20b`, live e2e passed**, (3) optional README screenshots (user-captured), (4) user commit of M6 files.
- Next actions: user walkthrough of TASK-007 → Completed → M6 commit → project handoff (PLAN exit).

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

### 2026-09-28 (session 3 — M2 implementation, TASK-003)

- Created `TASK-003` spec from `PLAN.md` §M2; user approved (and pushed M1 close-out themselves first). Design skill `impeccable` loaded for the UI work (probe answered: **inherit + elevate**, HomePage stays entry point).
- **Backend:** `schemas/ticket.py` (CreateTicketRequest/AddMessageRequest/response models), `services/ticket_service.py` (ownership + customer scoping; 404 non-disclosure; admin → 403), `api/tickets.py` thin routes (create/list/detail/messages), router wired in `main.py`, 10 tests in `test_tickets.py`.
- Fixed en route: `tickets.description` NOT NULL not set by service → store opening message as description too (no migration). Lint feedback: split auth module (`auth-context.ts` + `AuthProvider.tsx`) for react-refresh; ticket-detail effect made free of synchronous setState.
- **Frontend:** `services/api.ts` (Bearer header, typed `ApiError`, auth + ticket calls), `features/auth` (AuthProvider/useAuth/Protected), pages: Login, Register, portal (PortalLayout, TicketList, NewTicket, TicketDetail), shared `components/ui.tsx`, `lib/format.ts`, HomePage CTAs, `index.css` browser-surface theming (selection/caret/focus).
- **Verified:** pytest 31/31 · lint + build clean · `impeccable detect` → no findings · live e2e vs Supabase 16/16 (isolation 404s included) · walkthrough test data cleaned from DB (user's own account untouched).
- Status: TASK-003 **Verification** — pending user manual two-account UI walkthrough + user commit of M2 files. Next: walkthrough → Completed → M3 spec.

### 2026-09-28 (session 4 — M3 AI analysis pipeline, TASK-004)

- User confirmed M2 walkthrough ("yes it is working") → TASK-003 → **Completed**. Created TASK-004 from PLAN §M3; design-skill probe answered: **mock only for now** (real provider deferred to before M4/M6 exit).
- **Backend:** `app/ai/` package — `base.py` (AIProvider protocol + `get_provider` factory, `UnknownProviderError`), `schemas.py` (`AnalysisResult`, field limits mirroring DB), `mock.py` (deterministic keyword engine: category/sentiment/priority rules, summary + reply templates); `services/analysis_service.py` (own-session background orchestration, pending → completed/failed, sanitized errors, **never raises**); trigger via `BackgroundTasks` in `POST /api/tickets`; `AI_PROVIDER` setting (default `mock`) + `.env.example` entry.
- **Frontend:** `urgent` priority type + solid-red badge (contrast 4.83:1).
- **Tests (5):** happy path + write-back + `is_human_confirmed=False`; deterministic mock; provider crash → ticket intact/failed; malformed output → validation failed/no partial write; unknown config → failed. En route fix: helper returned token object instead of `access_token` → 401s (fixed).
- **Verified:** pytest **36/36** · lint+build clean · `impeccable detect` → `[]` · live vs Supabase **11/11** (billing/negative/urgent analysis, write-back, cleanup) — uvicorn restarted in background by assistant after user's terminal closed (port 8000).
- Status: TASK-004 **Completed** pending user commit. Next: commit → TASK-005 (M4 Admin Dashboard) spec.

### 2026-09-28 (session 5 — M4 Admin Dashboard, TASK-005)

- User approved TASK-005 → implemented end-to-end.
- **Backend:** `schemas/admin.py` (overview/detail/update/customer schemas), `services/admin_service.py` (server-side SQL aggregates incl. numeric `avg_priority`, cross-customer queries, guarded PATCH — only non-null fields applied; category/priority not clearable in v1), `api/admin.py` (6 routes, every one `Depends(require_admin)`, thin → service), router wired in `main.py`; `tests/test_admin_api.py` (11 tests incl. the 401/403 matrix over **every** admin route).
- **Frontend:** `api.ts` admin types + calls; `Protected` optional `role` prop with a "wrong area" screen; role-aware login/register redirect via `homePath`; `pages/admin/` — AdminLayout (section tabs), Overview (KPI + status cards → filtered list, priority bars, AI pipeline panel, recent tickets), TicketList (shareable `?status=` chips + table), TicketDetail (management panel with two-step **Confirm close**, AI review panel: chips/summary/editable suggested response/**Save & confirm** → Human-confirmed badge, messages thread, customer card), Customers (table); `/admin` routes nested under `Protected role="admin"`; `/portal` now `role="customer"`.
- **Verified:** pytest **47/47** (11 new) · `npm run lint` clean · `npm run build` passes · `impeccable detect` → `[]` · live vs Supabase **36/36** (incl. anon 401 / customer 403 spot checks, aggregates, filters, PATCH persistence, analysis confirm + provider provenance) — all temp admin/customer/ticket rows cleaned afterwards.
- En route fixes: stray placeholder route removed from `admin.py`; deprecated 422 constant updated; stale post-login `navigate()` (would strand admins on `/portal`) replaced by context-driven `<Navigate>`; react-hooks v7 lint findings (sync `setState` in effects, refs read in render) resolved using the portal pattern; an orphaned pre-M4 uvicorn worker kept answering `:8000` with the old app after restart → killed, admin routes confirmed live via OpenAPI.
- Status: TASK-005 **Completed** - user walkthrough confirmed ("Yes, all of it worked") + M4 committed as `46d182e` (20 files). Next: TASK-006 (M5 Workflows + Analytics) spec.

### 2026-09-28 (session 6 - M5 Workflows + Analytics, TASK-006)

- User approved TASK-006 → implemented end-to-end (4 flagged decisions accepted as written: tags migration, workflow-overrides-AI, notification = recorded event, `/api/admin/*` routing).
- **Migration:** `c633bb4d64f4` adds nullable `tickets.tags` (JSON) on Supabase; `alembic current` = head. `Ticket.tags` model field (pre-migration rows read `[]`), surfaced on admin ticket detail + `AdminTicketDetail` schema.
- **Backend:** `app/workflows/` package — `engine.py` own-session background entry that **never raises**: per-workflow DB savepoint isolation, exactly one `workflow_runs` row per evaluation (`success`/`skipped`/`failed`), flush-inside-savepoint so a failed workflow's partial actions roll back; AND conditions over status/priority/category/sentiment; 4 actions (`set_priority`, `add_tag`, `generate_suggested_response`, `record_notification`) with `{customer}`/`{subject}` templating and a human-confirmed guard. `schemas/workflow.py` enforces the PLAN §5 cap (fixed trigger, enum values, per-action limits, 5 conditions/5 actions). `services/workflow_service.py` (CRUD + run-count group query + windowed SQL analytics, UTC day zero-fill). `api/workflows.py` — 6 routes under `/api/admin/*`, all `require_admin`; `GET /api/admin/analytics?days=1..90` added to `admin.py`; second `BackgroundTasks` step after analysis in `POST /api/tickets`.
- **Frontend:** `api.ts` M5 types/calls + 204-safe `request()`; AdminLayout tabs (Workflows, Analytics); `/admin/workflows` list (summaries + run-count chips + empty state), `/admin/workflows/new` and `/:workflowId` form (condition/action row editors with per-type controls, capped rows, run history with JSON details, two-step delete), `/admin/analytics` (7/30/90 chips, KPI cards, status/category bars, daily column chart); workflow tag chips on admin ticket detail.
- **Tests (12 new in `test_workflows.py`):** authz matrix extension, cap validation (11 bad payloads), CRUD/404/422, full engine chain, skipped-on-mismatch, failed-action rollback, inactive skip, human-confirmed guard, tag dedupe, runs endpoint + cascade, analytics aggregates + bounds.
- **Verified:** pytest **59/59** ✅ `npm run lint` clean ✅ `npm run build` passes ✅ `impeccable detect` → `[]` ✅ live vs Supabase **34/34** (runs, actions, analytics deltas, authz, PATCH/DELETE semantics) ✅ migration on Supabase ✅ all e2e data cleaned (only the user's account remains).
- En route: **conftest safety fix** — `DATABASE_URL` now forced to `sqlite://` (closes the 2026-09-27 data-loss finding); stale/orphaned uvicorn workers kept serving pre-M5 code from `:8000` after restart (Windows spawn children outlive a killed reloader parent) → all killed, one clean instance, routes confirmed via OpenAPI; Analytics page lint error (sync `setState` in effect) fixed with the previous-view pattern.
- Status: TASK-006 **Completed** — user walkthrough confirmed ("i think its good") 2026-09-28; committed by the user as `3570f8d` and pushed to origin/master. Next: M6 spec (TASK-007), incl. the deferred real-AI-provider decision.

### 2026-09-28 (session 7 - M6 Demo Data + Polish + Handoff, TASK-007)

- User approved TASK-007 with two decisions: AI provider = **Ollama** (resolves PLAN D2) and demo tagging = **`is_demo` columns**. (Follow-up same day: **Ollama cloud** chosen over a local install — see the session-8 log below.)
- **Migration:** `4a2a875fb9dc` adds `is_demo` (Boolean NOT NULL, server default `false`) to `users` + `workflows` on Supabase; `alembic current` = head.
- **Seed:** `app/cli/seed_demo.py` — 1 demo admin + 4 customers + 12 tickets covering all 6 categories × 4 priorities × 3 sentiments × 4 statuses across 9 UTC days; analyses go through the real `analysis_service` (provider forced to `mock` during the seed for determinism, `AI_PROVIDER` restored after); 3 demo workflows → 27 runs covering all three states (billing success with tag + system notification, always-skipping rule, paused broken action recording one `failed`). Refuses double-seed with a clear error; `--remove` deletes only `is_demo` roots (ORM cascade takes the rest), idempotent.
- **Ollama provider:** `app/ai/ollama.py` — `POST /api/chat` with `format: "json"`, temperature 0, optional bearer for hosted endpoints; parse → raw dict → existing Pydantic gate; transport/format failures raise `OllamaError` → analysis service records `failed` (never-raises guarantee unchanged). Factory branch, `OLLAMA_*` settings, `.env.example` entries; `mock` stays the default.
- **Polish (R3):** audited all pages — loading/error/empty states, responsive grids, `overflow-x-auto` tables, `flex-wrap` form rows already consistent; one fix: admin 5-tab nav now `flex-wrap` (overflowed narrow screens).
- **Docs (R4/R5):** root `README.md` rewritten as the portfolio artifact (features, Mermaid diagram, setup incl. optional Ollama, seed instructions, structure, screenshot placeholders); `.ai/architecture.md` synced per its §17 rules (actual routes incl. the `/api/admin/*` reconciliation, resolved stack entries, real data model + is_demo/tags, JWT/roles, mock|ollama provider, new Decisions 6-7, current tech-debt list, present tense); `PLAN.md` D2 → Resolved, M3 decision point annotated, stale risk row replaced.
- **Tests (13 new):** `test_seed_demo.py` (coverage matrix, duplicate refusal, real-data survival + idempotent removal, CLI exit codes), `test_ollama_provider.py` (factory, JSON round-trip through the real schema gate, auth-header rules, bad-output/HTTP/connect failures, live test that skips without Ollama).
- **Verified:** pytest **72 passed, 1 skipped** ✅ `npm run lint` + `npm run build` clean ✅ `impeccable detect` → `[]` ✅ live Supabase seed → remove: before == after (1 non-demo user / 1 ticket / 0 workflows) ✅ `git status` reviewed — no `.env`/secrets ✅.
- Status: TASK-007 **Verification** — pending user e2e walkthrough (with demo data loaded) + live Ollama provider check (now Ollama cloud — see session 8) + user commit of M6 files.

### 2026-09-28 (session 8 - Ollama cloud switch)

- User decided: **use Ollama cloud** (no local install). Verified the provider needed **no code change** — it already appends `/api/chat` to `OLLAMA_BASE_URL` and sends `Authorization: Bearer` when `OLLAMA_API_KEY` is set, so cloud = `https://ollama.com` + key.
- **Live probe of the user's key:** `GET /api/tags` → 200, 17 cloud models listed. Chat-probed 4 candidates with the exact production prompt: `gpt-oss:20b` ✅ pure JSON/valid enums, `nemotron-3-nano:30b` ✅, `nemotron-3-super` ✅, `gemma4:31b` ❌ (wrapped JSON in markdown fences → would fail the Pydantic gate). **Chose `gpt-oss:20b`** (verified + cheapest, $0.07/M input; on the free plan's starter allowance).
- **Config:** `backend/.env` now `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_MODEL=gpt-oss:20b`, key in place (never committed).
- **Code/docs:** live-test readiness probe in `tests/test_ollama_provider.py` now sends the same bearer header (previously it could never see a cloud endpoint) and reports the endpoint in its skip reason; `.env.example`, `README.md`, `.ai/architecture.md`, `PLAN.md` D2, `config.py` comments synced to cloud-first (local kept as documented alternative); `decisions.md` gained the follow-up decision entry.
- **Verified:** `pytest` → **73 passed, 0 skipped** (the former live-Ollama skip now runs against the cloud).
- **Live e2e vs Supabase (AI_PROVIDER=ollama, real cloud model): PASSED** — health 200 → register 201 → ticket 201 → analysis row `status=COMPLETED`, `provider=ollama`, `category=billing`, `priority=HIGH`, `sentiment=NEGATIVE`, non-empty summary + suggested response, `error_message=null`; ticket write-back visible (`category=billing`, `priority=high` on the ticket). All e2e rows deleted afterwards (final DB: 1 user = the user's admin, 1 ticket = theirs, 0 workflows).
- **Bug found & fixed (test safety):** after `AI_PROVIDER=ollama` entered `backend/.env`, the suite silently started calling the real model — `test_submission_runs_mock_analysis_and_writes_back` failed and runtime jumped 22s → 235s. Root cause: `conftest.py` forced `DATABASE_URL` but not `AI_PROVIDER`. Fix: `os.environ["AI_PROVIDER"] = "mock"` unconditionally in `tests/conftest.py` (same pattern as the DB fix); the live Ollama test builds its own provider and is unaffected. Re-run → **73 passed in 21s**.
- **En route issues:** a zombie uvicorn (orphaned reload child) held port 8000 serving pre-cloud config → killed; first e2e attempt hit 422 (`message`, not `description` — schema field name); a temporary script named `inspect.py` shadowed the stdlib module (renamed); one leftover e2e user from the 422 attempt was found and deleted in cleanup.
- Status: TASK-007 still **Verification** — remaining: user walkthrough + screenshots + M6 commit.
