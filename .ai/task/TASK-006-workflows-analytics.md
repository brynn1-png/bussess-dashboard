# TASK-006: Workflows + Analytics (M5)

**Status:** Completed — walkthrough confirmed 2026-09-28; commit pending

**Created:** 2026-09-28

**Basis:** `PLAN.md` §M5 + §5 (Workflow Engine Cap), `.ai/architecture.md` §Workflow Layer, `.ai/context.md` §3 (Workflow/Workflow Run), §4 (business rules), §6 (data behavior), §7 (permissions).

---

## 1. Objective

Make the platform *do* something: let an admin configure capped automation rules (`ticket.created` → conditions → actions) that run automatically after a ticket arrives, with every evaluation recorded honestly (`success` / `failed` / `skipped`), and add a DB-derived analytics page so trends are visible — no client-side math.

---

## 2. Problem

Tickets and AI results exist (M3) and are manageable (M4), but nothing is *automated* and nothing is *measured over time*. The `workflows` / `workflow_runs` tables have sat empty since M1, and context §4 rules ("actions only when conditions are satisfied", "failed automation must not silently appear as successful") have no implementation enforcing them yet.

---

## 3. Requirements

### Engine (hard cap — `PLAN.md` §5, changes need plan revision)

- **Trigger:** `ticket.created` only (single).
- **Conditions:** `category is` / `priority is` / `sentiment is` / `status is`, **AND combination only**, evaluated against the ticket + its analysis snapshot.
- **Actions:** `set priority`, `add tag`, `generate suggested response`, `record notification event`.
- **UI:** config forms, not a visual builder.

### Backend

- **Engine package** `backend/app/workflows/` (mirrors `app/ai/` layout): `engine.py` with a background entry point `evaluate_ticket_workflows(ticket_id)` — own DB session, **never raises into the request chain** (same discipline as `analysis_service`), defensive against malformed stored JSON.
  - Only `is_active=True` workflows with `trigger == "ticket.created"` are evaluated (inactive → no run row).
  - Evaluation always records exactly one `workflow_runs` row:
    - conditions not met → `skipped` (+ details: which condition failed)
    - all actions completed → `success` (+ details per action)
    - any action fails → `failed` + sanitized error, remaining actions not executed — **never reported as success** (context §4)
- **Trigger wiring:** `POST /api/tickets` adds a second `BackgroundTasks` step *after* `analyze_ticket` (Starlette runs them in order), so conditions see AI write-back (category/priority/sentiment). Trigger remains `ticket.created`; evaluation simply runs at the end of the creation pipeline. If analysis failed/absent, evaluation still runs — fields that are `None` simply cannot match.
- **Action semantics:**
  - `set_priority` → writes `tickets.priority` (workflow config overrides the AI suggestion — deterministic, documented).
  - `add_tag` → appends to `tickets.tags` (JSON array, deduplicated). **Requires migration:** add nullable `tickets.tags` JSON column (additive, no data touched); `None` treated as `[]` for pre-existing rows.
  - `generate_suggested_response` → fills `ai_analysis.suggested_response` using the configured template with `{customer}` / `{subject}` substitution; **never overwrites when `is_human_confirmed=True`** (action recorded as `success` with a `skipped: human-confirmed` note in details — a guard, not a failure).
  - `record_notification` → records the event in run `details` **and** appends a `ticket_messages` row (`sender=system`, configured text with the same substitutions) so it is visible in existing threads without new tables.
- **Config API** — all under `/api/admin/*`, every route `Depends(require_admin)` (M4 pattern; extends the authz matrix):

| Route | Purpose |
|---|---|
| `GET /api/admin/workflows` | List all (id, name, active, trigger, conditions, actions, run counts) |
| `POST /api/admin/workflows` | Create → 201 |
| `GET /api/admin/workflows/{id}` | Detail |
| `PATCH /api/admin/workflows/{id}` | Update name/active/conditions/actions |
| `DELETE /api/admin/workflows/{id}` | Delete (runs cascade) |
| `GET /api/admin/workflows/{id}/runs` | Recent runs, newest first (limit 20) |
| `GET /api/admin/analytics?days=30` | `by_status`, `by_category`, `by_day` (zero-filled, 1–90 days, invalid → 422), `ai: {completed, human_confirmed}` — all SQL `GROUP BY` |

- **Validation (422, backend authoritative):** name 1–120; `trigger` must equal `ticket.created`; ≤5 conditions, field ∈ the 4 allowed, value ∈ enum for priority/sentiment/status (category free text ≤50); 1–5 actions, type ∈ the 4 allowed, per-type value validation (priority enum; tag ≤30; template/message ≤1000/200).
- Thin routes → `services/workflow_service.py` (CRUD + queries); config schemas in `schemas/workflow.py`.
- Analytics day bucketing via portable `func.date(created_at)` (works on SQLite tests + PostgreSQL live).

### Frontend

