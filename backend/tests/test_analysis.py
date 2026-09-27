"""AI analysis pipeline tests (M3 acceptance criteria).

Covers: automatic trigger + write-back, deterministic mock output, and the
three failure paths that must NEVER touch the ticket (provider crash,
malformed output, bad configuration).
"""

from sqlalchemy import select

from app.ai.mock import MockProvider
from app.core.config import settings
from app.models.ai_analysis import AIAnalysis
from app.models.enums import (
    AnalysisStatus,
    Sentiment,
    TicketPriority,
)
from app.models.ticket import Ticket


def register(client, email, password="securepass123", name="Casey Customer"):
    res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": name},
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def submit(client, token, subject="Printer on fire", message="It is literally on fire right now"):
    return client.post(
        "/api/tickets",
        headers=auth(token),
        json={"subject": subject, "message": message},
    )


def analysis_for(db, ticket_id: int) -> AIAnalysis:
    return db.scalars(
        select(AIAnalysis).where(AIAnalysis.ticket_id == ticket_id)
    ).one()


# --- Happy path ---------------------------------------------------------------


def test_submission_runs_mock_analysis_and_writes_back(client, db_session):
    token = register(client, "ai@example.com")
    res = submit(
        client,
        token,
        subject="Refund for double charge",
        message="I was charged twice this month. Please refund the extra payment.",
    )
    assert res.status_code == 201
    ticket_id = res.json()["id"]

    analysis = analysis_for(db_session, ticket_id)
    assert analysis.status == AnalysisStatus.COMPLETED
    assert analysis.provider == "mock"
    assert analysis.category == "billing"
    assert analysis.sentiment == Sentiment.NEGATIVE  # "refund" keyword
    assert analysis.priority == TicketPriority.HIGH  # negative → high
    assert analysis.summary
    assert analysis.suggested_response
    # AI output stays a suggestion until an admin confirms it (M4).
    assert analysis.is_human_confirmed is False

    # Write-back: ticket itself now carries AI-assigned category/priority.
    ticket = db_session.get(Ticket, ticket_id)
    assert ticket.category == analysis.category
    assert ticket.priority == analysis.priority


def test_mock_provider_is_deterministic():
    provider = MockProvider()
    args = ("Where is my parcel?", "It has not arrived and tracking has not updated.")
    assert provider.analyze(*args) == provider.analyze(*args)

    delivery = provider.analyze(*args)
    assert delivery["category"] == "delivery"
    assert delivery["sentiment"] == "neutral"
    assert delivery["priority"] == "low"

    outage = provider.analyze("Server outage", "The system is down, fix it immediately")
    assert outage["priority"] == "urgent"


# --- Failure isolation (the ticket must survive everything) -------------------


class _BoomProvider:
    name = "boom"

    def analyze(self, subject: str, description: str):
        raise RuntimeError("provider exploded")


class _GarbageProvider:
    name = "garbage"

    def analyze(self, subject: str, description: str):
        # Invalid enum values, overlong category, empty summary — all rejected.
        return {
            "category": "x" * 120,
            "priority": "sky-high",
            "sentiment": "rage",
            "summary": "",
            "suggested_response": "ok",
        }


def test_provider_crash_never_affects_ticket(client, db_session, monkeypatch):
    monkeypatch.setattr(
        "app.services.analysis_service.get_provider", lambda _name: _BoomProvider()
    )
    token = register(client, "boom@example.com")
    res = submit(client, token)
    assert res.status_code == 201  # creation unaffected
    ticket_id = res.json()["id"]

    # Ticket + opening message intact from the customer's perspective.
    detail = client.get(f"/api/tickets/{ticket_id}", headers=auth(token))
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) == 1

    analysis = analysis_for(db_session, ticket_id)
    assert analysis.status == AnalysisStatus.FAILED
    assert analysis.error_message and "provider exploded" in analysis.error_message
    assert analysis.category is None  # nothing partial persisted

    ticket = db_session.get(Ticket, ticket_id)
    assert ticket.category is None and ticket.priority is None  # no write-back


def test_malformed_ai_output_is_rejected(client, db_session, monkeypatch):
    monkeypatch.setattr(
        "app.services.analysis_service.get_provider", lambda _name: _GarbageProvider()
    )
    token = register(client, "garbage@example.com")
    res = submit(client, token, subject="Valid subject here", message="A perfectly valid message body")
    assert res.status_code == 201
    ticket_id = res.json()["id"]

    analysis = analysis_for(db_session, ticket_id)
    assert analysis.status == AnalysisStatus.FAILED  # validation rejected it
    assert analysis.error_message and "validation error" in analysis.error_message.lower()
    assert analysis.category is None
    assert analysis.summary is None
    assert analysis.suggested_response is None


def test_unknown_provider_config_fails_gracefully(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "ai_provider", "not-a-provider")
    token = register(client, "config@example.com")
    res = submit(client, token)
    assert res.status_code == 201
    ticket_id = res.json()["id"]

    analysis = analysis_for(db_session, ticket_id)
    assert analysis.status == AnalysisStatus.FAILED
    assert analysis.error_message and "UnknownProviderError" in analysis.error_message
    assert analysis.provider == "not-a-provider"[:50]
