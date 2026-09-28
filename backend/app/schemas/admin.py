"""Admin request/response schemas (backend is the authoritative validator)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AnalysisStatus, Sentiment, TicketPriority, TicketStatus


class AdminTicketSummary(BaseModel):
    id: int
    subject: str
    status: TicketStatus
    category: str | None
    priority: TicketPriority | None
    customer_name: str
    created_at: datetime
    updated_at: datetime
    # AI review state for the triage queue; None when the ticket has no analysis row.
    analysis_status: AnalysisStatus | None = None
    is_human_confirmed: bool | None = None


class StatusCounts(BaseModel):
    open: int = 0
    in_progress: int = 0
    resolved: int = 0
    closed: int = 0


class PriorityCounts(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    urgent: int = 0
    unassigned: int = 0


class AICounts(BaseModel):
    completed: int = 0
    pending: int = 0
    failed: int = 0
    human_confirmed: int = 0
    awaiting_review: int = 0


class OverviewResponse(BaseModel):
    total_tickets: int
    total_customers: int
    # 1=low … 4=urgent; None when no priority assigned yet (PLAN "avg priority").
    avg_priority: float | None
    statuses: StatusCounts
    priorities: PriorityCounts
    ai: AICounts
    recent_tickets: list[AdminTicketSummary]


class CustomerRef(BaseModel):
    id: int
    full_name: str
    email: str


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: AnalysisStatus
    category: str | None
    priority: TicketPriority | None
    sentiment: Sentiment | None
    summary: str | None
    suggested_response: str | None
    is_human_confirmed: bool
    provider: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class AdminMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    sender: str
    content: str
    created_at: datetime


class AdminTicketDetail(BaseModel):
    id: int
    subject: str
    description: str
    status: TicketStatus
    category: str | None
    priority: TicketPriority | None
    tags: list[str] = []  # workflow "add tag" target; [] on pre-migration rows
    created_at: datetime
    updated_at: datetime
    customer: CustomerRef
    messages: list[AdminMessageResponse]
    analysis: AnalysisResponse | None


class UpdateTicketRequest(BaseModel):
    status: TicketStatus | None = None
    category: str | None = Field(default=None, min_length=1, max_length=50)
    priority: TicketPriority | None = None


class UpdateAnalysisRequest(BaseModel):
    suggested_response: str | None = Field(default=None, min_length=1, max_length=10000)
    is_human_confirmed: bool | None = None


class CustomerRow(BaseModel):
    id: int
    full_name: str
    email: str
    ticket_count: int
    created_at: datetime
