# Implementation Plan — AI Business Automation Platform

**Status:** Approved (2026-09-27) — D1–D7 accepted as written
**Created:** 2026-09-27
**Basis:** `.ai/architecture.md`, `.ai/context.md`, review findings, and confirmed decisions below.

This document defines **what will be built, in what order, and how completion is verified.**
It does not replace the harness files; per-task specs live in `.ai/task/`.

---

## 1. Confirmed Decisions

| # | Decision | Choice | Status |
|---|----------|--------|--------|
| D1 | Customer identity | Customer accounts with signup/login; tickets belong to an authenticated customer | ✅ Confirmed by user |
| D2 | AI provider strategy | Mock-first provider abstraction (`backend/app/ai/`); real provider resolved 2026-09-28 as **Ollama** (`ollama` provider behind the same interface, `OLLAMA_*` env config; **Ollama cloud endpoint selected 2026-09-28 — model `gpt-oss:20b`, free-tier starter allowance**, local install remains a config-only alternative); `mock` remains the default for tests/demos | ✅ Resolved 2026-09-28 |
| D3 | ORM / migrations | SQLAlchemy + Alembic | ⏳ Proposed — confirm before M0 |
| D4 | Auth mechanism | JWT (short-lived access token), bcrypt password hashing via `passlib`; token stored in HTTP-only cookie if same-origin, else `Authorization: Bearer` | ⏳ Proposed — confirm before M1 |
| D5 | Frontend tooling | Vite + React + TypeScript + Tailwind CSS + React Router | ⏳ Proposed — confirm before M0 |
| D6 | Dev database | **Supabase-hosted PostgreSQL** (user decision 2026-09-27); connection string via backend-only `.env`; Alembic uses direct/session connection, never the transaction pooler | ✅ Confirmed |
| D7 | Notifications | v1 = recorded/in-app event only; no email/push provider | ⏳ Proposed |

---

## 2. Scope

### In Scope (v1)

- Customer signup/login, ticket submission, own-ticket viewing
- Admin dashboard: tickets, customers, AI analysis review, analytics
- AI analysis pipeline (category, priority, sentiment, summary, suggested response)
- Capped workflow engine (see §5)
- Demo data generator (removable/tagged)
- Portfolio-quality README and docs

### Out of Scope (v1)

- Real email/push notifications
- Background job infrastructure (Redis/Celery) — architecture Decision 5
- Visual workflow builder
- File uploads, CDN, production deployment
- Real business data

---

## 3. Milestones

Each milestone is complete only when its verification passes. Milestones are ordered; dependencies are strict unless noted.

### M0 — Foundation

**Deliverables**
- `git init` + initial commit (authorized by user at approval)
- Monorepo scaffold: `frontend/` (Vite React TS + Tailwind) and `backend/` (FastAPI)
- Backend: app factory, `/api/health` endpoint, config via env (`.env` gitignored), pytest wired
- Frontend: routing shell, API service pattern established, lint/format wired
- Alembic initialized; local PostgreSQL reachable via env config
- `README.md` with run instructions

**Verification**
- `pytest` passes (health test)
- Frontend builds (`npm run build`)
- Both apps run locally; health endpoint returns 200

### M1 — Data Model + Authentication

**Deliverables**
- SQLAlchemy models: `users`, `customers` (1:1 with user, role=customer), `admin` (role on user), `tickets`, `ticket_messages`, `ai_analysis`, `workflows`, `workflow_runs`
- Alembic migration creating all tables
- Auth endpoints: register, login, me; bcrypt hashing; role-based FastAPI dependency (`require_admin`, `current_customer`)
- Business rules enforced server-side: customer can only access own data; admin routes rejected for customers

**Verification**
- Pytest: registration/login happy path + bad credentials
- Pytest: authorization — customer blocked from admin routes and from reading other customers' tickets
- Migration runs clean from empty database

### M2 — Ticket Submission + Customer Portal

**Deliverables**
- `POST/GET /api/tickets` (thin routes → service layer), request validation schemas
- Ticket creation flow: customer must be authenticated (D1)
- Ticket statuses: `open → in_progress → resolved / closed`
- Customer UI: support form (client validation + loading/error states), own ticket list, ticket detail with messages
- Ticket messages: initial message on creation; customer can add follow-ups

**Verification**
- Pytest: create/list/get ticket; cross-customer access denied
- Manual UI: submit ticket, see it in list, validation errors display
- Frontend build passes

