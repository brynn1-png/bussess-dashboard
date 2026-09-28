# Project Architecture

This document describes the technical architecture of the project.

It is project-specific and should reflect the actual implementation.

**Current status:** Implementation complete (milestones M0–M6). This document was synced to the built system during M6; where it differs from the code, the code wins (see §18).

---

# 1. Architecture Overview

## Project

**Name:** AI Business Automation Platform

**Type:** SaaS / Web Application

**Purpose:**

A business automation platform that receives customer support inquiries, analyzes them using AI, categorizes and prioritizes them, generates suggested responses, stores the resulting information, and provides an administrative dashboard for managing tickets and automation workflows.

A removable demo dataset (`is_demo` rows, seeded by `python -m app.cli.seed_demo`) provides a fictional business and generated test data so the system can be demonstrated and tested without requiring a real business.

## Architecture Summary

The application uses a full-stack architecture consisting of a React-based frontend, a Python FastAPI backend, PostgreSQL for persistent data storage, and a backend-only AI provider abstraction (deterministic `mock` by default; **Ollama** — cloud or local — optional) for AI-powered processing.

```text
Customer / Administrator
          ↓
     React Frontend
          ↓
      REST API
          ↓
    Python + FastAPI
          ↓
   Application Services
       ↙         ↘
PostgreSQL    AI provider (mock | Ollama)
                  ↘
            Workflow engine
```

The frontend is responsible for user interaction, dashboard presentation, forms, and displaying application state.

The FastAPI backend is responsible for API endpoints, validation, authentication, business logic, database operations, AI integration, and automation logic.

PostgreSQL is the primary persistent data store.

The AI provider (behind one interface: `mock` and `ollama`) is used for tasks such as ticket classification, summarization, sentiment analysis, priority analysis, and response generation.

---

# 2. Technology Stack

## Frontend

* **Framework:** React
* **Language:** TypeScript
* **UI library:** None — plain Tailwind utility classes (no component library)
* **Styling:** Tailwind CSS
* **State management:** React state initially; dedicated state management only if required
* **Forms:** React-based form handling
* **Validation:** Client-side validation where appropriate; backend remains authoritative

## Backend

* **Runtime:** Python
* **Framework:** FastAPI
* **Language:** Python
* **API style:** REST
* **Authentication:** JWT Bearer tokens (PyJWT, HS256) with bcrypt hashing (passlib); role checks via FastAPI dependencies

## Database

* **Database:** PostgreSQL
* **ORM / Query layer:** SQLAlchemy 2 (declarative) + Alembic migrations
* **Hosting:** Supabase PostgreSQL (session pooler, port 5432)
* **Realtime capabilities:** Not required for the initial architecture

## Infrastructure

* **Hosting:** Local development only — no deployment target adopted for v1
* **Deployment:** Not deployed for v1 (explicitly out of scope, PLAN §2)
* **Storage:** PostgreSQL for structured application data; external object storage only if file uploads are introduced
* **CDN:** Not required for the initial architecture
* **DNS:** To be determined during deployment

## Development

* **Package manager:** npm (frontend); pip + `requirements.txt` (backend)
* **Build tool:** Vite
* **Testing:** pytest for backend (72 tests); frontend verified with ESLint + `tsc` build (no FE test framework adopted)
* **Linting:** ESLint (frontend); backend verified by pytest
* **Version control:** Git
* **Repository:** GitHub

Only technologies actually introduced into the implementation should remain documented here.

---

# 3. Project Structure

The following structure matches the actual repository (synced during M6).

```text
bussess-dashboard/
│
├── frontend/
│   └── src/
│       ├── components/    # shared UI (badges, buttons, alerts, spinner)
│       ├── features/      # auth context + route guards
│       ├── lib/           # formatting helpers
│       ├── pages/         # routes: home, auth, portal/, admin/
│       ├── services/      # typed API client
│       ├── App.tsx        # route table
│       └── main.tsx
│
├── backend/
│   ├── app/
│   │   ├── api/           # routers: health, auth, tickets, admin, workflows
│   │   ├── ai/            # provider abstraction: mock.py, ollama.py, schemas
│   │   ├── workflows/     # capped automation engine
│   │   ├── services/      # analysis, analytics, workflow services
│   │   ├── schemas/       # Pydantic request/response contracts
│   │   ├── models/        # SQLAlchemy models + enums
│   │   ├── cli/           # create_admin, seed_demo
│   │   ├── database/      # engine, session, declarative base
│   │   ├── core/          # config, security
│   │   └── main.py
│   ├── alembic/           # migrations (versions/)
│   └── tests/
│
├── .ai/                   # harness: rules, architecture, workflow, context, tasks/
├── PLAN.md                # milestone roadmap M0–M6
├── AGENTS.md
├── README.md
│
├── progress.md
├── decisions.md
└── results.md
```

