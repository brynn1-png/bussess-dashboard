"""Admin endpoints. EVERY route requires `require_admin` — customers get 403,
anonymous gets 401 (both enforced per-route by the authz test matrix)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database.session import get_db
from app.models.enums import TicketStatus
from app.models.user import User
from app.schemas.admin import (
    AdminTicketDetail,
    AdminTicketSummary,
    AnalysisResponse,
    CustomerRow,
    OverviewResponse,
    UpdateAnalysisRequest,
    UpdateTicketRequest,
)
from app.schemas.workflow import AnalyticsResponse
from app.services import admin_service, workflow_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _map_error(exc: Exception) -> HTTPException:
    if isinstance(exc, admin_service.NotFoundError):
        return HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Not found")
    return HTTPException(
        status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error"
    )


def _require_fields(payload: UpdateTicketRequest | UpdateAnalysisRequest) -> None:
    if not payload.model_fields_set:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No fields to update",
        )


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(
    days: int = Query(default=30, ge=1, le=90),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AnalyticsResponse:
    """Windowed aggregates (M5). `days` outside 1..90 is a 422."""
    return AnalyticsResponse.model_validate(workflow_service.analytics(db, days))


@router.get("/overview", response_model=OverviewResponse)
def overview(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OverviewResponse:
    return OverviewResponse.model_validate(admin_service.overview(db))


@router.get("/tickets", response_model=list[AdminTicketSummary])
def list_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminTicketSummary]:
    rows = admin_service.list_tickets(db, status_filter)
    return [AdminTicketSummary.model_validate(row) for row in rows]


@router.get("/tickets/{ticket_id}", response_model=AdminTicketDetail)
def get_ticket(
    ticket_id: int,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminTicketDetail:
    try:
        detail = admin_service.ticket_detail(db, ticket_id)
    except admin_service.NotFoundError as exc:
        raise _map_error(exc)
    return AdminTicketDetail.model_validate(detail)


@router.patch("/tickets/{ticket_id}", response_model=AdminTicketSummary)
def update_ticket(
    ticket_id: int,
    payload: UpdateTicketRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminTicketSummary:
    _require_fields(payload)
    try:
        admin_service.update_ticket(db, ticket_id, payload)
        summary = admin_service.ticket_summary(db, ticket_id)
    except admin_service.NotFoundError as exc:
        raise _map_error(exc)
    return AdminTicketSummary.model_validate(summary)


@router.patch("/tickets/{ticket_id}/analysis", response_model=AnalysisResponse)
def update_analysis(
    ticket_id: int,
    payload: UpdateAnalysisRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    _require_fields(payload)
    try:
        analysis = admin_service.update_analysis(db, ticket_id, payload)
    except admin_service.NotFoundError as exc:
        raise _map_error(exc)
    return AnalysisResponse.model_validate(analysis)


@router.get("/customers", response_model=list[CustomerRow])
def customers(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[CustomerRow]:
    return [CustomerRow.model_validate(row) for row in admin_service.customers(db)]
