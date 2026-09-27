"""Workflow config CRUD, run queries, and analytics aggregates.

Routes stay thin; the engine (`app.workflows.engine`) owns execution and the
analytics numbers are computed here with SQL GROUP BY (DB-derived only —
the frontend never aggregates).
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ai_analysis import AIAnalysis
from app.models.enums import AnalysisStatus, RunStatus, TicketStatus
from app.models.ticket import Ticket
from app.models.workflow import Workflow, WorkflowRun
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate

_UNCATEGORIZED = "uncategorized"


class NotFoundError(Exception):
    """Unknown workflow in an admin operation → 404."""


def _run_counts(db: Session) -> dict[int, dict[str, int]]:
    counts: dict[int, dict[str, int]] = {}
    for workflow_id, status, count in db.execute(
        select(WorkflowRun.workflow_id, WorkflowRun.status, func.count(WorkflowRun.id))
        .group_by(WorkflowRun.workflow_id, WorkflowRun.status)
    ):
        counts.setdefault(
            workflow_id,
            {s.value: 0 for s in RunStatus},
        )[status.value] = count
    return counts


def _serialize(workflow: Workflow, counts: dict[str, int]) -> dict[str, Any]:
    return {
        "id": workflow.id,
        "name": workflow.name,
        "is_active": workflow.is_active,
        "trigger": workflow.trigger,
        "conditions": workflow.conditions or [],
        "actions": workflow.actions or [],
        "created_at": workflow.created_at,
        "run_counts": counts,
    }


def list_workflows(db: Session) -> list[dict[str, Any]]:
    counts = _run_counts(db)
    workflows = db.scalars(select(Workflow).order_by(Workflow.created_at.asc())).all()
    return [
        _serialize(w, counts.get(w.id, {s.value: 0 for s in RunStatus}))
        for w in workflows
    ]


def get_workflow(db: Session, workflow_id: int) -> Workflow:
    workflow = db.get(Workflow, workflow_id)
    if workflow is None:
        raise NotFoundError(workflow_id)
    return workflow


def get_workflow_row(db: Session, workflow_id: int) -> dict[str, Any]:
    workflow = get_workflow(db, workflow_id)
    counts = _run_counts(db).get(workflow.id, {s.value: 0 for s in RunStatus})
    return _serialize(workflow, counts)


def create_workflow(db: Session, payload: WorkflowCreate) -> dict[str, Any]:
    workflow = Workflow(
        name=payload.name.strip(),
        trigger=payload.trigger,
        is_active=payload.is_active,
        conditions=[c.model_dump() for c in payload.conditions],
        actions=[a.model_dump() for a in payload.actions],
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return _serialize(workflow, {s.value: 0 for s in RunStatus})


def update_workflow(
    db: Session, workflow_id: int, payload: WorkflowUpdate
) -> dict[str, Any]:
    workflow = get_workflow(db, workflow_id)
    if payload.name is not None:
        workflow.name = payload.name.strip()
    if payload.is_active is not None:
        workflow.is_active = payload.is_active
    if payload.conditions is not None:
        workflow.conditions = [c.model_dump() for c in payload.conditions]
    if payload.actions is not None:
        workflow.actions = [a.model_dump() for a in payload.actions]
    db.commit()
    db.refresh(workflow)
    counts = _run_counts(db).get(workflow.id, {s.value: 0 for s in RunStatus})
    return _serialize(workflow, counts)


def delete_workflow(db: Session, workflow_id: int) -> None:
    workflow = get_workflow(db, workflow_id)
    db.delete(workflow)  # runs cascade via ORM "all, delete-orphan"
    db.commit()


def workflow_runs(db: Session, workflow_id: int) -> list[WorkflowRun]:
    get_workflow(db, workflow_id)  # 404 for unknown workflow
    return db.scalars(
        select(WorkflowRun)
        .where(WorkflowRun.workflow_id == workflow_id)
        .order_by(WorkflowRun.created_at.desc(), WorkflowRun.id.desc())
        .limit(20)
    ).all()


def analytics(db: Session, days: int) -> dict[str, Any]:
    """Windowed aggregates, all SQL-side. Days are bucketed in UTC (both
    SQLite CURRENT_TIMESTAMP and PostgreSQL now() store UTC)."""
    today_utc = datetime.now(timezone.utc).date()
    first_day = today_utc - timedelta(days=days - 1)
    cutoff = datetime.combine(first_day, datetime.min.time()).replace(tzinfo=None)

    total_tickets = db.scalar(select(func.count(Ticket.id))) or 0

    by_status = {s.value: 0 for s in TicketStatus}
    for status_value, count in db.execute(
        select(Ticket.status, func.count(Ticket.id))
        .where(Ticket.created_at >= cutoff)
        .group_by(Ticket.status)
    ):
        by_status[status_value.value] = count

    by_category: list[dict[str, Any]] = []
    for category, count in db.execute(
        select(Ticket.category, func.count(Ticket.id))
        .where(Ticket.created_at >= cutoff)
        .group_by(Ticket.category)
        .order_by(func.count(Ticket.id).desc())
    ):
        by_category.append({"category": category or _UNCATEGORIZED, "count": count})

    counts_by_day = {
        day: count
        for day, count in db.execute(
            select(func.date(Ticket.created_at), func.count(Ticket.id))
            .where(Ticket.created_at >= cutoff)
            .group_by(func.date(Ticket.created_at))
        )
    }
    by_day = [
        {
            "date": day.isoformat() if hasattr(day, "isoformat") else str(day),
            "count": counts_by_day.get(day, counts_by_day.get(str(day), 0)),
        }
        for day in (first_day + timedelta(days=i) for i in range(days))
    ]

    ai_completed = (
        db.scalar(
            select(func.count(AIAnalysis.id)).where(
                AIAnalysis.status == AnalysisStatus.COMPLETED,
                AIAnalysis.created_at >= cutoff,
            )
        )
        or 0
    )
    ai_confirmed = (
        db.scalar(
            select(func.count(AIAnalysis.id)).where(
                AIAnalysis.is_human_confirmed.is_(True),
                AIAnalysis.created_at >= cutoff,
            )
        )
        or 0
    )

    return {
        "days": days,
        "total_tickets": total_tickets,
        "by_status": by_status,
        "by_category": by_category,
        "by_day": by_day,
        "ai": {"completed": ai_completed, "human_confirmed": ai_confirmed},
    }
