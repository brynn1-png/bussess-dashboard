# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Administrator** — the person running the business's support operation. Sits in the dashboard repeatedly through the day: triaging new tickets, reviewing what the AI concluded, confirming or overriding it, replying to customers, and adjusting automation rules. Success is a ticket correctly routed, correctly answered, with a human having actually looked at the AI's work.

**Customer** — a person with a problem, contacting support. Usually one visit, often mildly stressed. Success is submitting once and watching it progress without re-explaining themselves.

_Inferred from `.ai/context.md` §2 (Users) and the original brief; not separately confirmed by the user._

## Product Purpose

A portfolio-focused business automation platform showing how Python, backend engineering, AI, databases, and workflow automation combine into a real business application. It receives customer support inquiries, analyzes them with AI (category, priority, sentiment, summary, suggested response), stores the result for human review, and gives an administrator a dashboard to manage tickets and configure capped automation.

Success means: an inquiry arrives, is automatically analyzed, a human confirms the AI's reading, and the customer gets an answer — all demonstrable without a real business, using seeded demo data.

## Positioning

The mechanism a neighboring product could not copy-paste: **AI output is never allowed to become a human answer on its own.** Every analysis carries an explicit provenance state — pending, completed-unconfirmed, human-confirmed, failed — and the interface must make that state impossible to mistake. Combined with a capped, savepoint-isolated workflow engine that records exactly one honest run row (`success`/`skipped`/`failed`, never a partial success), the product's claim is *automation you can audit*, not automation you must trust.

## Operating Context

- Administrator works in a browser against a local dev stack (Vite dev server + FastAPI + Supabase PostgreSQL).
- AI runs as FastAPI background tasks after ticket creation; provider is `mock` (deterministic, default) or `ollama` (cloud or local).
- Demo dataset is loaded for walkthroughs and is removable (`python -m app.cli.seed_demo --remove`).
- Verification rituals: `pytest`, `eslint`, `tsc + vite build`, live API e2e, browser walkthroughs.
- Documents that are part of the product's context: `PLAN.md`, `README.md`, `.ai/context.md`, `.ai/architecture.md`.

## Capabilities and Constraints

**Capabilities:** customer registration/login; ticket submission with background AI analysis; admin ticket queue with status + AI-review filtering; ticket detail with status/priority/category management, AI analysis review, human confirmation, tags, and replies on both sides; workflow CRUD under a cap (one trigger, AND-only conditions ≤5, ≤5 actions from 4 types) with run history; 7/30/90-day analytics; customer list; seeded demo data.

**Constraints:**
- React + TypeScript + plain Tailwind utility classes — **no component library** (`.ai/architecture.md` §2).
- Backend is authoritative for validation and authorization; two roles only, enforced server-side.
- AI credentials never reach the frontend; AI has no HTTP surface.
- Notifications are recorded only — no delivery channels.
- No deployment target for v1; local development only.
- No frontend test framework — verification is lint + typecheck + manual/browser.
- Frontend icons: none installed today; any icon system introduced must be a real library or authored SVG in one consistent stroke/weight (not emoji/unicode stand-ins).
- Terminology is fixed (`.ai/context.md` §11): support ticket, AI analysis, suggested response, workflow, workflow run, demo data.

**Explicitly undecided:** the marketing voice and any public-facing brand name beyond the current "AI Business Automation Platform" string; whether a dark theme is wanted; whether a deployment target will exist.

## Evidence on Hand

- Live demo data on Supabase: 6 users, 13 tickets, 12 completed analyses, 3 workflows / 27 runs covering `success`, `skipped`, and `failed`.
- A dual-agent design critique of `frontend/src` with a scored baseline: `.impeccable/critique/2026-09-28T08-57-23Z__frontend-src.md` (27/40, verdict "category-interchangeable").
- 79 backend pytest tests; ESLint + `tsc` build gate for the frontend.
- README screenshot slots are still placeholders — **no real screenshots exist; do not fabricate them as evidence.**

## Product Principles

1. **Provenance over polish** — an AI result must always be visually distinguishable from a human-confirmed one; if the two look alike, the design failed regardless of how it looks.
2. **Honest state** — failed and skipped things are shown as failed and skipped; nothing renders as success it did not earn.
3. **Automation stays capped and readable** — the workflow engine is config, not a programming language, and the UI should never imply more power than exists.
4. **The operator's time is the resource** — the admin re-visits these screens all day; scanability and in-place recovery beat novelty.
5. **Demo-able without a real business** — every screen must look complete with seeded data and must not depend on real customer volume.

## Brand Commitments

- Product string: **AI Business Automation Platform**; areas are "Admin console" and the customer portal.
- Emerald has been the incumbent accent across M0–M6 and is referenced in existing logs; treat it as a recognized trait, not a legally binding mark. _Not explicitly confirmed by the user as binding._
- The user explicitly asked for a **bolder, more distinctive identity** — a real typeface, a tokenized palette, an icon system, and a clear AI-provenance treatment — replacing the current clinical/generic look. That request is binding for the redesign.

## Accessibility & Inclusion

No product-specific standard was ever set. Baseline expectations implied by the project: keyboard-operable controls, visible focus, `role="alert"` for errors and `role="status"` for informational notices, table headers properly scoped, and text contrast ≥4.5:1. Recorded as a baseline only — not a confirmed WCAG conformance target.
