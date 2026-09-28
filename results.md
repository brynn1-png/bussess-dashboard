# Results

## Current State Summary

- M0 verified (`95fdc1d`); M1 **fully verified** (`9253b4c`): pytest 21/21 + Alembic migration on Supabase + live end-to-end auth on real PostgreSQL (session 2, 2026-09-28).
- M2 (TASK-003) **verified** 2026-09-28: pytest 31/31, lint+build clean, live ticket e2e 16/16, user walkthrough confirmed → Completed.
- M3 (TASK-004) **verified** 2026-09-28: pytest 36/36, lint+build clean, live analysis e2e 11/11 on Supabase → Completed (committed `1c66b85`).
- M4 (TASK-005) **verified & completed** 2026-09-28: pytest 47/47, lint+build clean, detector `[]`, live admin e2e 36/36 on Supabase, user walkthrough confirmed → Completed (committed `46d182e`).
- M5 (TASK-006) **verified & completed** 2026-09-28: pytest 59/59, lint+build clean, detector `[]`, migration `c633bb4d64f4` on Supabase, live workflow e2e 34/34, user walkthrough confirmed → Completed (committed `3570f8d`, pushed).
- M6 (TASK-007) **verified & completed 2026-09-28**: pytest 73/73 (0 skipped — live Ollama test now runs against the cloud), lint+build clean, detector `[]`, migration `4a2a875fb9dc` on Supabase, live seed→remove real-data-survival check, README + architecture sync, **Ollama cloud live e2e passed** (`provider=ollama`), **user walkthrough confirmed** → committed `136332b` (pushed). **Project handoff-ready: M0–M6 all complete.**
- **Post-handoff UI improvement pass verified 2026-09-28 (all four phases).** Phases 1–2 committed `c746c88` (on `origin/master`); Phases 3–4 + documentation verified with `tsc` exit 0, eslint 0 problems, **pytest 78 passed / 1 skipped**, `impeccable detect` `[]`, migration `f3c9a1d70b52` applied on Supabase, live `confirmed_by` round-trip, 7 validated captures. **Impeccable finish review: round 1 `fix` (5 material fixes) → round 2 `verdict: ship` — all five scored resolved.**
- Full details in the Result Log below.

---

## Result Log

<!-- Format: date, outcome, verification performed, effects -->

### 2026-09-28 - UI improvement pass, Phases 3–4: visual identity, a11y/polish, and the finish review

- **Outcome:** The critique's identity finding ("category-interchangeable", 27/40) is closed. A direction contract was drawn from a `concept-seed` roll (seed `774ed214`, position 6 → *pneumatic-tube dispatch desk*) and persisted at `.impeccable/surfaces/frontend-src.md`, then executed across all 16 pages: Tailwind v4 `@theme` tokens + a component layer in `index.css`, rewritten `ui.tsx` primitives, **self-hosted Archivo Variable + Courier Prime**, `lucide-react` at 1.75 stroke, both shells rebuilt (lucide station tabs, ink-stamp active state, identity stacked so all five admin tabs hold one row), and every `slate`/`blue`/`emerald`/`sky`/`amber`/`green`, `rounded-full` and hard shadow replaced. **Palette law:** route = needs a human, ink = a human marked it, signal = a machine has it, fault = failed, hazard = blocked, panel = idle — green eliminated, priority expressed as a *count* of signal bands. **Provenance:** machine sections are dashed with a grey `Machine` head, human sections solid with a blue `Human · …` strip, and a sealed record gets the `SealBand` ink wipe (380ms, the only authored motion). Phase 4 added `role="status"` notices, named Remove buttons, pristine-Save and empty-submit disabling, chart `role="img"` + aria-labels, and `aria-hidden` decorative bars. Contract alignment after the pass: H1 → **"Ticket line"**, rail legend → **"Stations"**, recent-tickets carrier table moved directly under the rail, and `KpiCard` replaced by a bordered readout strip.
- **Finish review:** a separate subagent ran the impeccable finish review against the surface brief, `PRODUCT.md`, `DESIGN.md`, the detector result and 7 captures.
  - **Round 1 → `fix`,** five material fixes: the seal stamped no initials; the AI's own words were set in Archivo; Analytics opened with the four-tile KPI quartet the THESIS forbids; `text-panel-500` on the aluminium ground measured 3.83:1; the top list row had a shadow but no 2px lift.
  - **Fix batch:** backend `ai_analysis.confirmed_by` (model, migration `f3c9a1d70b52`, `AnalysisResponse`, `ticket_detail`, `update_analysis(*, confirmed_by=)` cleared on unseal, route passing `user.full_name`) so the band can stamp a real signer; `SealBand` + `initialsOf()` render `[DA] CONFIRMED BY DEMO ADMINISTRATOR`; `analysis.summary` and the suggested-response textarea set in Courier; Analytics recomposed as readouts engraved on the aluminium between hairline rules; `--color-panel-500` → `#5e656c` (4.85:1 ground / 5.9:1 white); first list row lifted 2px with the lift space reserved on the `<ul>`.
  - **Round 2 → `verdict: ship`,** all five fixes scored resolved. Capture evidence: `desktop.png`, `mobile.png`, `desktop-tickets.png`, `desktop-ticket-detail.png`, `desktop-analytics.png`, `portal-ticket-detail.png`, `portal-mobile.png`.
