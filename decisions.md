# Decisions

## Current State Summary

- Key confirmed decisions: customer accounts with login (D1), mock-first AI provider (D2), Supabase-hosted PostgreSQL (D6), SQLite for tests only, `PLAN.md` approved with D3–D7.
- Full architecture decisions live in `.ai/architecture.md` §12; roadmap in `PLAN.md`.

---

## Decision Log

<!-- Format: date, decision, reasoning, alternatives considered -->

### 2026-09-27 — Customer identity: accounts with login

- **Decision:** Customers sign up / log in; tickets belong to an authenticated customer.
- **Reasoning:** Demonstrates full role-based access control in the portfolio project; avoids adding an email-provider dependency for magic-link ticket viewing.
- **Alternatives considered:** Open submission with email-based ticket lookup; hybrid (open + optional accounts). Both rejected for dependency/complexity reasons.

### 2026-09-27 — AI provider strategy: mock-first

- **Decision:** Build `backend/app/ai/` behind a provider abstraction with a deterministic mock provider; select the real provider before the AI milestone (M3).
- **Reasoning:** Lets all milestones proceed without an API key or cost; keeps provider swappable (architecture Decision 4).
- **Alternatives considered:** OpenAI, Anthropic, Ollama up-front — deferred to a decision point before M3.

### 2026-09-27 — Implementation plan created

- **Decision:** Project roadmap defined in `PLAN.md` (milestones M0–M6, workflow-engine scope cap, testing strategy).
- **Status:** Draft — awaiting user approval, including proposed decisions D3–D7 (ORM, auth mechanism, frontend tooling, dev database, notifications).

### 2026-09-27 — Plan approved; D3–D7 accepted

- **Decision:** User approved `PLAN.md` as written ("proceed"); D3 (SQLAlchemy + Alembic), D4 (JWT + bcrypt), D5 (Vite/React/TS/Tailwind/Router), D6, D7 accepted.

### 2026-09-27 — Test database: SQLite in-memory (test-only)

- **Decision:** Backend tests run against in-memory SQLite; the application's persistent store remains PostgreSQL (Supabase) per architecture.
- **Reasoning:** Supabase credentials deferred by user; SQLite lets M1 auth/model tests run now. Models use portable column types (JSON, not JSONB) to avoid PG-only features.
- **Mitigation:** The real Alembic migration on Supabase remains a required verification step before M1 is marked Completed.

### 2026-09-27 — D6 revised: Supabase instead of local PostgreSQL

- **Decision:** PostgreSQL will be hosted on **Supabase**; connection string via backend-only `.env`.
- **Reasoning:** User decision — no local PostgreSQL or Docker installed on the machine; Supabase provides hosted PostgreSQL.
- **Note:** Alembic migrations must use the direct/session connection (port 5432), never the transaction pooler (6543), which rejects DDL. Documented in `backend/.env.example` and `README.md`.

### 2026-09-28 — Supabase connection uses the session pooler (IPv4)

- **Decision:** `DATABASE_URL` points at the **session pooler** `aws-0-ap-southeast-1.pooler.supabase.com:5432` with username `postgres.<project-ref>` and scheme `postgresql+psycopg://`.
- **Reasoning:** The direct host (`db.<ref>.supabase.co`) publishes an **IPv6-only** DNS record and this development network is IPv4-only (`getaddrinfo` failed). The `pooler.<ref>.supabase.co` format does not exist for this project (NXDOMAIN). The pooler rejects a bare `postgres` username (`ENOIDENTIFIER`) because it is multi-tenant — the project ref must be in the username (`postgres.<ref>`).
- **Alternatives considered:** IPv4 add-on for direct connection (paid, unnecessary); transaction pooler 6543 (rejected — breaks DDL).
- **Impact:** Migrations and app traffic both go through port 5432 session pooling; format documented in `backend/.env.example` (no secrets committed).

### 2026-09-28 — M2: ticket access rules, message/description duplication, client auth storage

- **Decision (access):** Tickets/messages return **404** (not 403) for non-owners so existence is never leaked; customers may create tickets and append messages only — status transitions stay admin-only (M4); admin tokens get **403** on customer endpoints.
- **Decision (data):** The opening message is stored twice — as `tickets.description` (NOT NULL from M1) and as the first `ticket_messages` row — avoiding a schema migration.
- **Decision (client auth):** JWT kept in localStorage + `Authorization: Bearer` header (v1), consistent with the M1 API; HTTP-only cookie move deferred to a hardening pass.
- **Reasoning:** Non-disclosure matches `.ai/context.md` §4/§7; description duplication is cheaper and lower-risk than a migration mid-milestone; localStorage keeps the API unchanged.
- **Alternatives considered:** 403 responses (rejected — confirm a ticket exists to a stranger); making `description` nullable (rejected — requires migration, spec §6 gate); cookies (deferred, needs same-site/deployment review).

### 2026-09-28 — Portal visual direction: inherit + elevate

