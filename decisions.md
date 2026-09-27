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
