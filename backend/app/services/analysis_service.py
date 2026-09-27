"""Orchestrates AI analysis for a ticket.

Guarantee (PLAN M3): this service NEVER raises into a request — ticket
creation can never be affected by AI behavior. Every provider, validation,
or configuration failure ends as a persisted `failed` status with a
sanitized error message; success writes the validated result and copies
category/priority back onto the ticket.
"""

import logging

from sqlalchemy.orm import Session

from app.ai.base import get_provider
from app.ai.schemas import AnalysisResult
from app.core.config import settings
from app.database.session import get_session_factory
from app.models.ai_analysis import AIAnalysis
from app.models.enums import AnalysisStatus
from app.models.ticket import Ticket

logger = logging.getLogger(__name__)

_ERROR_LIMIT = 500


def analyze_ticket(ticket_id: int) -> None:
    """Background-task entry point — opens its own session (the request's
    session is closed by the time background tasks run)."""
    db = get_session_factory()()
    try:
        _run(db, ticket_id)
    except Exception:  # noqa: BLE001 — last resort: log, never propagate
        logger.exception("AI analysis crashed for ticket %s", ticket_id)
    finally:
        db.close()


def _run(db: Session, ticket_id: int) -> None:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        logger.warning("AI analysis skipped: ticket %s no longer exists", ticket_id)
        return

    analysis = ticket.ai_analysis
    if analysis is None:
        analysis = AIAnalysis(ticket_id=ticket.id, status=AnalysisStatus.PENDING)
        db.add(analysis)
    analysis.status = AnalysisStatus.PENDING
    analysis.provider = settings.ai_provider[:50]
    db.commit()  # pending visible while the provider runs

    try:
        provider = get_provider(settings.ai_provider)
        raw = provider.analyze(ticket.subject, ticket.description)
        result = AnalysisResult.model_validate(raw)
    except Exception as exc:  # noqa: BLE001 — AI failures must never escape
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = _safe_error(exc)
        db.commit()
        logger.warning(
            "AI analysis failed for ticket %s via %s: %s",
            ticket_id,
            settings.ai_provider,
            type(exc).__name__,
        )
        return

    analysis.status = AnalysisStatus.COMPLETED
    analysis.category = result.category
    analysis.priority = result.priority
    analysis.sentiment = result.sentiment
    analysis.summary = result.summary
    analysis.suggested_response = result.suggested_response
    analysis.provider = provider.name
    analysis.error_message = None
    # Write-back (model comment): category/priority set by AI analysis / admin review.
    ticket.category = result.category
    ticket.priority = result.priority
    db.commit()


def _safe_error(exc: Exception) -> str:
    """Single-line, truncated error text for the DB — no tracebacks, no keys."""
    text = f"{type(exc).__name__}: {exc}".replace("\n", " ").strip()
    return text[:_ERROR_LIMIT]
