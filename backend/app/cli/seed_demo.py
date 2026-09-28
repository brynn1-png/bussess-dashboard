"""Seed (and remove) demo data — PLAN M6.

Every row created here is tagged `is_demo = true` on the two roots (`users`
and `workflows`); customers, tickets, messages, analyses, and runs belong to
those roots and are removed with them by ORM cascade. `--remove` deletes ONLY
`is_demo` rows, so real data can never be touched.

The seed exercises the REAL pipeline: analysis runs through the analysis
service and workflows run through the actual engine. The provider is forced
to `mock` for the duration of the seed so demo categories/priorities/sentiments
are deterministic regardless of `AI_PROVIDER` (a live Ollama need not be
running to seed).

Usage (from backend/):
    python -m app.cli.seed_demo            # create demo data (refuses if present)
    python -m app.cli.seed_demo --remove   # delete demo data (idempotent)
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import ConfigurationError, settings
from app.core.security import hash_password
from app.database.session import get_session_factory
from app.models.ai_analysis import AIAnalysis
from app.models.enums import (
    MessageSender,
    TicketPriority,
    TicketStatus,
    UserRole,
)
from app.models.ticket import Ticket, TicketMessage
from app.models.user import Customer, User
from app.models.workflow import Workflow, WorkflowRun
from app.services.analysis_service import analyze_ticket
from app.workflows.engine import evaluate_ticket_workflows


class SeedError(Exception):
    """Raised when seeding cannot proceed (e.g. demo data already exists)."""


# Printed to the console for the walkthrough; the whole dataset is removed
# with --remove, so this is not a real credential anywhere else.
DEMO_PASSWORD = "Demo!Pass123"

_DEMO_ADMIN_EMAIL = "admin@demo.example.com"

# (email, full_name, company, phone)
_DEMO_CUSTOMERS: list[tuple[str, str, str | None, str | None]] = [
    ("ava.reyes@demo.example.com", "Ava Reyes", "Reyes Retail", "+1 555 0101"),
    ("liam.chen@demo.example.com", "Liam Chen", "Chen Logistics", "+1 555 0102"),
    ("sofia.marques@demo.example.com", "Sofia Marques", None, "+1 555 0103"),
    ("noah.williams@demo.example.com", "Noah Williams", "Williams & Co", None),
]

# (subject, description, status, days_ago)
# Written so the mock provider's rules produce guaranteed full coverage:
# 6 categories x 4 priorities x 3 sentiments x 4 statuses, spread over 9 days
# (analytics `by_day` gets a populated chart; 7-day window has traffic every day).
_DEMO_TICKETS: list[tuple[str, str, TicketStatus, int]] = [
    (
        "Duplicate charge on my invoice",
        "I was charged twice for invoice #4821 last month. Please refund the "
        "extra payment — this is the second time it happened.",
        TicketStatus.OPEN,
        1,
    ),
    (
        "Question about pricing plans",
        "How much does the standard plan cost per month? I would like to "
        "understand the pricing before I upgrade.",
        TicketStatus.RESOLVED,
        2,
    ),
    (
        "Where is my parcel?",
        "The tracking says my parcel shipped three days ago and it still "
        "hasn't arrived. When will it be delivered?",
        TicketStatus.IN_PROGRESS,
        0,
    ),
    (
        "Package never arrived at my door",
        "Tracking shows my package was delivered but nothing arrived. I am "
        "still waiting and getting frustrated.",
        TicketStatus.OPEN,
        3,
    ),
    (
        "Locked out of my account",
        "I cannot sign in — my account shows as locked after too many "
        "attempts. Please help me regain access.",
        TicketStatus.IN_PROGRESS,
        1,
    ),
    (
        "Password reset email never arrives",
        "I requested a password reset twice and nothing arrived. I am "
        "disappointed with the lack of response.",
        TicketStatus.OPEN,
        4,
    ),
    (
        "App crashes during checkout",
        "Every time I reach the checkout screen the app crashes. This bug "
        "appeared after the latest release.",
        TicketStatus.OPEN,
        0,
    ),
    (
        "API returning errors since yesterday",
        "Our integration fails constantly — every request returns a 500 "
        "error. This is becoming useless for our workflow.",
        TicketStatus.IN_PROGRESS,
        2,
    ),
    (
        "How do I export reports?",
        "I would like to export monthly reports to CSV files. How do I do "
        "that from the dashboard?",
        TicketStatus.RESOLVED,
        5,
    ),
    (
        "Does it work with mobile devices?",
        "Does the dashboard support mobile browsers? I need to check tickets "
        "from my phone while traveling.",
        TicketStatus.CLOSED,
        6,
    ),
    (
        "Service outage in our region",
        "The service has been down for 20 minutes and our team cannot work. "
        "This is an urgent situation.",
        TicketStatus.OPEN,
        0,
    ),
    (
        "Thanks for the quick fix!",
        "Your team fixed my issue within an hour — great support, I really "
        "appreciate it.",
        TicketStatus.CLOSED,
        8,
    ),
]

# Demo workflows (all is_demo). The third one carries a deliberately invalid
# action type the API would reject — the engine records it as a `failed` run
# and it stays paused afterwards, so the run history shows all three states
# without failing every future evaluation.
_DEMO_WORKFLOWS: list[dict[str, Any]] = [
    {
        "name": "Demo: tag billing tickets",
        "is_active": True,
        "conditions": [{"field": "category", "value": "billing"}],
        "actions": [
            {"type": "add_tag", "value": "billing-review"},
            {
                "type": "record_notification",
                "value": "Demo workflow flagged '{subject}' from {customer} "
                "for billing review.",
            },
        ],
    },
    {
        "name": "Demo: never-matching rule (always skips)",
        "is_active": True,
        "conditions": [
            {"field": "category", "value": "account"},
            {"field": "priority", "value": "urgent"},
        ],
        "actions": [{"type": "add_tag", "value": "urgent-account"}],
    },
    {
        "name": "Demo: broken action (paused)",
        "is_active": False,
        "conditions": [],
        "actions": [{"type": "escalate_to_manager", "value": "page the on-call"}],
    },
]


def demo_exists(db: Session) -> bool:
    """True when any demo root row (user or workflow) is present."""
    user_count = db.scalar(
        select(func.count(User.id)).where(User.is_demo.is_(True))
    )
    workflow_count = db.scalar(
        select(func.count(Workflow.id)).where(Workflow.is_demo.is_(True))
    )
    return bool(user_count) or bool(workflow_count)


def seed(db: Session) -> dict[str, int]:
    """Create the demo dataset. Raises `SeedError` if demo data exists."""
    if demo_exists(db):
        raise SeedError(
            "Demo data already exists — run with --remove before seeding again."
        )

    # Deterministic demo: mock rules decide category/priority/sentiment so the
    # coverage matrix below (and any walkthrough) holds regardless of AI_PROVIDER.
    previous_provider = settings.ai_provider
    settings.ai_provider = "mock"
    try:
        return _seed(db)
    finally:
        settings.ai_provider = previous_provider


def _seed(db: Session) -> dict[str, int]:
    now = datetime.now(timezone.utc)

    # Root 1: demo users (admin + customers).
    db.add(
        User(
            email=_DEMO_ADMIN_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Demo Administrator",
            role=UserRole.ADMIN,
            is_demo=True,
        )
    )
    customers: list[Customer] = []
    for email, full_name, company, phone in _DEMO_CUSTOMERS:
        user = User(
            email=email,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name=full_name,
            role=UserRole.CUSTOMER,
            is_demo=True,
        )
        db.add(user)
        customer = Customer(user=user, company=company, phone=phone)
        db.add(customer)  # cascade_backrefs is off in SQLAlchemy 2 — add explicitly
        customers.append(customer)
    db.commit()

    # Root 2: demo workflows (broken one parked until its single recorded failure).
    workflows: list[Workflow] = []
    for spec in _DEMO_WORKFLOWS:
        workflow = Workflow(
            name=spec["name"],
            trigger="ticket.created",
            is_active=spec["is_active"],
            is_demo=True,
            conditions=spec["conditions"],
            actions=spec["actions"],
        )
        db.add(workflow)
        workflows.append(workflow)
    db.commit()
    broken = workflows[2]

    # Tickets through the real pipeline: create -> analysis (mock) -> engine.
    last_ticket_id: int | None = None
    for index, (subject, description, status, days_ago) in enumerate(_DEMO_TICKETS):
        created_at = now - timedelta(days=days_ago, hours=index % 6)
        ticket = Ticket(
            customer_id=customers[index % len(customers)].id,
            subject=subject,
            description=description,
            status=status,
            priority=TicketPriority.LOW,
            created_at=created_at,
            updated_at=created_at,
        )
        db.add(ticket)
        db.flush()
        ticket_id = ticket.id  # capture BEFORE commit (expire_on_commit)
        db.add(
            TicketMessage(
                ticket_id=ticket_id,
                sender=MessageSender.CUSTOMER,
                content=description,
                created_at=created_at,
            )
        )
        db.commit()  # visible to the service/engine sessions below

        analyze_ticket(ticket_id)  # own session: mock analysis + write-back
        db.expire_all()
        evaluate_ticket_workflows(ticket_id)  # own session: success/skipped runs
        db.expire_all()
        last_ticket_id = ticket_id

    # One recorded `failed` run for the demo, then park the broken workflow
    # again so it never breaks future evaluations.
    broken.is_active = True
    db.commit()
    assert last_ticket_id is not None
    evaluate_ticket_workflows(last_ticket_id)  # records: skipped, skipped, failed
    db.expire_all()
    broken.is_active = False
    db.commit()

    return _counts(db)


def _counts(db: Session) -> dict[str, int]:
    users = db.scalar(select(func.count(User.id)).where(User.is_demo.is_(True))) or 0
    tickets = (
        db.scalar(
            select(func.count(Ticket.id))
            .join(Customer, Ticket.customer_id == Customer.id)
            .join(User, Customer.user_id == User.id)
            .where(User.is_demo.is_(True))
        )
        or 0
    )
    analyses = (
        db.scalar(
            select(func.count(AIAnalysis.id))
            .join(Ticket, AIAnalysis.ticket_id == Ticket.id)
            .join(Customer, Ticket.customer_id == Customer.id)
            .join(User, Customer.user_id == User.id)
            .where(User.is_demo.is_(True))
        )
        or 0
    )
    workflows = (
        db.scalar(select(func.count(Workflow.id)).where(Workflow.is_demo.is_(True)))
        or 0
    )
    runs = (
        db.scalar(
            select(func.count(WorkflowRun.id))
            .join(Workflow, WorkflowRun.workflow_id == Workflow.id)
            .where(Workflow.is_demo.is_(True))
        )
        or 0
    )
    return {
        "users": users,
        "tickets": tickets,
        "analyses": analyses,
        "workflows": workflows,
        "runs": runs,
    }


def remove_demo(db: Session) -> dict[str, int]:
    """Delete ONLY is_demo rows (idempotent); ownership cascades take the rest."""
    workflows = db.scalars(select(Workflow).where(Workflow.is_demo.is_(True))).all()
    users = db.scalars(select(User).where(User.is_demo.is_(True))).all()

    for workflow in workflows:
        db.delete(workflow)  # ORM cascade -> workflow_runs
    for user in users:
        # ORM cascade -> customer -> tickets -> messages/analyses
        db.delete(user)
    db.commit()
    return {"users": len(users), "workflows": len(workflows)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Seed or remove demo data (is_demo rows only)"
    )
    parser.add_argument(
        "--remove",
        action="store_true",
        help="delete demo data (never touches non-demo rows)",
    )
    args = parser.parse_args(argv)

    try:
        session = get_session_factory()()
    except ConfigurationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    try:
        if args.remove:
            removed = remove_demo(session)
            if removed["users"] == 0 and removed["workflows"] == 0:
                print("Nothing to remove — no demo data found.")
            else:
                print(
                    f"Demo data removed: {removed['users']} users, "
                    f"{removed['workflows']} workflows "
                    "(owned tickets/messages/analyses/runs cascaded with them)."
                )
            return 0
        summary = seed(session)
    except SeedError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    finally:
        session.close()

    print("Demo data seeded.")
    print(f"  users:     {summary['users']} (1 admin, 4 customers)")
    print(f"  tickets:   {summary['tickets']} with {summary['analyses']} AI analyses")
    print(
        f"  workflows: {summary['workflows']} (success + skipped + one paused "
        "workflow showing a recorded failure)"
    )
    print(f"  runs:      {summary['runs']}")
    print(f"Demo admin login: {_DEMO_ADMIN_EMAIL} / {DEMO_PASSWORD}")
    print("Remove everything with: python -m app.cli.seed_demo --remove")
    return 0


if __name__ == "__main__":
    sys.exit(main())