### Planned responsibilities

```text
frontend/src/components/
→ Reusable UI components.

frontend/src/features/
→ Feature-specific frontend functionality (auth context, route guards).

frontend/src/pages/
→ Application-level pages and routes.

frontend/src/services/
→ Communication with backend APIs.

frontend/src/lib/
→ Shared frontend utilities (formatting).

backend/app/api/
→ FastAPI route definitions.

backend/app/models/
→ Database models.

backend/app/schemas/
→ Request and response schemas.

backend/app/services/
→ Application and business logic.

backend/app/ai/
→ AI provider abstraction and AI-related processing.

backend/app/workflows/
→ Business automation and workflow execution logic.

backend/app/cli/
→ Operator commands (create_admin, seed_demo).

backend/app/database/
→ Database connection and persistence configuration.

backend/app/core/
→ Application configuration and cross-cutting backend functionality.

backend/alembic/
→ Versioned schema migrations.

backend/tests/
→ Automated backend tests.
```

These responsibilities reflect the implemented code (synced during M6).

---

# 4. Application Layers

The backend organization uses the following logical separation:

```text
Presentation / API
        ↓
Application Services
        ↓
AI / Workflow Services
        ↓
Data Access
        ↓
PostgreSQL
```

## API Layer

**Responsibility:**

* Receive HTTP requests
* Validate request data
* Authenticate requests
* Call application services
* Return HTTP responses

**Directory:**

```text
backend/app/api/
```

The API layer should not contain complex business logic.

## Application Service Layer

**Responsibility:**

* Implement application use cases
* Coordinate operations
* Apply business rules
* Coordinate database and external services

**Directory:**

```text
backend/app/services/
```

## AI Layer

**Responsibility:**

* Communicate with the external AI provider
* Prepare AI requests
* Process AI responses
* Validate AI-generated structured output
* Handle AI-specific failures

**Directory:**

```text
backend/app/ai/
```

AI provider-specific implementation should remain isolated from the rest of the application where practical.

## Workflow Layer

**Responsibility:**

* Execute automation rules
* Evaluate workflow conditions
* Trigger workflow actions
* Coordinate automated processes

**Directory:**

```text
backend/app/workflows/
```

## Data Layer

**Responsibility:**

* Database connections
* Database queries
* Persistence operations
* Database models

**Directories:**

```text
backend/app/database/
backend/app/models/
```

Business logic should not be duplicated inside database access code.

---

# 5. Data Flow

## Creating a Support Ticket

```text
Customer
   ↓
React Support Form
   ↓
Frontend Validation
   ↓
POST /api/tickets
   ↓
FastAPI → Request Validation → Ticket Service → PostgreSQL
   ↓
201 Response (returned immediately)
   ↓
React UI
   ↓
Background tasks (FastAPI BackgroundTasks, each with its own DB session)
   ├── AI analysis: provider → Pydantic validation → PostgreSQL
   │     (+ category/priority write-back onto the ticket)
   └── Workflow evaluation: ticket.created → AND conditions → actions
         (exactly one workflow_runs row: success / skipped / failed)
```

Analysis and workflow evaluation never delay or break ticket creation —
provider or workflow failures are recorded as `failed` rows.

## Reading Tickets

```text
Administrator
   ↓
React Dashboard
   ↓
GET /api/admin/tickets
   ↓
FastAPI
   ↓
Ticket Service
   ↓
PostgreSQL
   ↓
Response
   ↓
Dashboard
```

## AI Response Generation

```text
Ticket
   ↓
Backend AI Service
   ↓
AI Provider
   ↓
Structured AI Result
   ↓
Validation
   ↓
Database
   ↓
Dashboard
```

## Authentication

```text
User
   ↓
Login Form
   ↓
Authentication API
   ↓
Credential Verification
   ↓
Authentication Result
   ↓
Session / Token
   ↓
Protected API Requests
```

## Notifications

Notifications are recorded only (decision D7): the `record_notification`
workflow action appends a system message to the ticket, and run details are
stored on `workflow_runs`. No email/push provider is integrated.

