"""AI provider abstraction: one interface, swappable engines (decision D2).

The provider returns RAW output (`dict`) on purpose — validation happens in
the analysis service against `AnalysisResult`, so a hallucinating provider
results in a persisted `failed` status, never partially-stored data.
"""

from typing import Any, Protocol, runtime_checkable


class UnknownProviderError(Exception):
    """Raised when `AI_PROVIDER` names an engine that does not exist."""


@runtime_checkable
class AIProvider(Protocol):
    """Engine that turns ticket text into raw analysis output."""

    name: str

    def analyze(self, subject: str, description: str) -> dict[str, Any]:
        """Return raw analysis output; may raise on provider/transport errors."""
        ...


def get_provider(name: str) -> AIProvider:
    """Factory for the configured engine (settings.ai_provider)."""
    if name == "mock":
        from app.ai.mock import MockProvider

        return MockProvider()
    if name == "ollama":
        from app.ai.ollama import OllamaProvider

        return OllamaProvider()
    raise UnknownProviderError(
        f"Unknown AI provider {name!r} — set AI_PROVIDER in .env "
        "(available: mock, ollama)"
    )
