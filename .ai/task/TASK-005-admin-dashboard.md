# TASK-005: Admin Dashboard (M4)

**Status:** Completed — walkthrough confirmed 2026-09-28; committed as `46d182e`

**Created:** 2026-09-28

**Basis:** `PLAN.md` §M4, `.ai/architecture.md` §6/§7/§10, `.ai/context.md` §2 (admin), §4 (business rules), §7 (permissions), §10 (UX expectations).

---

## 1. Objective

Give the administrator a real workspace: see the state of support at a glance, manage every ticket (status/category/priority), review and confirm AI-generated responses as **human-approved**, and browse customers — all behind `role=admin`, with customers locked out at every layer.

---

## 2. Problem

Tickets and AI analyses are being produced but only the *customer* side can see anything. No one can move a ticket `open → in_progress → resolved`, no one sees other customers' tickets, and the AI results M3 generates (including the suggested response) have no screen and no way to be human-confirmed — which `.ai/context.md` §4 requires before an AI reply counts as real support output.

---

## 3. Requirements

### Backend — new `/api/admin/*` routes (all `require_admin`)

| Route | Purpose |
|---|---|
| `GET /api/admin/overview` | Counts: tickets by status (open/in_progress/resolved/closed), by priority (+ numeric `avg_priority` 1–4), total customers; AI state: completed/pending/failed, `human_confirmed` vs `awaiting_review`; plus 5 most recent tickets |
| `GET /api/admin/tickets` | **All** tickets (every customer), newest first; optional `?status=` filter |
| `GET /api/admin/tickets/{id}` | Full detail: ticket + messages + customer info (`id`, name, email) + AI analysis (or `null`) |
| `PATCH /api/admin/tickets/{id}` | Partial update: `status` (enum), `category` (≤50), `priority` (enum incl. `urgent`) — unknown ticket → 404, invalid body → 422 |
| `PATCH /api/admin/tickets/{id}/analysis` | Edit `suggested_response` and/or set `is_human_confirmed=true`; no analysis row yet → 404 |
| `GET /api/admin/customers` | Read-only list: name, email, created_at, ticket_count (v1: no edits/deletes) |

- Routes thin → `services/admin_service.py` (queries + update logic); schemas in `schemas/admin.py`.
- **Status transitions:** v1 lets an admin set any valid status (no transition matrix); documented, tested via enum validation (422 on garbage).
- **Human-confirmed semantics:** confirming keeps a provenance trail — `is_human_confirmed=true` marks admin sign-off on the suggested response (edited or as-is). The distinction AI-generated vs human-confirmed must survive in the data (context §4).
- Existing customer routes unchanged — customers still get 404 on foreign tickets, 403 on every `/api/admin/*`.

### Frontend

- **Role-aware auth:** successful login redirects admins → `/admin`, customers → `/portal` (customers keep current behavior). `Protected` gains an optional `role` gate: admin-only routes show non-admins a "not authorized" state (or bounce to their home) — never render admin UI to customers.
- **Routes** (nested under `Protected role="admin"` + `AdminLayout` shell reusing the portal header pattern):
  - `/admin` — **Overview**: stat cards (status counts, customers, awaiting AI review), avg priority, recent tickets table linking into detail
  - `/admin/tickets` — **All tickets**: status filter chips, status/priority badges, customer name column, link to detail
  - `/admin/tickets/:id` — **Ticket detail**: messages thread, customer panel, **management panel** (status/category/priority controls with loading + confirmation before `closed`), **AI analysis panel**: category, sentiment, priority, summary, suggested response — labeled *"AI-generated"* until confirmed, then *"Human-confirmed"* badge; edit textarea + "Confirm response" action
  - `/admin/customers` — read-only table (name, email, tickets, joined)
- UX per context §10: loading/error states everywhere, confirmation on the destructive change (closing), responsive, same slate/emerald identity (inherit + elevate).
- **No design-skill re-load needed** — impeccable already active this session; craft-floor checks apply to new pages.