---

# 6. Frontend Architecture

The frontend uses React with TypeScript.

The organization is feature-oriented while keeping shared UI components separate.

```text
Page
 ↓
Feature Component
 ↓
Hook / Application Logic
 ↓
API Service
 ↓
FastAPI
```

## Page Structure

Implemented application areas (routes from `frontend/src/App.tsx`):

```text
Public
├── /                     Home (backend status)
├── /login  /register     Auth
└── *                     404

Customer Portal (role: customer)
├── /portal               Ticket list
├── /portal/new           Submit ticket
└── /portal/tickets/:id   Ticket detail + replies

Admin Console (role: admin)
├── /admin                Overview (aggregates + recent activity)
├── /admin/tickets        Ticket list (+ ?status= filter)
├── /admin/tickets/:id    Status, AI review + human confirm, tags, replies
├── /admin/workflows      Workflow list + run counts
├── /admin/workflows/new  Create workflow (cap-aware form)
├── /admin/workflows/:id  Edit workflow + run history
├── /admin/analytics      7/30/90-day analytics
└── /admin/customers      Customers list
```

## Component Structure

Reusable UI elements should be placed in:

```text
frontend/src/components/
```

Feature-specific components should remain within their respective feature areas.

## State Management

The initial implementation will use React's built-in state and context mechanisms where sufficient.

A dedicated state management library should not be introduced unless the application's state requirements justify it.

## Data Fetching

API communication will be performed through frontend service modules.

```text
React Component
      ↓
Feature Logic / Hook
      ↓
API Service
      ↓
FastAPI
```

## Form Handling

Forms will perform basic client-side validation before submitting data to the backend.

The backend remains the authoritative validation layer.

## Error Handling

The frontend should:

* Display user-friendly errors
* Handle failed API requests
* Display loading states
* Prevent duplicate submissions where appropriate
* Avoid exposing backend implementation details

## Client / Server Boundaries

The frontend communicates with the backend exclusively through documented API contracts.

Frontend code should not directly access the PostgreSQL database.

---

# 7. Backend Architecture

The backend uses Python and FastAPI.

Request flow:

```text
HTTP Request
     ↓
FastAPI Route
     ↓
Request Validation
     ↓
Authentication
     ↓
Application Service
     ↓
Database / AI / Workflow Service
     ↓
Response Schema
     ↓
HTTP Response
```

## Routes

Actual route groups (OpenAPI at `/docs` is the endpoint source of truth):

```text
/api/health                   liveness check

/api/auth/*                   register, login, me

/api/tickets/*                customer ticket CRUD + replies (own tickets only)
  POST /api/tickets
  GET  /api/tickets
  GET  /api/tickets/{id}
  POST /api/tickets/{id}/messages

/api/admin/*                  admin-gated: every route behind require_admin
  GET  /api/admin/overview
  GET  /api/admin/tickets            (+ GET/PATCH /{id}, PATCH /{id}/analysis)
  GET  /api/admin/customers
  GET  /api/admin/analytics?days=1..90

/api/admin/workflows/*        admin-gated workflow CRUD + run history
  GET/POST /api/admin/workflows
  GET/PATCH/DELETE /api/admin/workflows/{id}
  GET  /api/admin/workflows/{id}/runs
```

AI analysis and workflow execution deliberately have **no HTTP surface** —
they run as background tasks after ticket creation.

Note: the original sketch here (`/api/workflows`, `/api/ai`, `/api/analytics`)
was reconciled to reality during M6 — admin endpoints live under `/api/admin/*`.

## Controllers / Routes

FastAPI route handlers should remain thin and delegate application behavior to service modules.

## Business Logic

Business rules belong primarily in application services rather than route handlers.

## Authentication

Protected routes will verify the authenticated user's identity before accessing protected resources.

## Authorization

Authorization rules should be enforced on the backend and must not rely solely on frontend visibility.

## Validation

Request schemas should validate incoming API data before it reaches application logic.

## Error Handling

The backend should return consistent HTTP status codes and structured error responses.

Internal errors and sensitive implementation details must not be exposed to clients.

## Database Access

Database access should be isolated from API route definitions.

## External Integrations

External AI services should be accessed through dedicated integration/service modules.

---

# 8. Database Architecture

## Database

PostgreSQL will be the primary relational database.

The implemented data model (SQLAlchemy models in `backend/app/models/`,
migrations in `backend/alembic/versions/`):

