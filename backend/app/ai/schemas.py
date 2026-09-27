"""Validated AI output — the only shape allowed to be persisted.

Field limits mirror the database (e.g. `category` is String(50) on tickets
and ai_analysis) so an overlong AI answer can never cause a DB error.
"""

from pydantic import BaseModel, Field

from app.models.enums import Sentiment, TicketPriority


class AnalysisResult(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    priority: TicketPriority
    sentiment: Sentiment
    summary: str = Field(min_length=1, max_length=5000)
    suggested_response: str = Field(min_length=1, max_length=10000)
