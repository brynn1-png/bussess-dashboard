# AI Business Automation Platform

A portfolio-focused business automation platform: customers submit support inquiries, AI analyzes and prioritizes them, and administrators manage everything through a dashboard with configurable automation workflows.

**Stack:** React + TypeScript + Tailwind (Vite) · Python + FastAPI · PostgreSQL (Supabase) · AI provider behind a backend-only abstraction.

## Project documentation

| File | Purpose |
|------|---------|
| `PLAN.md` | Implementation roadmap (milestones M0–M6) |
| `AGENTS.md` | AI agent entry point |
| `.ai/` | Architecture, rules, workflow, context, task specs |
| `progress.md` / `decisions.md` / `results.md` | Persistent project state |

## Prerequisites

- Python 3.12+
- Node 20+ (tested on 24)
- A Supabase project (any PostgreSQL connection works)

## Setup

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env   # then fill in DATABASE_URL from Supabase
.venv\Scripts\uvicorn app.main:app --reload
```

> **Supabase note:** use the **direct** or **session** connection (port 5432) for `DATABASE_URL`.
> The transaction pooler (port 6543) rejects DDL, which breaks Alembic migrations.
> Prefix the connection string with `postgresql+psycopg://`.

API docs: http://localhost:8000/docs

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (dev server proxies `/api` to the backend on port 8000)

## Verification

```powershell
# Backend tests
cd backend
.venv\Scripts\python -m pytest

# Frontend
cd frontend
npm run lint
npm run build
```
