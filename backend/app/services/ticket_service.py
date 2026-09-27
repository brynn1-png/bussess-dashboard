"""Ticket use cases. Ownership and customer scoping are enforced HERE (server-side).

Business rules (.ai/context.md §4/§7):
- Every ticket belongs to exactly one customer.
- A customer can only ever see/modify their OWN tickets (others' tickets are
  invisible → 404, so existence is not leaked).
- Status transitions are reserved for administrators (M4); customers may not
  change status in M2.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import MessageSender, TicketStatus, UserRole
from app.models.ticket import Ticket, TicketMessage
from app.models.user import Customer, User


class NotCustomerError(Exception):
    """Raised when a non-customer (e.g. admin) tries to use customer features."""


class TicketNotFoundError(Exception):
    """Raised for missing tickets OR other customers' tickets (no existence leak)."""


def _customer_of(user: User) -> Customer:
    if user.role != UserRole.CUSTOMER or user.customer is None:
        raise NotCustomerError()
    return user.customer


def create_ticket(
    db: Session, user: User, subject: str, message: str
) -> Ticket:
    """Create a ticket + its opening message; status starts as `open`.

    The opening message is also stored as `tickets.description` (NOT NULL) so
    admin views (M4) get the ticket body without loading the thread.
    """
    customer = _customer_of(user)
    ticket = Ticket(
        customer_id=customer.id,
        subject=subject.strip(),
        description=message.strip(),
        status=TicketStatus.OPEN,
    )
    ticket.messages.append(
        TicketMessage(sender=MessageSender.CUSTOMER, content=message.strip())
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def list_tickets(db: Session, user: User) -> list[Ticket]:
    """Newest first, scoped to the caller's customer record only."""
    customer = _customer_of(user)
    result = db.scalars(
        select(Ticket)
        .where(Ticket.customer_id == customer.id)
        .order_by(Ticket.created_at.desc())
    )
    return list(result)


def _owned_ticket(db: Session, user: User, ticket_id: int) -> Ticket:
    """Return the ticket only if it exists AND belongs to the caller, else 404."""
    customer = _customer_of(user)
    ticket = db.get(Ticket, ticket_id)
    if ticket is None or ticket.customer_id != customer.id:
        raise TicketNotFoundError(ticket_id)
    return ticket


def get_ticket(db: Session, user: User, ticket_id: int) -> Ticket:
    return _owned_ticket(db, user, ticket_id)


def add_message(
    db: Session, user: User, ticket_id: int, content: str
) -> TicketMessage:
    """Append a customer follow-up message to an owned ticket."""
    ticket = _owned_ticket(db, user, ticket_id)
    msg = TicketMessage(sender=MessageSender.CUSTOMER, content=content.strip())
    ticket.messages.append(msg)
    db.commit()
    db.refresh(msg)
    return msg