- **Documentation:** `DESIGN.md` (token frontmatter + 8 canonical sections) and `.impeccable/design.json` (schemaVersion 2: 7 color ramps, 5 type roles, 5 shadows, 3 motion tokens, 3 breakpoints, 9 self-contained component snippets, 6 named rules, 7 dos / 7 donts); `PRODUCT.md` at the repo root with inferred facts labeled.
- **Verification performed:**
  - `npx tsc --noEmit` → exit 0; `npm run lint` → **0 problems**; `pytest` → **78 passed, 1 skipped**; `impeccable detect frontend/src` → `[]`
  - `alembic upgrade head` → `f3c9a1d70b52` applied on Supabase (uvicorn restarted — it runs **without** `--reload`); live round-trip `PATCH /api/admin/tickets/28/analysis` → `is_human_confirmed=true, confirmed_by="Demo Administrator"`, confirmed again via `GET`
  - 7 captures re-shot headless at 1280/390, all non-blank with 7 distinct SHA-256 hashes
- **Effects:** the build now answers the finish contract — "the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance" (this app ships no rasters at all: fonts and lucide icons only, so the raster-provenance clause is vacuous by construction).
- **Risks/notes:** (1) the skill's per-step question rounds and its direction **decision page were skipped** on the user's "don't ask me" instruction — decisions were the assistant's own and are disclosed here; (2) no image generation exists in this harness, so there are no comps / decision cards / QUALITY BAR cards; (3) the H1 sits *above* the station rail rather than *left of* it as the brief's FIRST VIEWPORT literally reads — recorded as a deliberate adaptation; (4) `confirmed_by` is nullable, so rows sealed before the migration show the band without an initials plate (the fallback is honest, not invented); (5) round 2's capture check hit a harness **image-delivery fault** (reads returning other files' bytes) — diagnosed with hashes + parent reads instead of reshooting blind, and the reviewer completed the pass on source plus parent-corroborated captures.

### 2026-09-28 - UI improvement pass, Phase 2: triage queue, delete confirmation, retryable errors (P1)

