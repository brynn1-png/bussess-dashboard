"""Deterministic, offline analysis engine (decision D2: mock-first).

Rule-based keyword output for development, tests, and demos — this is NOT
real intelligence. Every persisted row records `provider = "mock"` so mock
results can never be mistaken for a real AI engine's output.
"""

from typing import Any

from app.models.enums import Sentiment, TicketPriority

# Category rules — first match wins, in this order; fallback is "general".
_CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    (
        "billing",
        ("invoice", "charge", "charged", "payment", "refund", "bill", "price", "pricing"),
    ),
    (
        "delivery",
        ("delivery", "delivered", "shipping", "shipped", "parcel", "tracking", "arrived", "courier"),
    ),
    (
        "account",
        ("login", "log in", "password", "account", "locked", "sign in", "cannot access", "can't access"),
    ),
    (
        "technical_support",
        ("error", "bug", "crash", "broken", "not working", "doesn't work", "slow", "failing", "fault"),
    ),
    (
        "product_question",
        ("how do i", "how to", "what is", "does it", "compatible", "works with", "support for"),
    ),
]

# Sentiment: negative checked first (e.g. "refund" is both negative and billing).
_NEGATIVE_KEYWORDS = (
    "angry", "furious", "terrible", "awful", "horrible", "refund", "frustrated",
    "frustration", "hate", "worst", "useless", "disappointed", "still waiting", "no response",
)
_POSITIVE_KEYWORDS = ("thanks", "thank you", "great", "excellent", "love", "appreciate", "awesome", "perfect")

_URGENT_KEYWORDS = (
    "urgent", "asap", "immediately", "right away", "critical", "outage",
    "emergency", "down", "on fire",
)

_SUGGESTED_RESPONSES: dict[str, str] = {
    "billing": (
        "Thanks for reaching out about a billing matter. We are reviewing the "
        "charges on your account and will follow up within one business day "
        "with a full explanation."
    ),
    "delivery": (
        "Thanks for letting us know about your delivery. We are checking the "
        "tracking details with our courier and will update you as soon as we "
        "have news."
    ),
    "account": (
        "Thanks for contacting support about your account. We will verify a "
        "few details and help you regain access securely."
    ),
    "technical_support": (
        "Thanks for the detailed report. Our team is investigating the issue "
        "and will get back to you with next steps or a fix."
    ),
    "product_question": (
        "Thanks for your question! Here is what we know — if you need more "
        "detail, reply to this ticket and we will be happy to help."
    ),
    "general": (
        "Thanks for reaching out. Our team has received your request and will "
        "follow up shortly with an update."
    ),
}


class MockProvider:
    """Keyword-rule engine: same input always produces the same output."""

    name = "mock"

    def analyze(self, subject: str, description: str) -> dict[str, Any]:
        text = f"{subject}\n{description}".lower()

        category = self._category(text)
        sentiment = self._sentiment(text)
        priority = self._priority(text, sentiment, category)

        return {
            "category": category,
            "priority": priority.value,
            "sentiment": sentiment.value,
            "summary": self._summary(subject, description),
            "suggested_response": _SUGGESTED_RESPONSES[category],
        }

    @staticmethod
    def _category(text: str) -> str:
        for category, keywords in _CATEGORY_KEYWORDS:
            if any(keyword in text for keyword in keywords):
                return category
        return "general"

    @staticmethod
    def _sentiment(text: str) -> Sentiment:
        if any(keyword in text for keyword in _NEGATIVE_KEYWORDS):
            return Sentiment.NEGATIVE
        if any(keyword in text for keyword in _POSITIVE_KEYWORDS):
            return Sentiment.POSITIVE
        return Sentiment.NEUTRAL

    @staticmethod
    def _priority(text: str, sentiment: Sentiment, category: str) -> TicketPriority:
        if any(keyword in text for keyword in _URGENT_KEYWORDS):
            return TicketPriority.URGENT
        if sentiment is Sentiment.NEGATIVE:
            return TicketPriority.HIGH
        if category in ("technical_support", "account"):
            return TicketPriority.MEDIUM
        return TicketPriority.LOW

    @staticmethod
    def _summary(subject: str, description: str) -> str:
        snippet = description.strip()
        if len(snippet) > 150:
            snippet = snippet[:150].rstrip() + "…"
        return f"Customer reports: {subject.strip()}. {snippet}"
