# Project Architecture

This document describes the technical architecture of the project.

It is project-specific and should reflect the actual implementation.

**Current status:** Initial architecture definition. The implementation has not yet been completed. Once implementation exists, the codebase and project configuration become the source of truth.

---

# 1. Architecture Overview

## Project

**Name:** AI Business Automation Platform

**Type:** SaaS / Web Application

**Purpose:**

A business automation platform that receives customer support inquiries, analyzes them using AI, categorizes and prioritizes them, generates suggested responses, stores the resulting information, and provides an administrative dashboard for managing tickets and automation workflows.

The initial implementation will use a fictional business and generated test data so the system can be developed and tested without requiring a real business.

## Architecture Summary

The application uses a full-stack architecture consisting of a React-based frontend, a Python FastAPI backend, PostgreSQL for persistent data storage, and an external AI API for AI-powered processing.

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
PostgreSQL      AI API
```

The frontend is responsible for user interaction, dashboard presentation, forms, and displaying application state.

The FastAPI backend is responsible for API endpoints, validation, authentication, business logic, database operations, AI integration, and automation logic.

PostgreSQL is the primary persistent data store.

The AI provider is an external service used for tasks such as ticket classification, summarization, sentiment analysis, priority analysis, and response generation.

---

# 2. Technology Stack

## Frontend

* **Framework:** React
* **Language:** TypeScript
* **UI library:** To be selected during implementation
* **Styling:** Tailwind CSS
* **State management:** React state initially; dedicated state management only if required
* **Forms:** React-based form handling
* **Validation:** Client-side validation where appropriate; backend remains authoritative

## Backend

* **Runtime:** Python
* **Framework:** FastAPI
* **Language:** Python
* **API style:** REST
* **Authentication:** Token-based authentication; exact implementation to be finalized during implementation

## Database

* **Database:** PostgreSQL
* **ORM / Query layer:** To be selected during implementation
* **Hosting:** To be selected
* **Realtime capabilities:** Not required for the initial architecture

## Infrastructure

* **Hosting:** To be selected
* **Deployment:** To be determined during implementation
* **Storage:** PostgreSQL for structured application data; external object storage only if file uploads are introduced
* **CDN:** Not required for the initial architecture
* **DNS:** To be determined during deployment

## Development

* **Package manager:** npm for frontend; Python package manager for backend
* **Build tool:** React project's selected build tool
* **Testing:** pytest for backend; frontend testing framework to be selected
* **Linting:** Python and TypeScript/React linting tools
* **Formatting:** Python and TypeScript/React formatters
* **Version control:** Git
* **Repository:** GitHub

Only technologies actually introduced into the implementation should remain documented here.

---

# 3. Project Structure

The following structure represents the planned organization. It must be updated to match the actual repository once implementation begins.

```text
ai-business-automation/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── ...
│   │
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── ai/
│   │   ├── workflows/
│   │   ├── database/
│   │   ├── core/
│   │   └── main.py
│   │
│   └── tests/
│
├── docs/
│
├── .ai/
│   ├── architecture.md
│   ├── rules.md
│   └── decisions.md
│
└── README.md
```

### Planned responsibilities

```text
frontend/src/components/
→ Reusable UI components.

frontend/src/features/
→ Feature-specific frontend functionality.

frontend/src/pages/
→ Application-level pages and routes.

frontend/src/services/
→ Communication with backend APIs.

frontend/src/hooks/
→ Reusable React hooks.

frontend/src/lib/
→ Shared frontend utilities.

frontend/src/types/
→ Shared TypeScript types.

backend/app/api/
→ FastAPI route definitions.

backend/app/models/
→ Database models.

backend/app/schemas/
→ Request and response schemas.

backend/app/services/
→ Application and business logic.

backend/app/ai/
→ AI provider integration and AI-related processing.

backend/app/workflows/
→ Business automation and workflow execution logic.

backend/app/database/
→ Database connection and persistence configuration.

backend/app/core/
→ Application configuration and cross-cutting backend functionality.

