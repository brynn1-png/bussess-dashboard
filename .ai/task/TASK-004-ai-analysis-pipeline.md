# TASK-004: AI Analysis Pipeline (M3)

**Status:** Completed (2026-09-28) — all acceptance criteria verified (pytest 36/36, live 11/11); commit pending user

**Created:** 2026-09-28

**Basis:** `PLAN.md` §M3, `.ai/architecture.md` §4 (AI Layer) + §12 (Decisions 4, 5), `.ai/context.md` §4/§5 (AI rules).

---

## 1. Objective

When a customer submits a ticket, the system automatically analyzes it — category, priority, sentiment, summary, and a suggested response — through a pluggable AI provider, storing only validated results. Analysis must never break ticket creation, and AI output must remain clearly distinguishable from human-confirmed answers (until an admin confirms it in M4).

---

## 2. Problem

Tickets currently sit unprocessed: an admin would have to read every one and decide category/priority by hand, and there is no suggested response. The platform's core promise ("AI Business Automation") starts here. The system must also survive AI failure gracefully — a dead or hallucinating provider must not cost us a ticket or a 500.

---

## 3. Requirements

### Trigger & failure isolation
- Analysis runs as a **separate step after ticket creation**: the route enqueues it via FastAPI `BackgroundTasks` (in-process — no Redis/Celery, per architecture Decision 5). The task opens its **own DB session**.
- `POST /api/tickets` behavior is unchanged: creation success is independent of AI. If analysis fails for any reason, the ticket remains intact with its opening message.
- The analysis service **never raises**: provider exceptions, validation errors, and configuration errors are caught and persisted as `status = failed` with a sanitized, truncated `error_message` (no provider internals/keys exposed).

### Provider abstraction (`backend/app/ai/`)
- `base.py` — `AIProvider` protocol: `name: str`, `analyze(subject, description) -> dict` (raw output, deliberately *unvalidated* so bad output can be rejected).
- `schemas.py` — `AnalysisResult` (Pydantic): `category` (≤50 chars — DB limit), `priority` (`TicketPriority`), `sentiment` (`Sentiment`), `summary`, `suggested_response`. Validation happens **before persistence**; invalid output → `failed`, never stored partially.
- `mock.py` — `MockProvider` (deterministic, keyword-based, free, offline):
  - **category:** billing / delivery / account / technical_support / product_question / general (keyword sets; first match wins in that order)
  - **sentiment:** negative keywords checked first (angry, refund, broken, frustrated, …), then positive (thanks, great, …), else neutral
  - **priority:** urgent keywords (urgent, asap, outage, critical, …) → `urgent`; else negative sentiment → `high`; else category technical_support/account → `medium`; else `low`
  - **summary:** template — `"Customer reports: {subject}. {first 150 chars of description}…"`
  - **suggested_response:** category-keyed template reply, clearly a draft
- Provider selected by `settings.ai_provider` (env `AI_PROVIDER`, default `mock`); unknown value → analysis `failed` with clear message (factory raises, service catches).
- **Decision point (PLAN M3):** real provider — **resolved: mock only for now** (user decision 2026-09-28, §11); real provider selected before M4/M6 exit.

### Persistence & write-back
- One `ai_analysis` row per ticket (unique FK already in schema): `pending` written first, then `completed` + fields + `provider` name, or `failed` + `error_message`.
- On `completed`: copy `category` and `priority` onto the ticket itself (model comment: "Set by … AI analysis / admin review later") so lists/dashboards can sort and filter — and the customer's priority badge updates.
- **No `tickets.analysis_status` column.** PLAN says "ticket stores analysis_status"; the 1:1 `ai_analysis.status` already provides exactly pending/completed/failed per ticket, so we read it through the relationship instead. No migration, one source of truth (deviation logged in §11).

### Frontend (minimal)
- `PriorityBadge` gains an `urgent` style (AI can now return `urgent`; `TicketPriority` union in `api.ts` updated to include it) — otherwise the badge renders undefined classes.

### Non-goals (M3)
- No new HTTP endpoints; no UI screens (AI review UI is M4). Tests observe the DB directly.
- No `is_human_confirmed` flows yet (M4), no workflows (M5), no re-analysis endpoint.

---

## 4. Acceptance Criteria

- [x] Pytest: submitting a ticket triggers analysis automatically → `ai_analysis` row exists for **that** ticket, status `completed`, all fields populated, `provider = "mock"`, ticket `category`/`priority` written back
- [x] Pytest: mock output is deterministic (same input → same analysis)
- [x] Pytest: **provider failure** (inject raising provider) → ticket + opening message still exist, analysis status `failed`, `error_message` recorded, `POST /api/tickets` still 201
- [x] Pytest: **malformed AI output** (provider returns invalid enum/overlong category) → validation rejects → status `failed`, nothing partial persisted
- [x] Pytest: unknown `AI_PROVIDER` value → status `failed` with clear message (no crash)
- [x] Pytest: existing suite still green (31/31 + new → **36/36**)
- [x] `npm run lint` + `npm run build` pass (badge change)
- [x] Live check: submit a ticket via API against Supabase → analysis row `completed` with mock output; cleanup — **11/11**
- [x] No secrets committed; AI keys (when introduced) live only in `.env`

---

## 5. Scope

