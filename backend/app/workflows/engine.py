"""Capped workflow engine (PLAN §5): `ticket.created` → AND conditions → actions.

Guarantee (PLAN M5): this engine NEVER raises into a request. Every evaluated
workflow gets exactly one `workflow_runs` row — `success`, `failed`, or
`skipped` — and a failing workflow can never be reported as successful
(context §4). Actions of a failed workflow are rolled back (savepoint), so a
half-applied automation leaves no trace beyond its `failed` run record.
"""

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_session_factory
from app.models.ai_analysis import AIAnalysis
from app.models.enums import (
    MessageSender,
    RunStatus,
    TicketPriority,
)
from app.models.ticket import Ticket, TicketMessage
from app.models.workflow import Workflow, WorkflowRun

logger = logging.getLogger(__name__)

TRIGGER_TICKET_CREATED = "ticket.created"
CONDITION_FIELDS = ("category", "priority", "sentiment", "status")
ACTION_TYPES = (
    "set_priority",
    "add_tag",
    "generate_suggested_response",
    "record_notification",
)

_ERROR_LIMIT = 500


def evaluate_ticket_workflows(ticket_id: int) -> None:
    """Background-task entry point — opens its own session (the request's
    session is closed by the time background tasks run). Never raises."""
    db = get_session_factory()()
    try:
        _evaluate_all(db, ticket_id)
    except Exception:  # noqa: BLE001 — last resort: log, never propagate
        logger.exception("Workflow evaluation crashed for ticket %s", ticket_id)
    finally:
        db.close()


def _evaluate_all(db: Session, ticket_id: int) -> None:
    workflows = db.scalars(
        select(Workflow).where(
            Workflow.is_active.is_(True),
            Workflow.trigger == TRIGGER_TICKET_CREATED,
        )
    ).all()
    if not workflows:
        return

    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        for workflow in workflows:
            db.add(
                WorkflowRun(
                    workflow_id=workflow.id,
                    status=RunStatus.FAILED,
                    details={"error": "Ticket no longer exists at evaluation"},
                )
            )
        db.commit()
        return

    analysis = ticket.ai_analysis
    for workflow in workflows:
        try:
            with db.begin_nested():
                status, details = _evaluate_one(db, ticket, analysis, workflow)
                db.flush()
        except Exception as exc:  # noqa: BLE001 — isolate per workflow
            status = RunStatus.FAILED
            details = {"error": _safe_error(exc)}
            logger.warning(
                "Workflow %s failed for ticket %s: %s",
                workflow.id,
                ticket_id,
                type(exc).__name__,
            )
        # The run row is added OUTSIDE the savepoint so it survives a rollback.
        db.add(WorkflowRun(workflow_id=workflow.id, status=status, details=details))
    db.commit()


def _evaluate_one(
    db: Session,
    ticket: Ticket,
    analysis: AIAnalysis | None,
    workflow: Workflow,
) -> tuple[RunStatus, dict[str, Any]]:
    conditions = workflow.conditions
    if not isinstance(conditions, list):
        raise ValueError("Workflow conditions are not a list")
    mismatch = _first_mismatch(ticket, analysis, conditions)
    if mismatch is not None:
        return RunStatus.SKIPPED, {
            "reason": "conditions_not_met",
            "mismatched": mismatch,
            "conditions": len(conditions),
        }

    actions = workflow.actions
    if not isinstance(actions, list) or not actions:
        raise ValueError("Workflow has no actions to execute")
    executed: list[dict[str, Any]] = []
    for action in actions:
        if not isinstance(action, dict):
            raise ValueError("Invalid action entry")
        action_type = action.get("type")
        if action_type not in ACTION_TYPES:
            raise ValueError(f"Unknown action type: {action_type!r}")
        note = _execute_action(db, ticket, analysis, action_type, action.get("value"))
        # Flush inside the savepoint so a later failure rolls this write back.
        db.flush()
        executed.append({"type": action_type, **({"note": note} if note else {})})
    return RunStatus.SUCCESS, {
        "conditions": len(conditions),
        "actions": executed,
    }


def _first_mismatch(
    ticket: Ticket,
    analysis: AIAnalysis | None,
    conditions: list[Any],
) -> dict[str, Any] | None:
    """AND semantics: return the first condition that does not match."""
    for condition in conditions:
        if not isinstance(condition, dict):
            raise ValueError("Invalid condition entry")
        field = condition.get("field")
        expected = condition.get("value")
        if field not in CONDITION_FIELDS:
            raise ValueError(f"Unknown condition field: {field!r}")

        if field == "category":
            actual = ticket.category
            matches = (expected or "").strip().casefold() == (actual or "").strip().casefold()
        elif field == "priority":
            actual = ticket.priority.value if ticket.priority else None
            matches = actual is not None and actual == expected
        elif field == "sentiment":
            actual = (
                analysis.sentiment.value if analysis and analysis.sentiment else None
            )
            matches = actual is not None and actual == expected
        else:  # status — always present on a ticket
            actual = ticket.status.value
            matches = actual == expected

        if not matches:
            return {"field": field, "expected": expected, "actual": actual}
    return None


def _execute_action(
    db: Session,
    ticket: Ticket,
    analysis: AIAnalysis | None,
    action_type: str,
    value: Any,
) -> str | None:
    if action_type == "set_priority":
        priority = TicketPriority(value)  # raises on unknown value (→ failed)
        if ticket.priority == priority:
            return "priority already set"
        ticket.priority = priority
        return None

    if action_type == "add_tag":
        tag = str(value).strip()
        if not tag or len(tag) > 30:
            raise ValueError("Invalid tag value")
        tags = list(ticket.tags or [])
        if tag in tags:
            return "already tagged"
        tags.append(tag)
        ticket.tags = tags
        return None

    if action_type == "generate_suggested_response":
        if analysis is None:
            raise ValueError("Ticket has no analysis row")
        if analysis.is_human_confirmed:
            return "skipped: human-confirmed"
        analysis.suggested_response = _render_template(str(value), ticket)
        return None

    if action_type == "record_notification":
        db.add(
            TicketMessage(
                ticket_id=ticket.id,
                sender=MessageSender.SYSTEM,
                content=_render_template(str(value), ticket),
            )
        )
        return None

    raise ValueError(f"Unknown action type: {action_type!r}")


def _render_template(template: str, ticket: Ticket) -> str:
    """`{customer}` / `{subject}` substitution; unknown placeholders stay."""
    return (
        template.replace("{customer}", ticket.customer.user.full_name)
        .replace("{subject}", ticket.subject)
    )


def _safe_error(exc: Exception) -> str:
    """Single-line, truncated error text for the DB — no tracebacks, no keys."""
    text = f"{type(exc).__name__}: {exc}".replace("\n", " ").strip()
    return text[:_ERROR_LIMIT]
