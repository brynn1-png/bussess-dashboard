"""Local Ollama provider (decision D2, resolved 2026-09-28).

Talks to the Ollama HTTP API (`POST /api/chat`) with `format: "json"` so the
model is constrained to JSON output. The provider returns the parsed RAW dict;
validation against `AnalysisResult` still happens in the analysis service, so
any malformed answer becomes a persisted `failed` status — never bad data.

Transport/HTTP/format errors RAISE on purpose (same contract as the mock's
callers expect): the analysis service catches provider exceptions and records
`failed` with a sanitized message; ticket creation is never affected.
"""

import json
from typing import Any

import httpx

from app.core.config import settings

# Structured-output contract: exact keys + allowed enum values, so the model
# cannot invent categories or priorities (bad enum → Pydantic rejection → failed).
_PROMPT_TEMPLATE = """You are a customer support triage assistant. Analyze the \
support ticket below and respond with ONLY a single JSON object — no markdown, \
no code fences, no prose — containing exactly these keys:

- "category": one of "billing", "delivery", "account", "technical_support", \
"product_question", "general"
- "priority": one of "low", "medium", "high", "urgent"
- "sentiment": one of "positive", "neutral", "negative"
- "summary": 1-3 sentence restatement of the issue (at most 400 characters)
- "suggested_response": a polite, helpful first reply to the customer \
(at most 800 characters)

Ticket subject: {subject}
Ticket description: {description}"""


class OllamaError(Exception):
    """Raised on any Ollama transport, HTTP, or output-shape failure."""


class OllamaProvider:
    """Runs analysis on a local (or hosted Ollama-compatible) model."""

    name = "ollama"

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.model = model or settings.ollama_model
        # Empty means plain local Ollama (no auth); set only for hosted endpoints.
        self.api_key = api_key if api_key is not None else settings.ollama_api_key
        self.timeout = timeout if timeout is not None else settings.ollama_timeout_seconds

    def analyze(self, subject: str, description: str) -> dict[str, Any]:
        """Return raw analysis output; raises `OllamaError`/`httpx` errors on failure."""
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": _PROMPT_TEMPLATE.format(
                        subject=subject, description=description
                    ),
                }
            ],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0},
        }
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

        try:
            response = httpx.post(
                f"{self.base_url}/api/chat",
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()
        except httpx.HTTPError as exc:
            # Connect refused / timeout / 5xx — sanitized upstream by the service.
            raise OllamaError(f"Ollama request to {self.base_url} failed: {exc}") from exc
        except ValueError as exc:  # non-JSON HTTP body
            raise OllamaError("Ollama returned a non-JSON HTTP response") from exc

        try:
            content = body["message"]["content"]
        except (KeyError, TypeError) as exc:
            raise OllamaError("Ollama response is missing message.content") from exc

        try:
            parsed = json.loads(content)
        except (json.JSONDecodeError, TypeError) as exc:
            raise OllamaError("Ollama output was not valid JSON") from exc
        if not isinstance(parsed, dict):
            raise OllamaError(
                f"Ollama output must be a JSON object, got {type(parsed).__name__}"
            )
        return parsed