- **Nav:** AdminLayout gains **Workflows** and **Analytics** tabs (5 total).
- `/admin/workflows` — list: name, active badge, condition/action summaries, per-row link; "New workflow" button. Empty state explains the cap (form-based, `ticket.created`).
- `/admin/workflows/new` + `/admin/workflows/:id` — config form: name, active toggle; **conditions as removable rows** (field dropdown + value input/enum dropdown, AND-only note); **actions as typed rows** (type dropdown + its parameter control); trigger shown as fixed/read-only. Edit page shows the last 20 runs (status badge success/failed/skipped + expandable details) and a two-step **Delete** confirmation.
- `/admin/analytics` — cards (total, window count, avg/day), horizontal bars for status + category, 30-day volume bar chart (narrow CSS bars), AI-completed vs human-confirmed comparison. **All numbers come from the API response.**
- Admin ticket detail: show `tags` chips in the header (makes `add_tag` visible); ticket list gains no new column (v1).
- Loading/error/empty states everywhere; same slate/emerald identity; impeccable craft-floor + detector on new pages.

### Out of Scope (v1)

Visual builder, OR/NOT conditions, other triggers (`status.changed`, `message.created`), scheduling, retries, real notifications (email/SMS/webhooks), workflow edit history, pagination, custom analytics windows beyond `?days`, chart libraries.

---

## 4. Acceptance Criteria

- [ ] Migration: `tickets.tags` added; `alembic upgrade head` applied to Supabase; existing rows unaffected
- [ ] Pytest (PLAN M5 verification): conditions match → actions executed + run `success` recorded
- [ ] Pytest: conditions not met → **no** action executed, run recorded `skipped`
- [ ] Pytest: action failure → run recorded `failed` (never `success`); engine never raises
- [ ] Pytest: background chain — `POST /api/tickets` → analysis then workflow run both recorded
- [ ] Pytest: inactive workflow → no run; human-confirmed suggested response not overwritten; tag dedupe
- [ ] Pytest: authz matrix extended — every new route → 401 anonymous / 403 customer; CRUD/analytics validation 422s, unknown id 404
- [ ] Pytest: analytics aggregates correct against seeded data (status/category/day/ai counts, zero-fill)
- [ ] `npm run lint` + `npm run build` pass; `impeccable detect` clean on new pages
- [x] Manual UI walkthrough (user): create a workflow via the form → new ticket triggers it → run appears as `success` with actions applied → analytics numbers match seeded data — confirmed 2026-09-28
- [ ] No secrets committed

---

## 5. Scope

### In Scope
- `backend/app/workflows/` engine, `schemas/workflow.py`, `services/workflow_service.py`, `api/workflows.py` + analytics endpoint in `api/admin.py`, Alembic revision (`tickets.tags`), `tests/test_workflows.py` + `tests/test_analytics.py` (or combined)
- Frontend: `pages/admin/AdminWorkflowsPage.tsx`, `AdminWorkflowFormPage.tsx`, `AdminAnalyticsPage.tsx`, nav + routes + `api.ts` additions, tags chips on admin ticket detail
- TASK-006 verification + logs

### Out of Scope
See §3.

---

## 6. Technical Approach

```text
Backend
  app/workflows/engine.py       → evaluate + execute + record (own session, never raises)
  app/api/workflows.py          → CRUD + runs (prefix /api/admin/workflows, require_admin)
  app/api/admin.py              → + GET /api/admin/analytics
  app/services/workflow_service.py → config CRUD, run queries, analytics aggregates
  app/schemas/workflow.py       → WorkflowCreate/Update/Response, RunResponse, AnalyticsResponse
  app/api/tickets.py            → + second background step (after analysis)
  alembic: tickets.tags (JSON, nullable)

Frontend
  services/api.ts               → workflow + analytics types/calls
  pages/admin/                  → workflows list, workflow form (+runs), analytics
  App.tsx / AdminLayout.tsx     → routes + tabs
```