backend/tests/
→ Automated backend tests.
```

These responsibilities must be verified against the actual code after implementation.

---

# 4. Application Layers

The planned backend organization uses the following logical separation:

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
FastAPI
   ↓
Request Validation
   ↓
Ticket Service
   ↓
PostgreSQL
   ↓
AI Processing
   ↓
Classification / Priority / Summary
   ↓
PostgreSQL
   ↓
API Response
   ↓
React UI
```

## Reading Tickets

```text
Administrator
   ↓
React Dashboard
   ↓
GET /api/tickets
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

Notifications are not part of the initial implementation unless a notification provider is explicitly introduced.

---

# 6. Frontend Architecture

The frontend will use React with TypeScript.

The planned organization is feature-oriented while keeping shared UI components separate.

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

Planned application areas include:

```text
Customer Portal
├── Submit Ticket
├── Ticket Status
└── Ticket Details

Admin Dashboard
├── Overview
├── Tickets
├── Customers
├── AI Analysis
├── Workflows
└── Analytics
```

Exact routes should be documented after implementation.

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

The backend will use Python and FastAPI.

Planned request flow:

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

Routes will be grouped by domain, such as:

```text
/api/auth
/api/tickets
/api/customers
/api/ai
/api/workflows
/api/analytics
```

Exact endpoints must be documented only after they exist in the implementation.

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

The initial conceptual data model includes:

```text
users
  │
  └── tickets
        │
        ├── ticket_messages
        │
        └── ai_analysis

customers
  │
  └── tickets

workflows
  │
  └── workflow_runs
```

The exact schema will be determined during implementation.

## Planned Core Entities

### Users

Application users and administrators.

### Customers

Customers submitting support inquiries.

### Tickets

Support requests submitted by customers.

### Ticket Messages

Messages associated with support tickets.

### AI Analysis

Structured results generated from AI processing.

Potential fields include:

* Category
* Priority
* Sentiment
* Summary
* Suggested response

### Workflows

Configured automation rules.

### Workflow Runs

Records of workflow executions.

## Relationships

The exact foreign keys and indexes will be documented after the database schema is implemented.

## Migration Strategy

Database schema changes should use a controlled migration system rather than manually modifying production databases.

The specific migration tool will be selected during implementation.

## Realtime

Realtime database behavior is not required for the initial version.

If realtime updates become a requirement, the architecture should be updated before implementation.

---

# 9. Authentication & Authorization

Authentication will use token/session-based authentication.

The exact authentication implementation will be selected during backend implementation.

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

The initial application is expected to have at least:

```text
Customer
Administrator
```

Exact roles and permissions must be defined during implementation.

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
Authentication
/api/auth/*

Tickets
/api/tickets/*

Customers
/api/customers/*

AI
/api/ai/*

Workflows
/api/workflows/*

Analytics
/api/analytics/*
```

The following are conceptual API domains only and do not represent implemented endpoints until those endpoints exist in the codebase.

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

**Service:** External LLM / AI API

**Purpose:**

AI-powered ticket analysis and response generation.

**Used by:**

Backend AI service.

**Integration location:**

```text
backend/app/ai/
```

**Authentication method:**

Environment-based API credential.

**Important limitations:**

* API availability may vary.
* AI output must be validated.
* AI responses should not be treated as inherently correct.
* API usage may incur costs.
* Rate limits may apply.

**Failure behavior:**

AI processing failures should be handled by the backend without exposing provider-specific errors directly to users.

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

Initial AI processing may occur synchronously. Background processing can be introduced later as an architectural change.

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

Naming conventions should follow the conventions of the language and framework being used.

The final naming conventions should be documented after the initial implementation establishes the project's actual patterns.

---

# 15. Known Technical Debt

No known technical debt exists at the initial architecture stage.

Potential future areas include:

```text
Issue:
Synchronous AI processing may become slow under increased traffic.

Impact:
Longer API response times.

Current workaround:
Process AI requests synchronously during the initial implementation.

Potential solution:
Introduce background job processing.

Priority:
Future
```

This should only be considered technical debt once the limitation actually affects the implementation.

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