- **Outcome:** All three P1 critique issues fixed plus the first slice of P2. **Triage queue:** admins could not see which tickets awaited human confirmation - `GET /api/admin/tickets` now accepts `?review=awaiting|confirmed` (422 on other values), the summary schema exposes `analysis_status` + `is_human_confirmed` via a left join on `ai_analysis`, and the list page gained an AI filter group + AI badge column with URL-combinable status/AI filters and a Clear-filters action (the Overview "Awaiting review" KPI now links into it). **Destructive-action feedback:** arming the workflow delete now shows an amber `role="alert"` notice naming the workflow, its run count, and that there is no undo. **Error prevention:** "No changes to save." demoted from a red alert to a neutral `role="status"` note, and workflow validation names the failing row. **Dead ends:** the new shared `LoadError` replaced all 8 "Refresh the page to try again." messages; retry now works in place.
- **Verification performed:**
  - `pytest` → **79 passed** (3 new: `?review=` filter values, `?status=` ∩ `?review=` intersection, and the two new summary badge fields)
  - `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` → `[]`
  - **Live API e2e vs Supabase → 11/11:** `awaiting` rows all `completed`+unconfirmed, `confirmed` rows all human-confirmed, `?status=open&review=awaiting` intersects both axes, invalid `?review=` → 422, customer → 403, awaiting+confirmed ⊆ total, admin reply regression 201 `sender=admin`, customer→admin 403, anonymous 401
  - **Browser e2e:** both filter groups + AI column render; `?status=open&review=awaiting` returns exactly the 5 matching rows with both pills active; empty state offers Clear filters; amber delete notice carries `role="alert"`; clicking Save with no edits yields a neutral `role="status"` note with **0** red alerts; `LoadError` proven live by stopping uvicorn → "Could not load customers." + Try again → restarting → table loads with the alert cleared and **no page refresh**
- **Effects:** backend changed (route param + schema fields + 3 tests); 10 frontend files changed. One lint rule drove a redesign: `react-hooks/set-state-in-effect` forbids a synchronous `setState` in an effect, so `AdminTicketListPage` derives `loading` from a query key instead (the same trick `AdminAnalyticsPage` already used).
- **Risks/notes:** `LoadError`'s `retrying` prop is wired but no caller passes it yet (retry is instantaneous because state flips to loading first); the Analysis "Save draft" button is still enabled when nothing changed - only the *message* was de-reddened, so disabling it remains open for Phase 4.

### 2026-09-28 - UI improvement pass, Phase 1: admin reply loop (P0)

