"""Ticket request/response schemas (backend is the authoritative validator)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TicketPriority, TicketStatus


class CreateTicketRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=10000)


class AddMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    sender: str
    content: str
    created_at: datetime


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    status: TicketStatus
    category: str | None
    priority: TicketPriority | None
    created_at: datetime
    updated_at: datetime


class TicketDetailResponse(TicketResponse):
    messages: list[MessageResponse] = []