- **Decision:** Portal UI extends the existing M0 identity (slate background, ink text, emerald accent, Tailwind) instead of introducing a new palette/typography; HomePage stays as an entry point with login/register/portal links.
- **Reasoning:** User choice via design-skill probe; `.ai/architecture.md` §10 (portfolio polish) and an established visual world should be inherited rather than replaced (impeccable: "a section inherits its surface").
- **Alternatives considered:** strict scaffold-level styling (too plain for portfolio); bolder new identity (unnecessary divergence mid-product).

### 2026-09-28 — M3: analysis status lives on `ai_analysis`, trigger via BackgroundTasks, mock only

- **Decision (status):** Per-ticket analysis status is read from the existing 1:1 `ai_analysis.status` (`pending | completed | failed`) instead of adding the `tickets.analysis_status` column PLAN M3 wording implies — **no migration**; one source of truth.
- **Decision (trigger):** Analysis runs in a FastAPI `BackgroundTasks` step after the response, with its own DB session — creation is never slowed or failed by AI (PLAN M3 hard requirement); no Redis/Celery (architecture Decision 5).
- **Decision (provider):** Real provider selection **deferred** — user chose "mock only" at TASK-004 approval; select and implement before M4/M6 exit (PLAN M3 decision point, resolved as D2 mock-first as written).
- **Reasoning:** The 1:1 row already provides identical observable behavior; in-process background tasks are the smallest mechanism that separates AI from creation; mock keeps milestones moving at zero cost.
- **Alternatives considered:** `tickets.analysis_status` column (redundant + sync risk); synchronous analysis inside the request (blocks response with a real provider later); Celery/Redis (out of scope per architecture); real provider now (deferred — key/cost decision).

### 2026-09-28 — M4: separate admin surface, role-gated UI, permissive status PATCH

- **Decision (surface):** Admin capabilities live on a dedicated `/api/admin/*` route group where **every** route depends on `require_admin`; customer endpoints are unchanged. The `/admin` UI is gated by `Protected role="admin"` and `/portal` by `role="customer"` — admins opening the portal (or customers `/admin`) get a friendly "wrong area" screen instead of 403-littered pages. Login/register redirect by role (`homePath`: admin → `/admin`, customer → `/portal`).
- **Decision (updates):** `PATCH /api/admin/tickets/{id}` applies only non-null fields — invalid enum/too-long category/empty body → 422, unknown id → 404; **any valid status is allowed** (no transition matrix in v1), and category/priority cannot be *cleared* (backend treats `None` as "unchanged"; UI blocks blanks).
- **Decision (metrics):** Overview aggregates are computed server-side with SQL `GROUP BY` (frontend never aggregates); `avg_priority` is a numeric 1–4 mean (rounded, `null` when unassigned) shown alongside the full priority distribution to satisfy PLAN's literal "avg priority" wording for a categorical field.
- **Reasoning:** A separate admin surface keeps `require_admin` enforceable per-route (the authz matrix test covers all six); role-gated UI avoids rendering pages that would only error; permissive status changes defer workflow rules to M5 where they belong.
- **Alternatives considered:** role flags on customer routes (weaker audit surface); strict status transition matrix (no business rule demands it yet — spec §11); clearing category/priority via `null` (ambiguous with "absent = unchanged" PATCH semantics — rejected for v1).

### 2026-09-28 - M5: savepoint-isolated workflow engine, tags column, admin route surface

- **Decision (engine isolation):** Workflow evaluation runs as a second `BackgroundTasks` step (own session, after analysis) and evaluates each workflow inside a DB **savepoint**: a failing workflow records exactly one `failed` run with a sanitized error and its already-executed actions are **rolled back** (no half-applied automation), while other workflows and the request are unaffected; `success` and `skipped` (first mismatching condition recorded) each get their own run row. The engine never raises into a request.
- **Decision (data):** The `add_tag` action targets a new **nullable `tickets.tags` JSON column** (migration `c633bb4d64f4`); pre-migration rows read as `[]`. A join table was rejected as over-engineering for the capped v1.
- **Decision (precedence):** Workflow `set_priority` **overrides** the AI-suggested priority — configured automation wins over the M3 suggestion (documented so it is never surprising).
- **Decision (notification):** `record_notification` is a **recorded event** (run details + a system `ticket_messages` row) — no real delivery channels inside the PLAN §5 cap.
- **Decision (routes):** Workflow CRUD/runs live under `/api/admin/workflows` and analytics under `GET /api/admin/analytics`, all `require_admin`, extending the M4 authz pattern instead of the architecture's earlier `/api/workflows` sketch (reconciled in M6's architecture update).
- **Decision (test safety):** `tests/conftest.py` now **forces** `DATABASE_URL=sqlite://` — closes the data-loss risk flagged 2026-09-27 where `setdefault` could let tests `drop_all` a real database.
- **Reasoning:** Savepoint isolation is what makes "one run row per workflow" and "no partial application" hold when several workflows fire on one ticket; the admin route group keeps a single enforceable authz surface; the tags column is the smallest change that gives the capped action a target.
- **Alternatives considered:** one global transaction per ticket (a single bad workflow would hide or abort every other result); `tickets.tags` as normalized table (premature for one capped action); real notification delivery (out of cap — PLAN §5); `/api/workflows` prefix (would create a second authz surface mid-milestone).