### Out of Scope (v1)
- Customer edits/deletes, password resets, bulk actions, pagination (note if lists grow), notifications, workflow config (M5), analytics charts (M5).

---

## 4. Acceptance Criteria

- [x] Pytest: **every** `/api/admin/*` route → 401 without token, **403 with customer token** (mandatory authz matrix)
- [x] Pytest: overview counts correct against seeded tickets (statuses + priorities + avg + recent)
- [x] Pytest: admin ticket list returns tickets from **multiple** customers
- [x] Pytest: PATCH status/category/priority persists; invalid enum/category too long → 422; unknown id → 404
- [x] Pytest: PATCH analysis — edit text + confirm → stored, `is_human_confirmed=true`; no analysis → 404; customer → 403
- [x] Pytest: customers list includes correct `ticket_count`
- [x] Existing suite still green (36/36 + new → 47/47)
- [x] `npm run lint` + `npm run build` pass
- [x] Manual UI walkthrough (user, admin account via `python -m app.cli.create_admin`): overview numbers match reality → open a ticket → change status → edit + confirm AI response (badge flips) → customer account still can't reach `/admin` — **confirmed by user 2026-09-28**
- [x] No secrets committed

---

## 5. Scope

### In Scope
- Backend: `api/admin.py`, `schemas/admin.py`, `services/admin_service.py`, tests
- Frontend: role-aware login redirect + `Protected` role gate, `pages/admin/*` (layout, overview, ticket list, ticket detail, customers), `api.ts` admin calls
- TASK-005 verification + logs

### Out of Scope
See §3 — plus anything M5 (workflows, analytics charts) delivers.

---

## 6. Technical Approach

```text
Backend
  app/api/admin.py          → thin routes; every one Depends(require_admin)
  app/schemas/admin.py      → OverviewResponse, AdminTicket*, UpdateTicketRequest,
                              UpdateAnalysisRequest, CustomerListResponse
  app/services/admin_service.py → aggregate counts (SQL func), all-tickets queries,
                              guarded updates, confirmed-analysis writes
  (reuse: require_admin from api/deps.py — built in M1, untested against real
   routes until now → this milestone proves it)

Frontend
  services/api.ts           → admin functions (typed PATCH bodies)
  features/auth/            → Protected gains role prop; login redirect by role
  pages/admin/AdminLayout.tsx, OverviewPage.tsx, TicketListPage.tsx,
                            TicketDetailPage.tsx, CustomersPage.tsx
  App.tsx                   → /admin nested routes
```

- Tests: SQLite fixtures (existing pattern); admin token helper = create admin row + `create_access_token` (proven in M2).
- Overview numbers: SQL `GROUP BY` counts computed server-side — the frontend never aggregates (architecture: DB-derived only, PLAN M5 wording applies here too).

---

## 7. Affected Areas

### Files / Modules
- New: `backend/app/api/admin.py`, `backend/app/schemas/admin.py`, `backend/app/services/admin_service.py`, `backend/tests/test_admin_api.py`, `frontend/src/pages/admin/*`
- Modified: `frontend/src/{App.tsx, services/api.ts, features/auth/Protected.tsx, pages/LoginPage.tsx}` (role redirect)

### Database
- Reads on `tickets`, `ticket_messages`, `customers`, `users`, `ai_analysis`; writes on `tickets` + `ai_analysis.suggested_response/is_human_confirmed` — **no schema change**

### APIs
- New `/api/admin/*` surface (6 routes); no existing endpoint changes

### UI
- New `/admin` area; login redirect becomes role-aware (customer flow regression-tested manually)

---

## 8. Dependencies
- M3 complete (TASK-004, commit `1c66b85`) — AI rows exist to review
- M1 artifacts now exercised: `require_admin`, admin CLI, `UserRole`

