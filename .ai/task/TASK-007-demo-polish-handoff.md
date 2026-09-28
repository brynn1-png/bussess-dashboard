# TASK-007: Demo Data + Polish + Handoff (M6)

**Status:** Completed — 2026-09-28. User e2e walkthrough confirmed; live Ollama check passed (**Ollama cloud**, see §11); pytest 73 passed / 0 skipped; committed (`136332b`)
**Milestone:** M6 (PLAN §3, final milestone)
**Created:** 2026-09-28
**Depends on:** TASK-002 … TASK-006 (M0–M5 complete)

---

## 1. Objective

Ship the project's final milestone: a **removable demo dataset** that makes the
product self-explanatory, a **real AI provider (Ollama)** behind the
existing abstraction, a **UX polish pass**, and the **handoff artifacts**
(portfolio README + architecture doc synced to reality).

## 2. Problem

M0–M5 delivered the working product, but a fresh checkout is empty (nothing to
show), analysis runs only on the deterministic mock (PLAN's M3 provider
decision point is still open), the UI hasn't had a full-state/responsive audit
since M5 added two sections, and `.ai/architecture.md` still describes the
pre-M4/pre-M5 system (e.g. it sketches `/api/workflows`, which reality moved to
`/api/admin/workflows`).

## 3. Requirements

- **R1 — Seed script (PLAN §3 M6).** `python -m app.cli.seed_demo` creates a
  coherent fictional business: demo admin, several demo customers, tickets
  spanning **all categories, priorities, sentiments, and statuses**, spread
  across the last ~10 days (UTC buckets so the analytics chart is populated),
  analyses produced by the **real pipeline** (mock provider + write-back), and
  demo workflows whose runs demonstrate **all three run states**
  (`success`, `skipped`, `failed`).
  - Tagged via **`is_demo` boolean columns on `users` and `workflows`**
    (user decision 2026-09-28) — small Alembic migration; tickets, messages,
    analyses, customers, and runs are removed by FK/ORM cascade from those two
    roots.
  - **Removable with one command:** `python -m app.cli.seed_demo --remove`
    deletes **only** `is_demo = true` rows — real data is never touched
    (test-proven).
  - Idempotent guard: seeding while demo data exists → clear error telling the
    user to `--remove` first; seeding on a DB with real data is allowed and
    leaves it untouched.
- **R2 — Ollama AI provider (resolves PLAN D2 / M3 decision point, user
  decision 2026-09-28).** `OllamaProvider` behind the existing `AIProvider`
  interface:
  - Config via env only: `OLLAMA_BASE_URL` (default `http://localhost:11434`),
    `OLLAMA_MODEL` (default documented in `.env.example`); `AI_PROVIDER=ollama`
    selects it — **`mock` remains the default** so tests, the seed, and
    reviewers without Ollama stay deterministic/offline.
  - Structured output: request Ollama's JSON format, parse → existing Pydantic
    `AnalysisResult` validation gate → persist (`provider = "ollama"`).
  - Same never-raises discipline: unreachable server, timeout, or bad output →
    analysis `failed` with sanitized error; ticket creation unaffected.
  - One live integration check, **skipped automatically when Ollama isn't
    running** (PLAN: optional/skipped-without-key).
- **R3 — UX polish pass (PLAN §3 M6).** Audit every surface (login/register,
  portal, admin incl. the 5-tab nav, workflow form, analytics): empty states,
  error states, loading states, responsive behavior (nav wrapping/overflow on
  narrow screens, form rows, charts), copy consistency. `impeccable detect`
  stays clean.
- **R4 — Portfolio README (PLAN §3 M6).** Root `README.md`: feature list,
  architecture diagram (ASCII/Mermaid), tech stack, setup for backend +
  frontend + Supabase + **optional Ollama**, demo-seed instructions, project
  structure. Screenshots included — **captured by the user** (no desktop
  browser available to the assistant this session); README must read well
  before/without them (placeholders if none provided).
- **R5 — Architecture sync (PLAN §3 M6, per architecture §16/§17).** Update
  `.ai/architecture.md` to match reality: actual route inventory
  (`/api/admin/*` incl. workflows + analytics), the workflow layer, analytics
  service, `is_demo` seeding strategy, Ollama provider entry, project
  structure/planned-responsibilities drift. Ordinary implementation details
  stay out (§17 rule).

## 4. Acceptance Criteria

- [x] `seed_demo` on an empty DB → demo admin + customers + ≥10 tickets covering
      every category/priority/sentiment/status, multi-day `created_at` spread,
      analyses completed via the pipeline, workflows with `success` + `skipped`
      + `failed` runs — verified in pytest and live on Supabase (5 users,
      12 tickets, 12 analyses, 3 workflows, 27 runs)
- [x] `seed_demo --remove` → all demo rows gone, **pre-existing non-demo data
      untouched** (asserted by test); one command, per PLAN — live check:
      before/after counts identical (1 user / 1 ticket / 0 workflows)
- [x] Re-running `seed_demo` with demo data present → clear error, no duplicates
- [x] `AI_PROVIDER=ollama` → live analysis works end-to-end — **passed 2026-09-28
      against Ollama cloud** (`gpt-oss:20b`, analysis `completed` with
      `provider=ollama` + ticket write-back); provider failure paths →
      `failed`, ticket intact (verified by tests)