```text
users ──1:1── customers ──1:N── tickets ──1:N── ticket_messages
 │                                  │
 │                                  └──1:1── ai_analysis
 │
 └── (role: customer | admin; is_demo marks seed rows)

workflows ──1:N── workflow_runs
   (is_demo marks seed rows; conditions/actions stored as JSON)
```

Notable columns beyond the basics: `tickets.category`, `tickets.priority`,
`tickets.tags` (JSON, added M5), `ai_analysis` = status/category/priority/
sentiment/summary/suggested_response/provider/error_message/
`is_human_confirmed`, `users.is_demo` + `workflows.is_demo` (M6 seed flags).

## Core Entities

### Users

Customer and admin accounts (`role` enum, bcrypt hash). `is_demo` marks
seed-created rows (M6); admins are provisioned only via the CLI.

### Customers

Customers submitting support inquiries.

### Tickets

Support requests submitted by customers: `status`, `category` and
`priority` (set by AI write-back / admin review), `tags` (JSON, M5),
timestamps.

### Ticket Messages

Messages associated with support tickets.

### AI Analysis

Structured results from AI processing, validated against `AnalysisResult`:
status (pending/completed/failed), provider (`mock`/`ollama`), category,
priority, sentiment, summary, suggested response, sanitized error message,
and `is_human_confirmed` (human review flag, M4).

### Workflows

Configured automation rules: fixed `ticket.created` trigger, AND-only
`conditions` and `actions` (JSON columns), `is_active`, `is_demo` (M6).

### Workflow Runs

One record per evaluation: status (`success`/`skipped`/`failed`) + `details`
JSON (executed actions, or the mismatch/error that stopped it).

## Relationships

Foreign keys use `ondelete="CASCADE"` (users→customers→tickets→messages/
analyses; workflows→runs), mirrored by ORM relationship cascades so demo
removal behaves identically on PostgreSQL and SQLite. `users.email` is
unique; lookup columns (`tickets.customer_id`, `ticket_messages.ticket_id`)
are indexed.

## Migration Strategy

Database schema changes should use a controlled migration system rather than manually modifying production databases.

Schema changes use Alembic: autogenerate a reviewed version file, apply with
`alembic upgrade head`. DDL runs through the Supabase **session pooler**
(port 5432) — the transaction pooler (6543) rejects DDL.

## Realtime

Realtime database behavior is not required for the initial version.

If realtime updates become a requirement, the architecture should be updated before implementation.

---

# 9. Authentication & Authorization

Authentication uses JWT access tokens (HS256 via PyJWT, 60-minute expiry)
sent as `Authorization: Bearer`, with bcrypt password hashing (passlib) —
decision D4.

Planned flow:

```text
User
 ↓
Login
 ↓
Authentication Service
 ↓
Authenticated Session / Token
 ↓
Protected API Request
 ↓
Authentication Verification
 ↓
Authorization
 ↓
Protected Resource
```

## Authorization

Two roles, enforced server-side (decision D4/M4):

```text
Customer      → /api/tickets/* (own tickets only)
Administrator → /api/admin/* (every admin route behind require_admin)
```

Public registration can never grant admin — admins are created with
`python -m app.cli.create_admin`. Frontend route guards mirror these rules,
but the backend is authoritative.

## Security Rules

* Never expose database credentials to the frontend.
* Never expose AI API keys to the frontend.
* Never store secrets in source control.
* Validate protected requests on the backend.
* Do not rely on frontend authorization alone.

---

# 10. API Architecture

The backend exposes a REST API through FastAPI.

Planned API domains include:

```text
Authentication   /api/auth/*          implemented
Tickets          /api/tickets/*       implemented
Admin            /api/admin/*         implemented (overview, tickets, customers, analytics)
Workflows        /api/admin/workflows/* implemented
Health           /api/health          implemented
AI               no HTTP surface — background provider calls only
```

For each implemented endpoint, documentation should include:

* HTTP method
* Path
* Purpose
* Request schema
* Response schema
* Authentication requirements
* Validation behavior
* Error behavior
* External dependencies

---

# 11. External Services

## AI Provider

**Service:** AI provider behind the `AIProvider` interface — `mock`
(default: deterministic keyword rules, offline, used by tests and the seed)
and `ollama` (real model via `POST /api/chat` with JSON mode — Ollama cloud
endpoint by default, any local/Ollama-compatible endpoint via config).

**Purpose:**

AI-powered ticket analysis and response generation.

**Used by:**

Backend AI service.

