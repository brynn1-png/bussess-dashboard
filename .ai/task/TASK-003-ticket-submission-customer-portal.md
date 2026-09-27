# TASK-003: Ticket Submission + Customer Portal (M2)

**Status:** Created — awaiting user approval

**Created:** 2026-09-28

---

## 1. Objective

Let a customer sign up, log in, submit support tickets through the browser, and follow up on **their own** tickets — the first complete customer-facing feature, per `PLAN.md` milestone M2. Backend endpoints stay thin (route → schema validation → service), and the UI follows the established `Component → Hook/Feature logic → API service` pattern.

---

## 2. Problem

M1 delivered auth APIs and the schema, but nothing a user can *do*: there is no way to create or view tickets from the UI, and no login screen exists for the portal (M1 deliberately shipped auth API-only). Without this, the admin dashboard (M4) and AI analysis (M3) have no data to work with.

---

## 3. Requirements

### Backend
- `POST /api/tickets` — authenticated customer creates a ticket: `subject` + `message` (the opening message); server sets `status=open`, `customer_id` from the token (never from the body); creates the initial `TicketMessage`.
- `GET /api/tickets` — returns **only the caller's** tickets (customer scoping enforced server-side).
- `GET /api/tickets/{id}` — ticket detail + messages; owner only.
- `POST /api/tickets/{id}/messages` — owner adds a follow-up message.
- Cross-customer access returns **404** (not 403) so existence is not leaked (`.ai/context.md` §4, §7).
- Unauthenticated → 401; validation errors → 422; unknown ticket → 404.
- Ticket statuses exist as `open → in_progress → resolved / closed` (enum from M1); **status transitions remain admin-only (M4)** — customers cannot change status in M2.

### Frontend
- **Auth screens** (prerequisite for the portal): `/register` and `/login` forms → call M1 endpoints → store token + user (localStorage, v1) → attach `Authorization: Bearer` in `services/api.ts`.
- **Portal routes** (protected — redirect to `/login` when unauthenticated):
  - `/portal` — own ticket list (status/priority badges, relative time)
  - `/portal/new` — support form: client-side validation, loading state, error display, prevents duplicate submits
  - `/portal/tickets/:id` — detail: messages thread + follow-up form
- UX per `.ai/context.md` §10: clear validation messages, loading indicators, useful error feedback, responsive layout.
- Registration/login errors (409 duplicate email, 401 bad credentials) shown inline, not as raw JSON.

---

## 4. Acceptance Criteria

- [ ] Pytest: register-less customer flow — unauthenticated `POST /api/tickets` → 401
- [ ] Pytest: create ticket → 201; `GET /api/tickets` lists it; `GET /api/tickets/{id}` returns it with the initial message
- [ ] Pytest: **cross-customer isolation** — customer B gets 404 on customer A's ticket (GET and POST message)
- [ ] Pytest: invalid payloads (empty subject/short message) → 422
- [ ] Pytest: follow-up message appends and appears in the thread
- [ ] Existing suite still passes (21/21 + new tests)
- [ ] `npm run lint` and `npm run build` pass
- [ ] Manual UI walkthrough: signup → login → submit ticket → see it in list → open detail → add follow-up; validation errors display; second customer cannot see it
- [ ] No secrets committed; token never logged

---

## 5. Scope

### In Scope
- Backend: ticket routes, schemas, `services/ticket_service.py`, authz via existing `get_current_user`.
- Frontend: auth context/hook, login/register pages, portal pages (list/new/detail), API service extended with `Authorization` header + error parsing.
- Backend tests for all criteria above; frontend verification via lint + build + manual walkthrough.
- Design/UI work will load a relevant design skill (per `AGENTS.md` §8) before implementing components.

### Out of Scope
- Status/category/priority **changes** (admin M4), AI analysis (M3), workflows (M5), demo data (M6).
- Admin views of all tickets (M4).
- Password reset, refresh tokens, email verification, pagination (deferred until data volume justifies it — note if ticket lists grow).
- Moving the token from localStorage to an HTTP-only cookie (revisit at hardening pass).

---

## 6. Technical Approach (as intended)

```text
Backend
  app/api/tickets.py          → thin routes: parse → call service → map errors to HTTP
  app/schemas/ticket.py       → CreateTicketRequest / TicketResponse / MessageResponse ...
  app/services/ticket_service.py → ownership checks, initial-message creation, scoping
  (reuse: get_current_user, get_db, models from M1 — no schema changes expected)

Frontend
  src/services/api.ts         → add Authorization header (token from auth store), typed errors
  src/features/auth/          → useAuth hook + AuthProvider (context), token persistence
  src/pages/LoginPage.tsx / RegisterPage.tsx
  src/pages/portal/           → TicketListPage, NewTicketPage, TicketDetailPage
  src/components/             → shared form/feedback primitives as needed
  App.tsx                     → protected route wrapper + new routes
```

- Backend tests: in-memory SQLite (established decision), TestClient + existing fixtures.
- No DB migration expected (tables exist from `7d4a1330581a`) — if a schema change becomes necessary, stop and raise it (architecture change rule).

---

## 7. Affected Areas

### Files / Modules
- New: `backend/app/api/tickets.py`, `backend/app/schemas/ticket.py`, `backend/app/services/ticket_service.py`, `backend/tests/test_tickets.py`, frontend auth/portal pages + hooks
- Modified: `backend/app/main.py` (router), `frontend/src/services/api.ts`, `frontend/src/App.tsx`, possibly `frontend/src/pages/HomePage.tsx` (entry links)

### Database
- Reads/writes to `tickets`, `ticket_messages` — **no schema change**

### APIs
- New: `POST/GET /api/tickets`, `GET /api/tickets/{id}`, `POST /api/tickets/{id}/messages`

### UI
- New customer portal area (login, register, list, form, detail)

---

## 8. Dependencies
- M1 complete (✅ `9253b4c` + migration applied)
- Decisions: D1 (authenticated customers), D4 (Bearer tokens)

## 9. Risks
- **Authz is the highest-risk area** — every endpoint gets an ownership test; cross-customer leak = task failure.
- **localStorage token** → XSS exposure; acceptable for portfolio v1, documented in scope; prefer rendering user-generated content as text (React does by default; no `dangerouslySetInnerHTML`).
- **Scope creep via statuses** — customers must not gain status powers; transitions reserved for M4.
- UI must not duplicate validation logic as the *only* gate — backend stays authoritative.

## 10. Verification
- [ ] `pytest` — new ticket tests + full suite green
- [ ] `npm run lint` + `npm run build`
- [ ] Manual end-to-end walkthrough (two accounts) against the dev server, live backend on Supabase
- [ ] Changed files reviewed; no secrets tracked

## 11. Notes
- Backend tests stay on SQLite (decision 2026-09-27); a final live check runs against Supabase as done in M1 close-out.
- If implementation reveals a need for schema changes, stop per `.ai/workflow.md` §6 and discuss before proceeding.