- Engine failure injection test: insert a workflow with an unknown action type directly (bypasses API validation) → evaluation → run `failed` (proves the defensive path the API can't reach).
- Tests follow existing fixtures (SQLite, `client` + `db_session`, admin token helper from TASK-005).

---

## 7. Affected Areas

### Files / Modules
- New: `backend/app/workflows/`, `api/workflows.py`, `schemas/workflow.py`, `services/workflow_service.py`, migration revision, tests, 3 admin pages
- Modified: `app/api/tickets.py` (one `add_task` line), `api/admin.py` (analytics route), `api/admin.py` tests (matrix), `AdminLayout.tsx`, `App.tsx`, `api.ts`, admin ticket detail (tags chips)

### Database
- **Migration:** `ALTER TABLE tickets ADD COLUMN tags JSON NULL` — additive; no data rewrite. Reads on `workflows`/`workflow_runs`; writes on `tickets`, `ticket_messages` (system rows), `ai_analysis.suggested_response`.

### APIs
- New `/api/admin/workflows*` (6) + `/api/admin/analytics` (1); no existing endpoint changes (only an extra background step on ticket creation).

### UI
- Two new nav tabs; three new pages; admin detail gains tag chips.

---

## 8. Dependencies
- M4 complete (`46d182e`) — authz matrix, admin shell, review UI to display runs/tags
- M3 complete — analysis runs before workflows in the background chain
- M1 artifacts: `Workflow`/`WorkflowRun` models, `RunStatus` enum

## 9. Risks
- **Scope creep is the named project risk** (PLAN §6) — the §5 cap is absolute; anything beyond it goes back to you as a plan revision.
- **Background chain grows** (create → analysis → workflows, sequential): fine for v1 (architecture Decision 5); a slow provider later lengthens it — noted, not solved here.
- **Workflow overrides AI priority** — configured automation wins over the M3 suggestion; documented in Notes so the behavior is never surprising.
- **JSON config in DB** can bypass API validation (legacy/manual rows) → engine treats unknown fields/types as action failure, recorded `failed`.
- **Migration on live Supabase** — additive column, low risk; applied + verified during implementation.

## 10. Verification
- [x] `pytest` full suite green (existing 47 + new) — **59/59**, 12 new in `tests/test_workflows.py`
- [x] Migration applied + verified on Supabase — revision `c633bb4d64f4` (nullable `tickets.tags`); `alembic current` = head
- [x] `npm run lint` + `npm run build` + detector — eslint clean, tsc+vite build passes, `impeccable detect` → `[]`
- [x] Live e2e vs Supabase: create workflow → create ticket → run recorded + actions visible — **34/34** checks; all temp data cleaned
- [x] Manual UI walkthrough (user) — confirmed "i think its good" 2026-09-28
- [x] Changed files reviewed; no secrets tracked; logs updated

## 11. Notes
- **Route naming:** architecture §Routes sketched `/api/workflows` + `/api/analytics`; M4 established the authoritative `/api/admin/*` + `require_admin` pattern, so new routes live there for one uniform authz surface (M6's planned architecture update will record the reality).
- **Notification action = recorded event, not delivery** — v1 writes it into run details + a system message; real channels are out of cap.
- **Analytics "day" uses UTC dates** (both SQLite `CURRENT_TIMESTAMP` and PostgreSQL `now()` store UTC) — bucketing is consistent live and in tests.
- **Suggested-response template placeholders:** `{customer}`, `{subject}`; unknown placeholders left literal.

## 12. Verification Record (2026-09-28)

- **pytest → 59/59 passed** (47 existing + 12 new): authz matrix (7 new routes × anonymous 401 / customer 403), cap validation (11 invalid payloads → 422), CRUD + 404/422 paths, engine chain (condition match → priority override + tag + rendered system message + `success` run), condition mismatch → `skipped` with `mismatched` detail, injected invalid action → `failed` run **with first action rolled back**, inactive workflow → no runs, human-confirmed suggestion never overwritten on re-evaluation, tag dedupe on re-run, run counts + delete cascade, analytics aggregates (by_status/by_category/by_day zero-fill/AI counts) + `days` bounds 422.
- **Migration:** `c633bb4d64f4_add_ticket_tags` autogenerated (only `tickets.tags` detected) and applied to Supabase; `alembic current` → head.
- **Frontend:** `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` over all 7 changed/new UI files → `[]`. En-route lint fix: Analytics page refetch no longer calls `setState` synchronously in the effect (previous-window-stays pattern).
- **Live e2e vs Supabase (running uvicorn) → 34/34:** register/authz spot checks (401/403/422), analytics baseline, 2 workflows created (+ invalid trigger 422), ticket created → escalate run `success` (priority `urgent`, tag `e2e`, system message `E2E alert: Refund my duplicate charge`, category `billing` from analysis) and skip run `skipped` (mismatch `category: expected technical_support, actual billing`), list `run_counts`, analytics deltas (total/today/billing/AI all +1), empty PATCH 422, rename 200, unknown DELETE 404, DELETE 204 → runs 404. Cleanup verified: 0 workflows, 0 temp users/tickets — only the user's own account remains.
- **Safety fix (was planned for pre-M6):** `backend/tests/conftest.py` now *forces* `DATABASE_URL=sqlite://` — the previous `setdefault` (flagged 2026-09-27) could let a shell-exported URL make tests `drop_all` a real database.
- **En-route infra issue:** orphaned uvicorn processes from earlier sessions kept answering `:8000` with pre-M5 code after a restart (Windows multiprocessing spawn leaves children alive when the reloader parent dies). All python/uvicorn processes killed, one clean instance started, M5 routes confirmed via OpenAPI before e2e.
- **Pending:** ~~user manual UI walkthrough~~ ✅ confirmed 2026-09-28 (create workflow → new ticket → run success + tag + notification + analytics all worked) → **TASK-006 Completed**; M5 files await the user's commit.