**Integration location:**

```text
backend/app/ai/
```

**Configuration method:**

Environment only (`AI_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`,
`OLLAMA_API_KEY` — required for Ollama cloud, empty for local) — loaded from `.env`,
never committed.

**Important limitations:**

* Provider availability depends on config: the Ollama endpoint (cloud or local)
  must be reachable and the configured model available there.
* AI output must be validated — always passed through the Pydantic `AnalysisResult` gate.
* AI responses should not be treated as inherently correct (human confirmation flag exists).
* Hosted/cloud endpoints (Ollama cloud) consume a monthly free allowance then
  per-token credits; a local Ollama endpoint has no usage cost.

**Failure behavior:**

AI failures are caught by the analysis service and persisted as a `failed`
analysis with a single-line sanitized message — ticket creation is never
affected and provider-specific details stay server-side (logged only).

Additional external services should only be added when required by the implementation.

---

# 12. Important Architectural Decisions

## Decision 1 — Python + FastAPI

**Date:** Initial architecture definition

**Reason:**

The project is intended to develop Python backend skills while building a practical software-engineering portfolio project.

**Alternatives considered:**

* Node.js / Express
* Django

**Why this approach was selected:**

FastAPI provides a lightweight Python API framework with strong support for REST APIs, validation, type hints, and automatic API documentation.

**Impact:**

The backend will be implemented in Python rather than Node.js.

---

## Decision 2 — React Frontend

**Date:** Initial architecture definition

**Reason:**

The project requires a web interface and the existing project direction uses modern React-based development.

**Alternatives considered:**

* Vue
* Angular
* Server-rendered frontend

**Why this approach was selected:**

React allows the project to focus learning effort on Python and backend engineering rather than introducing an entirely new frontend ecosystem.

**Impact:**

The frontend communicates with the Python backend through APIs.

---

## Decision 3 — PostgreSQL

**Date:** Initial architecture definition

**Reason:**

The application contains structured relational data such as users, customers, tickets, messages, AI results, and workflows.

**Alternatives considered:**

* MongoDB
* SQLite

**Why this approach was selected:**

PostgreSQL is well suited to relational business applications and provides strong constraints, relationships, indexing, and transaction support.

**Impact:**

The application will use a relational data model.

---

## Decision 4 — AI as a Backend Service

**Date:** Initial architecture definition

**Reason:**

AI functionality should be isolated from the frontend and controlled by the backend.

**Why this approach was selected:**

This prevents exposing AI credentials to clients and allows the backend to validate, transform, store, and control AI-generated results.

**Impact:**

Frontend code must not directly communicate with the AI provider.

---

## Decision 5 — Start Without Background Infrastructure

**Date:** Initial architecture definition

**Reason:**

The first version should remain simple enough to develop and understand while learning Python.

**Why this approach was selected:**

Background job infrastructure such as Redis and Celery should only be introduced when the application's workload or requirements justify it.

**Impact:**

AI analysis and workflow evaluation run as FastAPI `BackgroundTasks` after
the response, each opening its own DB session (no Redis/Celery). A process
restart can drop a task that has not started — see §15.

---

## Decision 6 — AI Provider Behind One Interface

**Date:** Mock-first built in M3; provider choice resolved 2026-09-28 (M6)

**Reason:**

Analysis must be deterministic and offline for tests/demos, yet able to use
a real model without touching callers.

**Alternatives considered:**

* Hosted APIs (OpenAI / Anthropic)
* Direct SDK calls without an abstraction

**Why this approach was selected:**

`AIProvider` protocol + factory (`app/ai/base.py`): `mock` stays the default;
`ollama` calls an Ollama-compatible endpoint (Ollama cloud, or a local install)
with JSON output. Every result passes
the same Pydantic `AnalysisResult` gate before it can be persisted.

**Impact:**

Switching engines is a single `.env` value (`AI_PROVIDER`); provider
failures persist as `failed` analyses; no cloud key is required by default.

---

## Decision 7 — Capped Workflow Engine

**Date:** M5 (2026-09-28)

**Reason:**

Automation is a core feature, but unbounded automation is scope creep and a
reliability risk (PLAN §5 cap).

**Why this approach was selected:**

One trigger (`ticket.created`), AND-only conditions (≤ 5), ≤ 5 actions from
exactly 4 types. Exactly one `workflow_runs` row per evaluation
(`success`/`skipped`/`failed`); failing actions roll back via savepoint; the
engine never raises into a request.

