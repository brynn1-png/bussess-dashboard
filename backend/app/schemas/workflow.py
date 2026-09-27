"""Workflow config + run + analytics schemas (backend is the authoritative
validator — PLAN §5 cap enforced here: one trigger, AND-only conditions,
four action types)."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import Sentiment, TicketPriority, TicketStatus
from app.schemas.admin import StatusCounts

ConditionField = Literal["category", "priority", "sentiment", "status"]
ActionType = Literal[
    "set_priority",
    "add_tag",
    "generate_suggested_response",
    "record_notification",
]

_ENUM_VALUES: dict[str, set[str]] = {
    "priority": {p.value for p in TicketPriority},
    "sentiment": {s.value for s in Sentiment},
    "status": {s.value for s in TicketStatus},
}


class ConditionRequest(BaseModel):
    field: ConditionField
    value: str = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def value_matches_field(self) -> "ConditionRequest":
        allowed = _ENUM_VALUES.get(self.field)
        if allowed is not None and self.value not in allowed:
            raise ValueError(
                f"value for '{self.field}' must be one of: {', '.join(sorted(allowed))}"
            )
        return self


class ActionRequest(BaseModel):
    type: ActionType
    value: str = Field(min_length=1, max_length=1000)

    @model_validator(mode="after")
    def value_matches_type(self) -> "ActionRequest":
        if self.type == "set_priority":
            allowed = ", ".join(p.value for p in TicketPriority)
            if self.value not in {p.value for p in TicketPriority}:
                raise ValueError(f"set_priority value must be one of: {allowed}")
        elif self.type == "add_tag" and len(self.value) > 30:
            raise ValueError("add_tag value must be at most 30 characters")
        elif self.type == "record_notification" and len(self.value) > 200:
            raise ValueError("record_notification value must be at most 200 characters")
        return self


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    # Fixed by the PLAN §5 cap — anything else is a 422.
    trigger: Literal["ticket.created"] = "ticket.created"
    is_active: bool = True
    conditions: list[ConditionRequest] = Field(default_factory=list, max_length=5)
    actions: list[ActionRequest] = Field(min_length=1, max_length=5)


class WorkflowUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None
    conditions: list[ConditionRequest] | None = Field(default=None, max_length=5)
    actions: list[ActionRequest] | None = Field(default=None, min_length=1, max_length=5)


class RunCounts(BaseModel):
    success: int = 0
    failed: int = 0
    skipped: int = 0


class WorkflowResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    trigger: str
    # Raw stored JSON — GET must never choke on legacy/manual rows.
    conditions: list[Any]
    actions: list[Any]
    created_at: datetime
    run_counts: RunCounts


class WorkflowRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    status: str
    details: dict[str, Any] | list[Any] | None
    created_at: datetime


class CategoryCount(BaseModel):
    category: str
    count: int


class DayCount(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class AiAnalytics(BaseModel):
    completed: int = 0
    human_confirmed: int = 0


class AnalyticsResponse(BaseModel):
    days: int
    total_tickets: int  # all time, for the "window of N" comparison card
    by_status: StatusCounts
    by_category: list[CategoryCount]
    by_day: list[DayCount]
    ai: AiAnalytics
