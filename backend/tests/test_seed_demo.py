"""M6 demo seed: deterministic full coverage, duplicate refusal, flag-only
removal (real data must survive `--remove`), and CLI exit codes.

The seed drives the REAL pipeline (analysis service + workflow engine) with
the provider forced to `mock`, so expected categories/priorities/sentiments
are exactly what `app/ai/mock.py` rules produce.
"""

import pytest
from sqlalchemy import func, select

from app.cli.seed_demo import SeedError, main, remove_demo, seed
from app.core.security import hash_password
from app.models.ai_analysis import AIAnalysis
from app.models.enums import (
    AnalysisStatus,
    MessageSender,
    RunStatus,
    Sentiment,
    TicketPriority,
    TicketStatus,
    UserRole,
)
from app.models.ticket import Ticket, TicketMessage
from app.models.user import Customer, User
from app.models.workflow import Workflow, WorkflowRun

ALL_CATEGORIES = {
    "billing",
    "delivery",
    "account",
    "technical_support",
    "product_question",
    "general",
}


def test_seed_creates_full_coverage_dataset_and_refuses_duplicates(db_session):
    summary = seed(db_session)

    # Roots: 1 demo admin + 4 demo customers, all flagged.
    users = db_session.scalars(select(User).where(User.is_demo.is_(True))).all()
    assert len(users) == 5
    assert sum(u.role == UserRole.ADMIN for u in users) == 1

    # Tickets: every category/priority/status, >=5 distinct UTC days (chart).
    tickets = db_session.scalars(select(Ticket)).all()
    assert len(tickets) == 12
    assert {t.category for t in tickets} == ALL_CATEGORIES
    assert {t.priority for t in tickets} == set(TicketPriority)
    assert {t.status for t in tickets} == set(TicketStatus)
    assert len({t.created_at.date() for t in tickets}) >= 5

    # Analyses: completed via the real service, deterministic mock provider.
    analyses = db_session.scalars(select(AIAnalysis)).all()
    assert len(analyses) == 12
    assert {a.status for a in analyses} == {AnalysisStatus.COMPLETED}
    assert {a.provider for a in analyses} == {"mock"}
    assert {a.sentiment for a in analyses} == set(Sentiment)

    # Workflows: 2 active + 1 paused demo of a recorded failure.
    workflows = db_session.scalars(select(Workflow)).all()
    assert len(workflows) == 3
    assert all(w.is_demo for w in workflows)
    assert sum(bool(w.is_active) for w in workflows) == 2

    # Runs: all three states exist; the broken workflow has exactly one failed run.
    runs = db_session.scalars(select(WorkflowRun)).all()
    assert {r.status for r in runs} == {
        RunStatus.SUCCESS,
        RunStatus.SKIPPED,
        RunStatus.FAILED,
    }
    broken = next(w for w in workflows if not w.is_active)
    broken_runs = [r for r in runs if r.workflow_id == broken.id]
    assert len(broken_runs) == 1
    assert broken_runs[0].status == RunStatus.FAILED

    # Workflow effects landed: billing tickets tagged + a system notification each.
    billing = [t for t in tickets if t.category == "billing"]
    assert len(billing) == 2
    assert all("billing-review" in (t.tags or []) for t in billing)
    assert all(not (t.tags or []) for t in tickets if t.category != "billing")
    system_messages = db_session.scalars(
        select(TicketMessage).where(TicketMessage.sender == MessageSender.SYSTEM)
    ).all()
    assert len(system_messages) == len(billing)

    # Returned summary agrees with the database.
    assert summary["users"] == 5
    assert summary["tickets"] == 12
    assert summary["analyses"] == 12
    assert summary["workflows"] == 3
    assert summary["runs"] == len(runs)
    assert len(runs) >= 25

    # Duplicate seeding is refused before writing anything.
    with pytest.raises(SeedError, match="--remove"):
        seed(db_session)
    still_five = db_session.scalar(
        select(func.count(User.id)).where(User.is_demo.is_(True))
    )
    assert still_five == 5


def test_remove_deletes_only_demo_rows(db_session):
    # Real (non-demo) data created BEFORE the seed — must survive removal.
    real_user = User(
        email="real@example.com",
        hashed_password=hash_password("RealPass123!"),
        full_name="Real User",
        role=UserRole.CUSTOMER,
    )
    real_customer = Customer(user=real_user)
    db_session.add_all([real_user, real_customer])
    db_session.flush()
    db_session.add(
        Ticket(
            customer_id=real_customer.id,
            subject="Real ticket",
            description="must survive demo removal",
        )
    )
    db_session.add(
        Workflow(
            name="Real workflow",
            trigger="ticket.created",
            conditions=[{"field": "category", "value": "billing"}],
            actions=[{"type": "add_tag", "value": "keep"}],
        )
    )
    db_session.commit()

    seed(db_session)

    removed = remove_demo(db_session)
    assert removed == {"users": 5, "workflows": 3}

    # Non-demo data untouched.
    assert db_session.scalar(select(func.count(User.id))) == 1
    assert db_session.scalar(select(func.count(Ticket.id))) == 1
    assert db_session.scalar(select(func.count(Workflow.id))) == 1
    assert db_session.get(User, real_user.id).email == "real@example.com"

    # No demo roots remain anywhere.
    assert (
        db_session.scalar(
            select(func.count(User.id)).where(User.is_demo.is_(True))
        )
        == 0
    )
    assert (
        db_session.scalar(
            select(func.count(Workflow.id)).where(Workflow.is_demo.is_(True))
        )
        == 0
    )

    # Idempotent.
    assert remove_demo(db_session) == {"users": 0, "workflows": 0}


def test_main_cli_exit_codes(db_session, capsys):
    assert main([]) == 0
    assert "Demo data seeded" in capsys.readouterr().out

    assert main([]) == 1  # duplicate refused
    assert "--remove" in capsys.readouterr().err

    assert main(["--remove"]) == 0
    assert "removed" in capsys.readouterr().out.lower()

    assert main(["--remove"]) == 0  # idempotent
    assert "Nothing to remove" in capsys.readouterr().out