- **Outcome:** The critique's P0 ("admins can never send a reply") was confirmed and fixed, and it was deeper than reported: **no admin reply capability existed anywhere in the stack** — the only message route is ownership-scoped via `_customer_of` (admins get **403**) and hardcodes `sender=CUSTOMER`. New `POST /api/admin/tickets/{ticket_id}/messages` (201, `require_admin`, reused `AddMessageRequest` limits) + `admin_service.add_message` (404 unknown ticket, `sender=ADMIN`). Frontend: `addAdminTicketMessage()` and, on `AdminTicketDetailPage`, a **Reply to customer** composer plus the **"Use as reply ↓"** button that copies the AI's suggested response into it and focuses the box — the AI triage → human confirm → customer response loop is now closed end-to-end.
- **Verification performed:**
  - `pytest` → **76 passed** (3 new: admin reply recorded as `sender=admin` and reachable on another customer's ticket; 422 empty/oversize + 404 unknown; content trimmed + the customer-owned route still 403 for admins). New route added to the mandatory **401 anonymous / 403 customer** authz matrix.
  - `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` → `[]`
  - **Live e2e vs Supabase → 9/9:** admin reply 201 `sender=admin` · admin thread 2→3 · **customer's own thread shows the reply** · customer→admin route 403 · anonymous 401 · unknown ticket 404 · empty content 422 · 10 001-char content 422 · admin→customer route 403. Test message deleted afterwards (guarded script, verified ticket 22 back to its 2 original messages).
- **Effects:** the single most damaging critique issue (P0) is closed; admins can now answer customers, and the "Human-confirmed" badge no longer confirms text that goes nowhere.
- **Risks/notes:** the original plan asserted "no API change needed" — **that claim was wrong** and was caught by reading the service path before coding; scope change reported and user-approved rather than quietly expanded (`.ai/rules.md` risk handling). The uvicorn on `:8000` had been started **without `--reload`**, so it answered the new route 404 until restarted — one clean instance now runs. Work is **uncommitted**; Phase 2 (P1s) not started.

### 2026-09-28 — M6 close-out (session 9)

- **Outcome:** M6 exit criteria met. Demo seed loaded on Supabase and verified by SQL (5 demo users + 1 real admin, 12 demo tickets + 1 real ticket, 12 analyses, 3 workflows / 27 runs across all three run states); user performed the full e2e walkthrough against the running backend (`AI_PROVIDER=ollama`) and frontend and **confirmed it works**. TASK-007 → **Completed**, M6 → **Complete**, `PLAN.md` annotated. User committed everything as **`136332b`** (20 files) and pushed.
- **Verification performed:** seed row counts + coverage spread via direct SQL on Supabase · backend `/api/health` → `ok` (PID 1644) + frontend :5173 responding · post-commit secrets scan (API key absent from tracked files; `backend/.env` never in history) · `git status` clean and `master` in sync with `origin/master`.
- **Effects:** **project handoff-ready — all milestones M0–M6 complete.**
- **Risks/notes:** commit message `commit m5` actually contains M6 (already pushed → rewriting history not worth it); the Ollama API key appeared once in a session-shell output (`.env` is gitignored, never committed) → **user advised to rotate it**; demo data remains loaded (removable in one command); README screenshots still placeholders.

### 2026-09-28 — M6 follow-up: Ollama cloud live provider (session 8)

- **Outcome:** Real AI analysis now runs against **Ollama cloud** instead of a local install (user decision). No production-code change was required — `OllamaProvider` already appends `/api/chat` to `OLLAMA_BASE_URL` and sends `Authorization: Bearer` when `OLLAMA_API_KEY` is set, so cloud is config-only: `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_MODEL=gpt-oss:20b`, key in `backend/.env`, `AI_PROVIDER=ollama`. Model chosen by live probe of the user's key (`GET /api/tags` → 17 models; chat-probed 4 with the production prompt): `gpt-oss:20b` returned pure JSON with valid enums; `gemma4:31b` wrapped JSON in markdown fences (would fail the Pydantic gate → rejected); `nemotron-3-*` worked but cost more. Supporting changes: live-test readiness probe now sends the same auth header (it could never detect a cloud endpoint before), `tests/conftest.py` forces `AI_PROVIDER=mock` (a real regression — see below), docs synced (`.env.example`, `README.md`, `.ai/architecture.md`, `PLAN.md` D2, `config.py` comments), `decisions.md` follow-up entry.
- **Verification performed:**
  - `pytest` → **73 passed, 0 skipped** (live Ollama test now executes against the cloud instead of skipping)
  - **Live e2e vs Supabase with `AI_PROVIDER=ollama`: PASS** — health 200 → register 201 → ticket 201 → analysis `COMPLETED` / `provider=ollama` / `billing` / `HIGH` / `NEGATIVE` with non-empty summary + suggested response and `error_message=null`; ticket write-back confirmed (`category`/`priority` on the ticket row); all e2e rows deleted afterwards (DB back to 1 user = the user's admin, 1 ticket = theirs, 0 workflows)
  - **Regression found by re-running the suite:** with `AI_PROVIDER=ollama` in `.env`, tests began calling the real model — `test_submission_runs_mock_analysis_and_writes_back` failed and the suite went 22s → 235s. Fixed in `tests/conftest.py` by forcing `AI_PROVIDER=mock` unconditionally (same pattern as the existing `DATABASE_URL` force) → **73 passed in 21s**
- **Effects:** M6's last technical exit criterion (live real-provider check) is satisfied; only the user walkthrough, screenshots, and M6 commit remain.
- **Risks/notes:** Ollama **free plan** = a monthly starter allowance for starter models (1 concurrent request), not unlimited — larger models are pay-as-you-go; the API key briefly appeared in a shell output in this session (transcript-local only, `.env` is gitignored) → **user advised to rotate it**; zombie uvicorn worker holding port 8000 was killed during the switch; test suite stays offline/deterministic by construction now.

### 2026-09-28 — M6 Demo Data + Polish + Handoff (TASK-007)

- **Outcome:** Removable demo dataset (`is_demo` columns on `users`/`workflows`, migration `4a2a875fb9dc`): `python -m app.cli.seed_demo` creates a fictional business — 1 admin + 4 customers + 12 tickets spanning every category/priority/sentiment/status across 9 UTC days (populated analytics charts), analyses through the real pipeline (provider forced to `mock` for determinism), and 3 workflows producing 27 runs across `success`/`skipped`/`failed`; double-seed refused, `--remove` deletes only `is_demo` roots in one command. Real AI provider resolved (PLAN D2): `OllamaProvider` behind the existing `AIProvider` interface (`POST /api/chat` JSON mode, `OLLAMA_*` env config, optional bearer for hosted endpoints) — `mock` remains the default; failures raise `OllamaError` → analysis `failed`. UX polish audit found one issue (admin 5-tab nav overflow on narrow screens → `flex-wrap`). Handoff docs: portfolio README (features, Mermaid architecture, Ollama/seed setup, screenshot placeholders) and `.ai/architecture.md` synced per §17 (actual routes incl. `/api/admin/*` reconciliation, resolved stack, real data model, JWT/roles, Decisions 6-7, current tech debt), PLAN D2 marked Resolved.
- **Verification performed:**
  - `pytest` → **72 passed, 1 skipped** (13 new: seed coverage matrix/duplicate refusal/real-data survival/CLI exit codes; Ollama factory/JSON-gate/auth-header/bad-output/HTTP/connect failures; live-Ollama test skips when not running)
  - `npm run lint` clean; `npm run build` passes; `impeccable detect` → `[]`
  - `alembic upgrade head` → `4a2a875fb9dc` applied on Supabase, `alembic current` = head
  - Live Supabase: seed → output counts (5 users / 12 tickets / 12 analyses / 3 workflows / 27 runs) → `--remove` → non-demo counts identical to before (1 user / 1 ticket / 0 workflows)
  - `git status` reviewed: no `.env`, no secrets among the 11 modified + 7 new files
- **Effects:** Final milestone's build/seed/docs deliverables complete; project is walkthrough → commit away from handoff-ready.
- **Risks/notes:** ~~Ollama is not installed on the user's machine~~ **superseded 2026-09-28: Ollama cloud adopted** (`https://ollama.com` + `gpt-oss:20b`, free-plan starter allowance; 1 concurrent request / monthly allowance on the free plan); README screenshots are placeholders pending user capture (no browser tooling); the seed's forced `mock` provider means demo analyses are keyword-derived, not model-derived (by design, restored afterwards); a real (non-demo) active workflow in the user's DB will also evaluate seeded demo tickets — runs recorded under the real workflow survive `--remove` by design.

### 2026-09-28 — M5 Workflows + Analytics (TASK-006)

- **Outcome:** Capped workflow engine shipped (PLAN §5): `ticket.created` trigger → AND conditions (status/priority/category/sentiment) → 4 actions, evaluated as a second post-analysis background step with its own session. Each evaluation records exactly one `workflow_runs` row (`success`/`skipped`/`failed`); workflows are isolated by DB savepoints, so a failing workflow rolls back its partial actions and never corrupts other workflows or the request. New `tickets.tags` column (migration `c633bb4d64f4`) backs the `add_tag` action; `set_priority` overrides the AI suggestion; `record_notification` writes run details + a system message (no real delivery — cap). Config CRUD + run history on `/api/admin/workflows` (all `require_admin`), windowed aggregates on `GET /api/admin/analytics?days=1..90` (SQL GROUP BY, UTC day zero-fill — frontend never aggregates). Frontend: `/admin/workflows` list + row-editor form (conditions/actions with per-type controls, run history, two-step delete), `/admin/analytics` (7/30/90 windows, KPIs, status/category bars, daily chart), AdminLayout tabs, tag chips on admin ticket detail.
- **Verification performed:**
  - `pytest` → **59/59 passed** (12 new: authz matrix over all 7 new routes, 11 cap-violation payloads → 422, engine chain/mismatch/rollback/human-confirmed/dedupe, runs cascade, analytics aggregates + bounds)
  - `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` over all changed UI files → `[]`
  - `alembic upgrade head` → `c633bb4d64f4` applied on Supabase, `alembic current` = head
  - Live vs Supabase through running uvicorn → **34/34**: authz spot checks, 2 workflows + invalid-trigger 422, ticket chain (escalate run `success` with priority `urgent` + tag `e2e` + rendered system message; skip run `skipped` with category mismatch detail), list `run_counts`, analytics deltas all +1, PATCH/DELETE/404 semantics — all temp rows deleted afterwards (only the user's account remains)
- **Effects:** Automation + analytics milestone complete; M6 (integrations/hardening) can build on the run history and `/api/admin/*` surface.
- **Risks/notes:** `tests/conftest.py` safety fix applied (DATABASE_URL now forced to `sqlite://` — closes the 2026-09-27 data-loss finding); orphaned uvicorn workers from prior sessions served stale code from `:8000` and were killed (Windows spawn children outlive a killed reloader parent) — one clean instance now runs; UI walkthrough not run here (no desktop browser) — user's manual step; analytics days bucket in UTC (local "today" can differ near midnight).

### 2026-09-28 — M4 Admin Dashboard (TASK-005)

- **Outcome:** Full admin console shipped. Backend: 6 `/api/admin/*` routes, all behind `require_admin` (first real exercise of the M1 guard) — overview with server-side SQL aggregates (status counts, priority distribution + numeric `avg_priority`, customers, AI pipeline counts incl. `human_confirmed`/`awaiting_review`, 5 recent tickets), cross-customer ticket list with `?status=` filter, full detail (messages + customer + analysis), guarded PATCH updates (status/category/priority; 422 on invalid/empty bodies, 404 unknown), AI review PATCH (`suggested_response` + `is_human_confirmed` — provenance preserved), customers list with `ticket_count`. Frontend: `/admin` area (role-gated layout with section tabs), overview cards/bars/panels, filterable ticket table, ticket detail with management panel (two-step **Confirm close**) and AI review panel (editable suggested response → **Save & confirm** → Human-confirmed badge), customers table; login/register redirects are role-aware (admin → `/admin`); `/portal` is customer-only with a friendly "wrong area" screen for admins.
- **Verification performed:**
  - `pytest` → **47/47 passed** (11 new; authz matrix asserts **401 anonymous / 403 customer on every admin route** with valid bodies so only auth can fail)
  - `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` over all changed UI files → `[]`
  - Live vs Supabase through running uvicorn → **36/36**: authz spot checks, overview aggregates (incl. AI `completed ≥ 2` from the mock pipeline), list + filter + 422, detail (customer/messages/analysis `completed`), PATCH persistence + 422/404 paths, analysis edit+confirm persisted with `provider` provenance, customers `ticket_count=2` — all temp rows deleted afterwards
- **Effects:** M5 (workflows/automation) can build on managed ticket state; AI suggestions now have a human sign-off trail required by context §4.
- **Risks/notes:** UI walkthrough not run here (no desktop browser connected) — falls to the user's manual step; last-write-wins on concurrent status edits (accepted v1 debt, TASK-005 §9); category/priority cannot be cleared in v1 (PATCH `None` = unchanged); an orphaned pre-M4 uvicorn worker briefly kept serving the old app from `:8000` after a restart — killed and confirmed live.

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