## 9. Risks
- **Authz is the risk zone** — the 403/401 matrix test runs over *every* admin route; a single leak fails the task.
- **Login redirect change** could strand customers → manual regression: customer logs in → lands in portal as before.
- **Last-write-wins** on status edits (two admins, no optimistic locking) — acceptable v1, noted as debt.
- **Confirming AI output incorrectly** → data keeps the distinction (`is_human_confirmed`), UI must never show confirmed text as AI-generated or vice versa.
- **Admin account bootstrap:** walkthrough requires the CLI (`python -m app.cli.create_admin`) — documented in verification steps.

## 10. Verification
- [x] `pytest` — authz matrix + new tests + full suite green (47/47)
- [x] `npm run lint` + `npm run build`
- [x] Manual admin walkthrough (user) incl. customer-blocked check — confirmed 2026-09-28
- [x] Changed files reviewed; no secrets tracked

## 11. Notes
- **PLAN deviation (minor):** PLAN says "avg priority" — priority is categorical, so the overview returns both the distribution (useful) and a numeric `avg_priority` (low=1 … urgent=4, rounded) to satisfy the literal requirement.
- Status transition matrix deliberately not enforced in v1 (any valid status allowed); revisit only if a business rule demands it.
- **Update-on-write semantics:** PATCH applies only non-null fields — category/priority cannot be *cleared* in v1 (backend treats `None` as "unchanged"); the UI prevents blank submissions instead.
- **Overview "recent tickets":** implemented as linked card rows (portal-consistent styling) rather than a table — same information, same links.
- **Login redirect:** the post-login `navigate()` call was removed — it captured a stale `user` and would always send admins to `/portal`; redirect now comes from the authenticated `<Navigate>` reading role from context.

---

## 12. Verification Record (2026-09-28)

- **Backend:** `pytest` → **47/47 passed** — 11 new tests: authz matrix (6 routes × anonymous **401** / customer **403**, valid bodies so only auth can fail), overview counts + `avg_priority` (1+4+3)/3 ≈ 2.67 + AI counts + recent-ticket set, empty-DB overview (`avg_priority` null, `recent []`), cross-customer list + `?status=` filter + invalid filter 422, detail (customer e-mail / messages / analysis), PATCH persist + bogus enum 422 + category >50 422 + empty body 422 + unknown id 404, analysis edit+confirm (persisted + provenance via `is_human_confirmed` + other ticket untouched) + empty 422 + unknown 404, missing analysis row → 404, customers `ticket_count` 2/1 + names.
- **Frontend:** `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` over admin pages + App/Protected/Login/Register → `[]`.
- **Live e2e vs Supabase through running uvicorn (36/36):** admin login 200 · temp customer 201 + 2 tickets · **anon 401 / customer 403** spot checks (list + PATCH) · overview aggregates (totals/statuses/avg key/customers/recent + AI `completed ≥ 2`) · list + `?status=open` + bogus → 422 · detail (customer, 1 message, analysis `completed`, unknown → 404) · PATCH persist (in_progress/urgent/smoke-cat) + bogus → 422 + empty → 422 + unknown → 404 · analysis PATCH edit+confirm persisted with `provider` provenance + unknown → 404 · customers list `ticket_count=2`. **All temp rows deleted afterwards.**
- **En route fixes:** stray placeholder route removed from `admin.py`; deprecated `HTTP_422_UNPROCESSABLE_ENTITY` → `HTTP_422_UNPROCESSABLE_CONTENT`; stale post-login `navigate()` (role bug) → context-driven `<Navigate>`; react-hooks v7 lint findings resolved (no sync `setState` in effects — portal pattern; no refs read during render — inline flash effects); an orphaned pre-M4 uvicorn worker kept serving the old app from `:8000` after restart → killed, admin routes confirmed in live OpenAPI.
- **Not run here:** browser UI walkthrough — no desktop browser connected to this session (fell to the user step in §4/§10, **confirmed working 2026-09-28**).
- **Closed:** user manual walkthrough confirmed; M4 committed as `46d182e`.