**Impact:**

Workflows are config-driven JSON, not a visual programming language;
adding an action type is a deliberate engine + schema change.

---

# 13. Architectural Constraints

The project must:

* Use Python for backend development.
* Use FastAPI as the initial backend framework.
* Use PostgreSQL for persistent relational data.
* Keep AI credentials on the backend.
* Keep database credentials on the backend.
* Communicate between frontend and backend through APIs.
* Validate data on the backend.
* Support a fictional/demo business without requiring a real business.
* Support generated test data for demonstration and testing.
* Remain suitable for portfolio demonstration.
* Avoid unnecessary infrastructure during the initial implementation.
* Keep external integrations isolated from core business logic.

---

# 14. Important Patterns

## Component Pattern

Reusable components should be separated from feature-specific components.

```text
Shared Components
        ↓
Feature Components
        ↓
Pages
```

## API Pattern

Frontend communication should use service modules rather than embedding API requests throughout UI components.

```text
Component
   ↓
Hook / Feature Logic
   ↓
API Service
   ↓
FastAPI
```

## Backend Pattern

API routes should remain thin.

```text
Route
  ↓
Validation
  ↓
Service
  ↓
Data / External Service
```

## AI Pattern

AI provider communication should remain isolated.

```text
Application Service
       ↓
AI Service
       ↓
AI Provider
       ↓
Validated AI Result
```

## Database Access Pattern

Frontend code must never access the database directly.

```text
Frontend
   ↓
API
   ↓
Backend Service
   ↓
Database
```

## Error Handling Pattern

Errors should be:

* Detected at the appropriate layer.
* Logged safely on the backend.
* Converted into consistent API responses.
* Presented to users without exposing sensitive implementation details.

## Naming Conventions

Established conventions (post-implementation):

* Python: snake_case modules/functions/attributes, PascalCase classes
* API JSON: snake_case fields (matches the Python side)
* React: PascalCase components (`.tsx`), camelCase props/state, named exports
* Routes: lowercase URL paths; one page per file under `frontend/src/pages/`

---

# 15. Known Technical Debt

Synced during M6. Current items:

```text
Issue:
Background tasks (AI analysis, workflow runs) run in-process via FastAPI
BackgroundTasks — a process restart mid-run drops a task that has not started.

Impact:
Rare locally; a restarting deploy could lose pending analyses/runs.

Current workaround:
Failures are recorded as `failed` rows and are safe to re-trigger; local dev
rarely restarts mid-run.

Potential solution:
External task queue/worker once a deployment target exists.

Priority:
Future (post-v1)
```

```text
Issue:
No frontend unit tests — verification is ESLint + `tsc` build + manual
walkthroughs; the backend has 72 pytest tests.

Impact:
Frontend regressions rely on walkthroughs to catch.

Priority:
Low
```

```text
Issue:
No deployment target for v1 (local development only).

Impact:
The app cannot be demoed from a public URL yet.

Priority:
Out of scope for v1 (PLAN §2); revisit post-handoff
```

---

# 16. Architecture Change Rules

Before making an architectural change, the AI should:

1. Identify the current architecture.
2. Identify the affected components.
3. Determine dependencies and side effects.
4. Explain why the current architecture is insufficient.
5. Propose the new approach.
6. Explain trade-offs.
7. Obtain approval when required by `.ai/rules.md`.
8. Implement the change.
9. Verify affected functionality.
10. Update this document if the architecture changed.

Do not make significant architectural changes simply to solve a local problem.

Prefer the smallest architectural change that correctly solves the requirement.

---

# 17. Architecture Documentation Maintenance

Update this document when:

* A major technology changes.
* A new architectural layer is introduced.
* A significant service is added or removed.
* Database architecture changes.
* Authentication architecture changes.
* API architecture changes.
* Deployment architecture changes.
* A significant architectural pattern changes.
* A major constraint changes.

Do not update this document for ordinary implementation details that do not affect architecture.

---

# 18. Source of Truth

Use the following hierarchy when understanding architecture:

```text
Actual Code
    ↓
Current Project Configuration
    ↓
Database / Infrastructure Configuration
    ↓
.ai/architecture.md
    ↓
Other Documentation
```

If this document conflicts with the actual implementation:

1. Inspect the code and configuration.
2. Determine the actual current architecture.
3. Do not blindly follow outdated documentation.
4. Update `.ai/architecture.md` when appropriate.

The architecture document describes the system.

It does not override the system.
