# Decisions

## Current State Summary

- No project decisions recorded yet in this file.
- Initial architecture decisions (Python + FastAPI, React, PostgreSQL, AI as backend service) are documented in `.ai/architecture.md` §12.

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
