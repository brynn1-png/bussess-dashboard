# Decisions

## Current State Summary

- Key confirmed decisions: customer accounts with login (D1), mock-first AI provider (D2), Supabase-hosted PostgreSQL (D6), SQLite for tests only, `PLAN.md` approved with D3–D7.
- UI-pass decisions (2026-09-28): direction contract = *pneumatic-tube dispatch desk* (`.impeccable/surfaces/frontend-src.md`, seed `774ed214`); six-hue palette law with no green and priority-as-band-count; provenance carried by border style + head-strip color + typeface; seal signer persisted in `ai_analysis.confirmed_by` (migration `f3c9a1d70b52`); `panel-500` darkened to `#5e656c` for 4.85:1 on the ground; the skill's question rounds and decision page skipped per the user's "don't ask me" instruction.
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
- **Alternatives considered:** one global transaction per ticket (a single bad workflow would hide or abort every other result); `tickets.tags` as normalized table (premature for one capped action); real notification delivery (out of cap - PLAN §5); `/api/workflows` prefix (would create a second authz surface mid-milestone).

### 2026-09-28 - M6: Ollama provider, is_demo demo data, handoff docs

- **Decision (AI provider):** PLAN D2 resolved to **local Ollama** - `OllamaProvider` behind the existing `AIProvider` interface (`POST /api/chat` with JSON mode, temperature 0; `OLLAMA_BASE_URL`/`OLLAMA_MODEL`/`OLLAMA_TIMEOUT_SECONDS` and optional `OLLAMA_API_KEY` for hosted endpoints, all env-only). `mock` stays the default so tests, the seed, and reviewers work offline; enabling real analysis is `AI_PROVIDER=ollama` in `.env`.
- **Decision (demo data tagging):** demo rows are flagged with **`is_demo` boolean columns on `users` and `workflows`** (migration `4a2a875fb9dc`, server default `false`) instead of a naming namespace - explicit, queryable, PLAN-literal; customers/tickets/messages/analyses/runs are removed by FK/ORM cascade from those two roots. `--remove` only ever deletes rows where `is_demo = true` (test-proven: non-demo data survives).
- **Decision (seed determinism):** the seed temporarily forces `AI_PROVIDER=mock` (restored afterwards) so demo category/priority/sentiment/status coverage is reproducible and seeding never depends on Ollama running - while still driving the real `analysis_service` and workflow engine rather than inserting result rows directly.
- **Reasoning:** a local model closes the provider decision with no committed keys and no cost; the flag approach makes removal auditable; real-pipeline seeding means demo data exercises production code paths.
- **Alternatives considered:** OpenAI/Anthropic (paid key, breaks offline portfolio demo); naming-namespace seeding like `@demo.example.com` (zero migration but relies on naming discipline forever); inserting analysis/run rows directly (would bypass the very pipeline the demo is meant to show).

### 2026-09-28 (later) - M6 follow-up: Ollama endpoint = **Ollama cloud**