### In Scope
- `backend/app/ai/` package (base, schemas, mock), `services/analysis_service.py`, factory + `AI_PROVIDER` setting, `.env.example` entry (no key needed for mock)
- Trigger wiring in `api/tickets.py` (BackgroundTasks)
- Frontend `urgent` badge + type
- Tests (`test_analysis.py`), live verification, logs

### Out of Scope
- Real provider implementation — **unless the user picks one at approval** (decision point, §11)
- Admin UI, `is_human_confirmed` marking, re-analysis, streaming/async providers, background job infrastructure (Redis/Celery)

---

## 6. Technical Approach

```text
POST /api/tickets
  → ticket_service.create_ticket()  (unchanged: ticket + opening message, committed)
  → background.add_task(analysis_service.analyze_ticket, ticket.id)
       └─ own session (get_session_factory)
          1. insert ai_analysis(status=pending)
          2. provider = get_provider(settings.ai_provider)      # factory, may raise
          3. raw = provider.analyze(subject, description)         # may raise
          4. result = AnalysisResult.model_validate(raw)          # may raise
          5. save fields + status=completed; write ticket.category/priority
          └─ any exception → status=failed + sanitized error_message; never re-raise

backend/app/ai/
  __init__.py  base.py (AIProvider protocol)  schemas.py (AnalysisResult)  mock.py
backend/app/services/analysis_service.py      # orchestration + persistence
backend/app/core/config.py                    # ai_provider: str = "mock"
```

- Tests: FastAPI's `TestClient` runs background tasks before returning → deterministic assertions; failing/invalid providers injected via monkeypatch/factory override.
- Existing pattern kept: routes thin, logic in services, schemas at the boundary.

---

## 7. Affected Areas

### Files / Modules
- New: `backend/app/ai/{__init__,base,schemas,mock}.py`, `backend/app/services/analysis_service.py`, `backend/tests/test_analysis.py`
- Modified: `backend/app/api/tickets.py` (enqueue), `backend/app/core/config.py` (setting), `backend/.env.example`, `frontend/src/components/ui.tsx`, `frontend/src/services/api.ts` (priority type)
- Optional (if real provider approved): `backend/app/ai/<provider>_provider.py` + deps

### Database
- Writes `ai_analysis` rows + `tickets.category`/`tickets.priority` — **no schema change**

### APIs
- None changed; `POST /api/tickets` response identical

### UI
- Only the `urgent` badge variant

---

## 8. Dependencies
- M2 complete (TASK-003, user-confirmed walkthrough)
- Decisions: D2 (mock-first), architecture Decision 4 (AI backend-only), Decision 5 (no background infra)

## 9. Risks
- **Failure isolation is the risk zone** — a raised exception escaping the service would log noise and could surface as a broken request; every exit path is tested (provider raise, bad output, bad config).
- **Mock realism vs. honesty:** mock output is rule-based, not intelligent — `.env.example`/README must not imply real AI is running; `provider` column records which engine produced each result.
- **Category width:** DB column is `String(50)` — schema enforces `max_length=50` so a long AI category can't cause a DB error.
- **Race on read:** a customer opening the ticket milliseconds after submit may see no analysis yet — harmless (customer UI doesn't display AI data); noted for M4 (pending state shown).
- **Real-provider scope creep** — key handling, retries, cost: deliberately deferred unless approved at this milestone.

## 10. Verification
- [x] `pytest` — new analysis tests + full suite green (36/36)
- [x] `npm run lint` + `npm run build`
- [x] Live: one real ticket against Supabase → analysis `completed` (mock) → cleanup
- [x] Changed files reviewed; no secrets tracked

## 11. Notes / Decision Points

1. **PLAN deviation — `analysis_status`:** PLAN M3 wording implies a ticket column; we use the existing 1:1 `ai_analysis.status` instead (identical observable behavior, no migration). Deviation documented here per harness rules; log to `decisions.md` at close-out.
2. **Real provider decision (PLAN: "select before M3 exit") — RESOLVED 2026-09-28:**
   - **User choice: (a) Mock only** — ship M3 with the deterministic mock; the real provider (OpenAI/Anthropic/other) is chosen before M4/M6 exit, when the user is ready for key + cost setup.
   - Implementation follows D2's mock-first strategy exactly; `provider` column records `"mock"` per row so real AI can be told apart later.

---

## 12. Verification Record (2026-09-28)

- **Backend:** `pytest` → **36/36 passed** — 5 new tests: happy path (completed + provider=mock + billing/negative/high + `is_human_confirmed=False` + ticket write-back), deterministic mock (delivery/neutral/low + urgent case), provider crash (201 + ticket/messages intact + `failed` + no partial write-back), malformed output (validation → `failed`, all fields None), unknown config (`UnknownProviderError` recorded, creation unaffected).
- **Frontend:** `npm run lint` clean; `npm run build` (tsc + vite) passes; `impeccable detect` on changed files → no findings. Contrast spot-check: white on `red-600` badge = 4.83:1 (≥4.5 ✓).
- **Live e2e vs Supabase through running uvicorn (11/11):** health 200 · register 201 · create 201 · analysis row exists → `completed` · provider `mock` · fields populated (billing/negative/urgent) · `is_human_confirmed` false · no error_message · ticket write-back verified · walkthrough data cleaned.
- **En route fix:** test helper returned the whole token object instead of `access_token` string → 401s; corrected helper (4 tests green).
- **Scope note:** failure paths verified in pytest only — no server-side provider switch exists to trigger them live (by design, no new endpoint in M3).
- **Pending:** user commit of M3 files.