### M3 — AI Analysis Pipeline

**Deliverables**
- `backend/app/ai/` provider abstraction: `AIProvider` interface + `MockProvider` (deterministic, rule-based output for demo/testing)
- Analysis runs as a **separate step after ticket creation** — AI failure never fails or blocks ticket creation; ticket stores `analysis_status: pending | completed | failed`
- Structured output validation (Pydantic) before persistence; invalid output → `failed`, never silently stored
- Analysis fields: category, priority, sentiment, summary, suggested response (flagged AI-generated, not human-confirmed)
- **Decision point:** select real provider (OpenAI / Anthropic / other), implement `RealProvider` behind same interface, key via env var only — *resolved 2026-09-28: Ollama (see D2); 2026-09-28 follow-up: Ollama cloud, model `gpt-oss:20b`*

**Verification**
- Pytest: mock analysis attaches to correct ticket
- Pytest: provider failure → ticket still exists, status `failed`
- Pytest: malformed AI output rejected
- If real provider implemented: one live integration test (manual/optional, skipped without key)

### M4 — Admin Dashboard

**Deliverables**
- Admin overview: counts (open/in-progress/resolved, avg priority), recent tickets
- Ticket management: view all, update status/category/priority, view messages + customer info
- AI analysis review UI: view analysis, accept/edit suggested response, mark **human-confirmed** (distinct from AI-generated)
- Customers list (read-only in v1)
- UX: loading indicators, error states, confirmation on destructive actions, responsive layout

**Verification**
- Pytest: admin routes reject customers
- Manual UI walkthrough of full admin flow
- Frontend build passes

### M5 — Workflows + Analytics

**Deliverables**
- Capped workflow engine (§5): config forms (no visual builder), condition evaluation, actions executed, every run recorded in `workflow_runs` with success/failure — failures never reported as success
- Analytics: tickets by status/category/day, volume trends, AI vs human-confirmed response counts (DB-derived only)

**Verification**
- Pytest: condition match → action executed + run recorded
- Pytest: condition not met → no action, run recorded as skipped
- Pytest: action failure → run recorded as failed
- Manual UI: analytics numbers match seeded data

### M6 — Demo Data + Polish + Handoff

**Deliverables**
- Seed script: fictional business, customers, tickets across all categories/priorities/sentiments, workflow runs — tagged (`is_demo`) or in isolated seed so it's removable without touching other data
- UX polish pass (empty states, error states, responsive check)
- Portfolio README: architecture diagram, screenshots, setup, feature list
- Update `.ai/architecture.md` with actual routes/structure (per its §17 rules)

**Verification**
- Seed runs on empty DB; demo data removable with one command
- Full end-to-end walkthrough: signup → submit ticket → AI analysis → admin review → workflow run → analytics
- Lint + tests + frontend build all pass

---

## 4. Testing Strategy

- **Backend:** pytest for every endpoint + service; authorization tests are mandatory for every protected route
- **AI:** mock provider makes M3+ fully testable without cost/network
- **Frontend:** build check per milestone; manual UI verification (framework deferred until v1 proves need)

---

## 5. Workflow Engine Cap (scope-creep control)

v1 supports **only**:

- **Trigger:** `ticket.created` (single)
- **Conditions:** category is / priority is / sentiment is / status is (AND combination only)
- **Actions:** set priority, add tag, generate suggested response, record notification event
- **UI:** config forms, not a builder

Anything beyond this list requires a new plan revision.

---

## 6. Risks

| Risk | Mitigation |
|------|-----------|
| AI latency / failure blocking ticket creation | Analysis is a separate step (M3); failure → `failed` status, ticket unaffected |
| Background work slowing responses | Analysis + workflow evaluation run as post-response background tasks (M3/M5); in-process restart risk tracked in architecture §15 |
| Workflow engine scope creep | Hard cap in §5; changes require plan revision |
| Auth security mistakes | D4 uses conventional stack; authz tested in M1 and required for every later protected route |
| Open decision (D3–D7) blocks M0/M1 | Confirm before starting M0 |

---

## 7. Immediate Next Steps

1. User approves this plan (and confirms/proposes changes to D3–D7)
2. Log decisions to `decisions.md`, set plan status → Approved
3. Create `.ai/task/TASK-001-project-foundation.md` (M0 spec)
4. Begin M0
