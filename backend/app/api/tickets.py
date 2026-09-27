"""Customer ticket endpoints. Routes stay thin: validate → service → map errors."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.ticket import (
    AddMessageRequest,
    CreateTicketRequest,
    MessageResponse,
    TicketDetailResponse,
    TicketResponse,
)
from app.services import analysis_service, ticket_service

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def _map_service_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ticket_service.TicketNotFoundError):
        # Same response for "does not exist" and "not yours" — no existence leak.
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if isinstance(exc, ticket_service.NotCustomerError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customer accounts can submit tickets",
        )
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


@router.post("", response_model=TicketDetailResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: CreateTicketRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TicketDetailResponse:
    try:
        ticket = ticket_service.create_ticket(db, user, payload.subject, payload.message)
    except ticket_service.NotCustomerError as exc:
        raise _map_service_error(exc)
    # Separate step after creation (PLAN M3): AI runs post-response and can
    # never fail or slow down ticket creation.
    background_tasks.add_task(analysis_service.analyze_ticket, ticket.id)
    return TicketDetailResponse.model_validate(ticket)


@router.get("", response_model=list[TicketResponse])
def list_tickets(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TicketResponse]:
    try:
        tickets = ticket_service.list_tickets(db, user)
    except ticket_service.NotCustomerError as exc:
        raise _map_service_error(exc)
    return [TicketResponse.model_validate(t) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(
    ticket_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TicketDetailResponse:
    try:
        ticket = ticket_service.get_ticket(db, user, ticket_id)
    except (ticket_service.TicketNotFoundError, ticket_service.NotCustomerError) as exc:
        raise _map_service_error(exc)
    return TicketDetailResponse.model_validate(ticket)


@router.post(
    "/{ticket_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_message(
    ticket_id: int,
    payload: AddMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    try:
        message = ticket_service.add_message(db, user, ticket_id, payload.content)
    except (ticket_service.TicketNotFoundError, ticket_service.NotCustomerError) as exc:
        raise _map_service_error(exc)
    return MessageResponse.model_validate(message)