- [x] Full e2e walkthrough (PLAN): signup → submit ticket → AI analysis →
      admin review → workflow run → analytics (with demo data loaded) —
      **user confirmed 2026-09-28**
- [x] `pytest` green (new seed/provider tests + all 59 existing) — **73 passed,
      0 skipped** (live Ollama test now runs against the cloud)
- [x] `npm run lint` + `npm run build` + `impeccable detect` clean
- [x] README complete; `.ai/architecture.md` reflects the built system

## 5. Scope

**In:** seed CLI + migration + tests, Ollama provider + settings + tests,
UX polish fixes discovered during the audit, README rewrite, architecture doc
update, final end-to-end verification.

**Out (v1, per PLAN §2):** real email/push, visual builder, deployment,
production hardening, non-Ollama hosted providers (the interface allows them
later), screenshot capture by the assistant.

## 6. Technical Approach

- **Migration:** `is_demo` on `users` and `workflows`
  (`Boolean`, `nullable=False`, `server_default=false`) — autogenerate +
  apply to Supabase, same M1/M5 flow.
- **Seed:** `backend/app/cli/seed_demo.py` (mirrors `create_admin` CLI
  patterns): builds data with explicit `created_at` values, then reuses the
  **real** `analysis_service` and `workflow engine` so demo data exercises
  production code paths; `--remove` flag; models gain `is_demo` defaults of
  `False` (normal rows unaffected).
- **Ollama:** `backend/app/ai/ollama.py` implementing the `AIProvider`
  protocol (`analyze(subject, description) -> dict`), factory branch in
  `ai/base.py`, settings fields + `.env.example` entries; HTTP via the
  project's existing HTTP client dependency (confirm `httpx` is a runtime dep
  — promote from dev if only the test extra provides it).
- **Polish:** fix findings in place (no redesign — inherit + elevate per the
  active design direction); verify responsive behavior by inspecting layouts
  against the breakpoints used since M0.
- **Docs:** README from scratch (M0 scaffold version is a stub);
  architecture edits limited to §17 triggers.

## 7. Affected Areas

- `backend/app/models/user.py`, `models/workflow.py` (`is_demo`)
- New: `backend/app/cli/seed_demo.py`, `backend/app/ai/ollama.py`
- Modified: `app/ai/base.py` (factory), `app/core/config.py`, `.env.example`
- New tests: `tests/test_seed_demo.py`, `tests/test_ollama_provider.py`
- `frontend/` — polish fixes only as found
- Root `README.md`; `.ai/architecture.md`
- `PLAN.md` — tick/annotate M6 + D2 resolution in the decisions table

## 8. Dependencies

- **An Ollama endpoint** — Ollama cloud API key (chosen 2026-09-28) *or* a local
  install + pulled model; only needed for live/real analysis, everything else
  works without it. Model overridable via `OLLAMA_MODEL`.
- Supabase `.env` (existing), browser for the user's walkthrough, user-captured
  screenshots for the README.

## 9. Risks

- **Seed removal deleting real data** — mitigated by flag-only deletes +
  a test that seeds alongside a real user and asserts survival.
- **Ollama latency/quality varies by model** — analysis is already a
  post-response background step (M3); quality gates are the same Pydantic
  validation; failures land as `failed`.
- **Architecture doc drift during update** — §16 process: inspect code first,
  change only what §17 triggers cover.
- **Scope creep in polish pass** — fixes only; no redesigns beyond the
  established identity.

## 10. Verification

- [x] Migration applied on Supabase; `alembic current` = head (`4a2a875fb9dc`)
- [x] `pytest` full suite green (59 existing + new seed/ollama tests) —
      **72 passed, 1 skipped** (2026-09-28)
- [x] Seed on empty DB → counts + coverage assertions; `--remove` → clean;
      real-data-survival test passes — plus live Supabase run: before == after
- [x] Ollama live check passes when running / skips cleanly when not —
      **passes 2026-09-28 (Ollama cloud); skip path retained for a missing
      endpoint/key**
- [x] `npm run lint` + `npm run build` + `impeccable detect` → clean
- [x] Full e2e walkthrough with demo data (user) per PLAN M6 — **confirmed
      2026-09-28**
- [x] README + architecture update reviewed; no secrets tracked; logs updated

## 11. Notes

- **D2 resolved 2026-09-28:** provider = **Ollama**; `mock` stays the default
  for tests/demos — PLAN's decision point is closed and the decisions table
  gets updated.
- **Endpoint revised 2026-09-28 (user decision): Ollama cloud**, not a local
  install — `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_MODEL=gpt-oss:20b`
  (free-plan starter allowance), key in `.env` only. No code change was needed;
  the local install remains a config-only alternative. A local model closes the
  provider decision with no committed keys and no cost — cloud was chosen
  instead so nothing has to be installed on the machine.
- **`is_demo` chosen** over a naming namespace (explicit, PLAN-literal).
- Seed invents its own fictional business; it never modifies or removes rows it
  didn't create (flag-enforced).
- Screenshot capture falls to the user; README uses placeholders if omitted.
- This is the final milestone — completion means the project is handoff-ready
  (PLAN M6 exit).
