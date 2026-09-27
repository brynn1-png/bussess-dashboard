"""Admin use cases: cross-customer visibility, aggregation, guarded updates.

Authorization is enforced at the route layer (`require_admin`) — this service
owns queries and update rules only. Aggregates are computed server-side
(PLAN: DB-derived numbers, never frontend math).
"""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ai_analysis import AIAnalysis
from app.models.enums import AnalysisStatus, TicketPriority, TicketStatus
from app.models.ticket import Ticket
from app.models.user import Customer, User
from app.schemas.admin import UpdateAnalysisRequest, UpdateTicketRequest

_PRIORITY_VALUE: dict[TicketPriority, int] = {
    TicketPriority.LOW: 1,
    TicketPriority.MEDIUM: 2,
    TicketPriority.HIGH: 3,
    TicketPriority.URGENT: 4,
}


class NotFoundError(Exception):
    """Unknown ticket (or its analysis) in an admin operation → 404."""


def _ticket_summary(ticket: Ticket, customer_name: str) -> dict[str, Any]:
    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "status": ticket.status,
        "category": ticket.category,
        "priority": ticket.priority,
        "customer_name": customer_name,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
    }


def overview(db: Session) -> dict[str, Any]:
    total_tickets = db.scalar(select(func.count(Ticket.id))) or 0
    total_customers = db.scalar(select(func.count(Customer.id))) or 0

    statuses = {s.value: 0 for s in TicketStatus}
    for status_value, count in db.execute(
        select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status)
    ):
        statuses[status_value.value] = count

    priorities = {p.value: 0 for p in TicketPriority}
    weighted_sum = 0
    assigned_total = 0
    for priority_value, count in db.execute(
        select(Ticket.priority, func.count(Ticket.id))
        .where(Ticket.priority.is_not(None))
        .group_by(Ticket.priority)
    ):
        priorities[priority_value.value] = count
        weighted_sum += _PRIORITY_VALUE[priority_value] * count
        assigned_total += count
    priorities["unassigned"] = total_tickets - assigned_total
    avg_priority = round(weighted_sum / assigned_total, 2) if assigned_total else None

    ai = {s.value: 0 for s in AnalysisStatus}
    for status_value, count in db.execute(
        select(AIAnalysis.status, func.count(AIAnalysis.id)).group_by(AIAnalysis.status)
    ):
        ai[status_value.value] = count
    human_confirmed = (
        db.scalar(
            select(func.count(AIAnalysis.id)).where(AIAnalysis.is_human_confirmed.is_(True))
        )
        or 0
    )
    awaiting_review = (
        db.scalar(
            select(func.count(AIAnalysis.id)).where(
                AIAnalysis.status == AnalysisStatus.COMPLETED,
                AIAnalysis.is_human_confirmed.is_(False),
            )
        )
        or 0
    )

    recent = [
        _ticket_summary(ticket, full_name)
        for ticket, full_name in db.execute(
            select(Ticket, User.full_name)
            .join(Customer, Ticket.customer_id == Customer.id)
            .join(User, Customer.user_id == User.id)
            .order_by(Ticket.created_at.desc())
            .limit(5)
        )
    ]

    return {
        "total_tickets": total_tickets,
        "total_customers": total_customers,
        "avg_priority": avg_priority,
        "statuses": statuses,
        "priorities": priorities,
        "ai": {
            **ai,
            "human_confirmed": human_confirmed,
            "awaiting_review": awaiting_review,
        },
        "recent_tickets": recent,
    }


def list_tickets(db: Session, status_filter: TicketStatus | None) -> list[dict[str, Any]]:
    stmt = (
        select(Ticket, User.full_name)
        .join(Customer, Ticket.customer_id == Customer.id)
        .join(User, Customer.user_id == User.id)
        .order_by(Ticket.created_at.desc())
    )
    if status_filter is not None:
        stmt = stmt.where(Ticket.status == status_filter)
    return [_ticket_summary(ticket, name) for ticket, name in db.execute(stmt)]


def ticket_summary(db: Session, ticket_id: int) -> dict[str, Any]:
    row = db.execute(
        select(Ticket, User.full_name)
        .join(Customer, Ticket.customer_id == Customer.id)
        .join(User, Customer.user_id == User.id)
        .where(Ticket.id == ticket_id)
    ).first()
    if row is None:
        raise NotFoundError(ticket_id)
    return _ticket_summary(row[0], row[1])


def ticket_detail(db: Session, ticket_id: int) -> dict[str, Any]:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise NotFoundError(ticket_id)

    owner = ticket.customer.user
    analysis = ticket.ai_analysis
    analysis_data = (
        {
            "id": analysis.id,
            "status": analysis.status,
            "category": analysis.category,
            "priority": analysis.priority,
            "sentiment": analysis.sentiment,
            "summary": analysis.summary,
            "suggested_response": analysis.suggested_response,
            "is_human_confirmed": analysis.is_human_confirmed,
            "provider": analysis.provider,
            "error_message": analysis.error_message,
            "created_at": analysis.created_at,
            "updated_at": analysis.updated_at,
        }
        if analysis is not None
        else None
    )

    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "category": ticket.category,
        "priority": ticket.priority,
        "tags": ticket.tags or [],
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "customer": {
            "id": owner.id,
            "full_name": owner.full_name,
            "email": owner.email,
        },
        "messages": [
            {
                "id": message.id,
                "ticket_id": message.ticket_id,
                "sender": message.sender,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in ticket.messages
        ],
        "analysis": analysis_data,
    }


def update_ticket(
    db: Session, ticket_id: int, payload: UpdateTicketRequest
) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise NotFoundError(ticket_id)
    if payload.status is not None:
        ticket.status = payload.status
    if payload.category is not None:
        ticket.category = payload.category.strip()
    if payload.priority is not None:
        ticket.priority = payload.priority
    db.commit()
    db.refresh(ticket)
    return ticket


def update_analysis(
    db: Session, ticket_id: int, payload: UpdateAnalysisRequest
) -> AIAnalysis:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise NotFoundError(ticket_id)
    analysis = ticket.ai_analysis
    if analysis is None:
        raise NotFoundError(ticket_id)
    if payload.suggested_response is not None:
        analysis.suggested_response = payload.suggested_response.strip()
    if payload.is_human_confirmed is not None:
        analysis.is_human_confirmed = payload.is_human_confirmed
    db.commit()
    db.refresh(analysis)
    return analysis


def customers(db: Session) -> list[dict[str, Any]]:
    rows = db.execute(
        select(Customer, User.full_name, User.email, func.count(Ticket.id))
        .join(User, Customer.user_id == User.id)
        .outerjoin(Ticket, Ticket.customer_id == Customer.id)
        .group_by(Customer.id, User.id, User.full_name, User.email)
        .order_by(Customer.created_at.asc())
    ).all()
    return [
        {
            "id": customer.id,
            "full_name": full_name,
            "email": email,
            "ticket_count": ticket_count,
            "created_at": customer.created_at,
        }
        for customer, full_name, email, ticket_count in rows
    ]