- **Decision (AI provider endpoint):** the `ollama` provider targets **Ollama cloud** (`OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_MODEL=gpt-oss:20b`, `OLLAMA_API_KEY` in `.env` only) instead of a local install - user decision 2026-09-28 ("we are gonna use ollama cloud").
- **Reasoning:** no local install required; `gpt-oss:20b` is on the free plan's monthly starter allowance and was live-verified to return pure JSON through the exact production prompt (all 5 keys, valid enums); cost is $0.07/M input if ever exceeded. The local install stays a config-only alternative (`localhost:11434`, no key, 100% free/unlimited).
- **Alternatives considered:** local Ollama (free/unlimited but needs an install the user doesn't want); `gemma4:31b` (free but wrapped JSON in markdown fences - would fail the Pydantic gate); `nemotron-3-super`/`nemotron-3-nano:30b` (work, but priced above `gpt-oss:20b` on paid usage).
- **Effect:** no code change was needed (the provider already sends a bearer key when configured); the live-test readiness probe in `tests/test_ollama_provider.py` now sends that same auth header so it can detect a cloud endpoint.

### 2026-09-28 - UI pass Phase 1: admin reply requires its own endpoint

- **Decision (scope correction):** the approved Phase-1 plan stated that `POST /api/tickets/{id}/messages` was admin-reachable and that **no API change was needed**. That claim was **wrong**: `ticket_service.add_message` -> `_owned_ticket` -> `_customer_of` raises `NotCustomerError` for any non-customer (**403**), and it hardcodes `sender=CUSTOMER`, so an admin reply would be both rejected and mislabelled. Caught by reading the service path before writing code; reported to the user and re-approved rather than silently expanding scope (`.ai/rules.md` risk handling).
- **Decision (admin reply):** a **separate** `POST /api/admin/tickets/{ticket_id}/messages` (201, `Depends(require_admin)`) with `admin_service.add_message` - no ownership check (admins already see every ticket) and `sender=ADMIN` - rather than relaxing the customer route. The customer route's 403 behaviour is left untouched.
- **Reasoning:** widening the customer route would need role conditionals inside an ownership-scoped function and would weaken a documented M2 guarantee; a dedicated admin route keeps both authz surfaces simple and lets the existing admin authz matrix (401/403) cover the new endpoint automatically. Reusing `AddMessageRequest` means identical content limits (1..10000) on both sides.
- **Alternatives considered:** role-aware customer route (buries authorization in a service that exists to enforce ownership); client-declared `sender` field (lets the caller forge authorship - sender stays server-set).


### 2026-09-28 - UI pass Phase 2: triage filter, retry, and error semantics

- **Decision (triage filter):** `?review=awaiting|confirmed` is a **server-side** query parameter on `GET /api/admin/tickets` (422 on anything else) rather than a frontend-only slice of an already-fetched list. Deep-linkable from the Overview KPI, correct against pagination/limits, shareable, and testable in the API suite.
- **Decision (retry instead of refresh):** a shared `LoadError` primitive (`role="alert"` + message + **Try again** + slot for a secondary link) replaces the eight "Refresh the page to try again." dead ends. Every page supplies an `attempt` counter (or its existing `reloadTicket`) so recovery happens in place - the older critique's "dead end" finding and Nielsen's error-recovery heuristic.
- **Decision (error vs. status semantics):** a failed load and a failed write are `role="alert"` red; **"Nothing changed — there's nothing to save" is `role="status"` slate**, because nothing went wrong. Red is reserved for things that actually need attention, which is what makes the remaining alerts readable.
- **Decision (derived loading):** `AdminTicketListPage` computes `loading` by comparing a query key (`status|review|attempt`) against the key of the data it already holds, instead of calling `setState("loading")` inside the effect. Required by `react-hooks/set-state-in-effect`, and it matches the pattern `AdminAnalyticsPage` already used, so no new idiom was introduced.
- **Reasoning:** client-side filtering would have made the "Awaiting review" KPI link lie about its count and forced the list into memory; a shared retry component removes the last copy-pasted error `<p>` and gives one place to get the semantics right.
- **Alternatives considered:** frontend-only filtering (rejected - see above); a modal "retry" dialog (heavier than an inline button for a list load); disabling Save when pristine without any message (chosen to keep both: the notice covers the race, disabling is left for Phase 4); `aria-live` on every notice (deferred to Phase 4 a11y).

### 2026-09-28 - UI pass Phases 3–4: visual identity, provenance, and the finish contract

- **Decision (process):** on the user's *"dont ask me , just finish all of it"*, the impeccable skill's per-step question rounds and its direction **decision page were skipped** and substituted with the assistant's own decisions; there is no image generation in this harness, so no comps, decision cards, or QUALITY BAR cards exist in this run. Disclosed in the final report and in `results.md`.
- **Decision (direction):** `concept-seed` roll `774ed214` assigned position 6 → build candidate **pneumatic-tube dispatch desk** (aluminium ground, engraved grooves instead of floating cards, Archivo = human matter / Courier Prime = machine matter). Recorded as the direction contract in `.impeccable/surfaces/frontend-src.md`; `PRODUCT.md` was written at the repo root because the skill's context step requires it (inferred facts labeled).
- **Decision (palette law):** six hues, one meaning each — route = needs a human, ink = a human marked it, signal = a machine has it, fault = failed/destructive, hazard = blocked/irreversible only, panel = idle. **Green is gone** and **priority is a count of signal bands, never a hue**; the row of four KPI tiles and pill badges on slate are named refusals in the THESIS.
- **Decision (provenance):** authorship is carried by *three* redundant channels — border style (dashed = unsealed, solid = sealed), head-strip color (grey `Machine`, blue `Human · …`), and **typeface** (Courier = the machine's own words, Archivo = what a person wrote). `SealBand`'s 380ms ink wipe is the single authored motion in the system.
- **Decision (signer on the seal):** the band stamps real initials, so the backend records **who** sealed — `ai_analysis.confirmed_by` (nullable `String(120)`, migration `f3c9a1d70b52`), set from `require_admin`'s `user.full_name` inside `update_analysis` and **cleared on unseal**. Rows sealed before the migration keep `NULL` and the band renders the timestamp without an initials plate rather than inventing a name. Rejected: guessing the signer from the currently-logged-in admin (wrong whenever a different admin views the record).
- **Decision (contrast token):** `--color-panel-500` darkened `#6e757c` → `#5e656c`, taking every small meta line from 3.83:1 to **4.85:1 on the aluminium ground** (5.9:1 on white) instead of patching the five flagged sites one by one; `DESIGN.md`'s token table was updated with it so the two documents stay one source of truth.
- **Decision (documentation reconciliation):** `DESIGN.md` originally asserted "prose never switches to Courier, however machine-authored it is", which contradicted the direction contract ("…and the AI's own words") and the applied fix. The contract is normative, so the doc was rewritten to the real rule: human words never in Courier, AI paragraphs never in Archivo — authorship and typeface must agree.
- **Alternatives considered:** frontend-only initials from the auth context (honest only when one admin exists — rejected as factually wrong for a second admin); patching only the five contrast sites (leaves the same defect everywhere else on the ground); keeping the analytics quartet because its cells were hairline-ruled rather than carded (the THESIS forbids the *arrangement*, not just the border).
