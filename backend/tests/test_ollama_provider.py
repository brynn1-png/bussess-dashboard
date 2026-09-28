"""Ollama provider (D2 resolved 2026-09-28): transport/output failures raise
`OllamaError` so the analysis service records `failed`; valid output is
returned RAW for the service's Pydantic gate. The live test skips cleanly
when the configured endpoint (local Ollama OR Ollama cloud) is unreachable or
the configured model isn't available there.
"""

import json

import httpx
import pytest

from app.ai.base import get_provider
from app.ai.ollama import OllamaError, OllamaProvider
from app.ai.schemas import AnalysisResult
from app.core.config import settings

_VALID = {
    "category": "billing",
    "priority": "high",
    "sentiment": "negative",
    "summary": "Customer was charged twice.",
    "suggested_response": "We will refund the duplicate charge.",
}


_REQ = httpx.Request("POST", "http://ollama.test/api/chat")


def _chat(content: str) -> httpx.Response:
    return httpx.Response(
        200,
        json={"message": {"role": "assistant", "content": content}},
        request=_REQ,
    )


def test_factory_returns_ollama_provider():
    provider = get_provider("ollama")
    assert isinstance(provider, OllamaProvider)
    assert provider.name == "ollama"


def test_analyze_returns_parsed_json_validated_by_schema(monkeypatch):
    seen: dict = {}

    def fake_post(url: str, **kwargs) -> httpx.Response:
        seen["url"] = url
        seen["payload"] = kwargs["json"]
        return _chat(json.dumps(_VALID))

    monkeypatch.setattr(httpx, "post", fake_post)
    provider = OllamaProvider(base_url="http://ollama.test:11434", model="test-model")

    result = provider.analyze("Duplicate charge", "Charged twice, please refund.")

    assert result == _VALID
    AnalysisResult.model_validate(result)  # the real persistence gate accepts it
    assert seen["url"] == "http://ollama.test:11434/api/chat"
    assert seen["payload"]["format"] == "json"
    assert seen["payload"]["stream"] is False
    assert "Duplicate charge" in seen["payload"]["messages"][0]["content"]


def test_api_key_header_only_when_configured(monkeypatch):
    captured: dict = {}

    def fake_post(url: str, **kwargs) -> httpx.Response:
        captured["headers"] = kwargs["headers"]
        return _chat(json.dumps(_VALID))

    monkeypatch.setattr(httpx, "post", fake_post)

    OllamaProvider(api_key="secret-token").analyze("s", "d")
    assert captured["headers"]["Authorization"] == "Bearer secret-token"

    OllamaProvider(api_key="").analyze("s", "d")
    assert "Authorization" not in captured["headers"]


@pytest.mark.parametrize(
    ("content", "message"),
    [
        ("not json at all", "not valid JSON"),
        ("[1, 2, 3]", "must be a JSON object"),
        ('{"only_one": "field"}', None),  # shape validated by AnalysisResult upstream
    ],
)
def test_bad_model_output_raises(monkeypatch, content, message):
    monkeypatch.setattr(httpx, "post", lambda url, **kwargs: _chat(content))
    if message is None:
        assert OllamaProvider().analyze("s", "d") == {"only_one": "field"}
        return
    with pytest.raises(OllamaError, match=message):
        OllamaProvider().analyze("s", "d")


def test_http_error_raises(monkeypatch):
    monkeypatch.setattr(
        httpx, "post", lambda url, **kwargs: httpx.Response(500, text="boom", request=_REQ)
    )
    with pytest.raises(OllamaError, match="failed"):
        OllamaProvider().analyze("s", "d")


def test_connection_refused_raises(monkeypatch):
    request = httpx.Request("POST", "http://localhost:11434/api/chat")

    def refused(url: str, **kwargs) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    monkeypatch.setattr(httpx, "post", refused)
    with pytest.raises(OllamaError, match="connection refused"):
        OllamaProvider().analyze("s", "d")


def test_non_json_http_body_raises(monkeypatch):
    monkeypatch.setattr(
        httpx,
        "post",
        lambda url, **kwargs: httpx.Response(200, text="<html>oops", request=_REQ),
    )
    with pytest.raises(OllamaError, match="non-JSON HTTP response"):
        OllamaProvider().analyze("s", "d")


def test_missing_message_content_raises(monkeypatch):
    monkeypatch.setattr(
        httpx,
        "post",
        lambda url, **kwargs: httpx.Response(200, json={"foo": 1}, request=_REQ),
    )
    with pytest.raises(OllamaError, match="message.content"):
        OllamaProvider().analyze("s", "d")


def _live_status() -> tuple[bool, str]:
    # Same auth rule as the provider: bearer header only when a key is configured
    # (cloud endpoint, e.g. https://ollama.com); plain local Ollama sends none.
    headers = (
        {"Authorization": f"Bearer {settings.ollama_api_key}"}
        if settings.ollama_api_key
        else {}
    )
    try:
        response = httpx.get(
            f"{settings.ollama_base_url}/api/tags", headers=headers, timeout=5
        )
        response.raise_for_status()
        names = [m["name"] for m in response.json().get("models", [])]
    except Exception:  # noqa: BLE001 — any failure means "not available here"
        return False, f"Ollama endpoint {settings.ollama_base_url} not reachable"
    wanted = settings.ollama_model.split(":")[0]
    if not any(name.split(":")[0] == wanted for name in names):
        return False, f"model {settings.ollama_model} not pulled"
    return True, ""


_LIVE_OK, _LIVE_REASON = _live_status()


@pytest.mark.skipif(not _LIVE_OK, reason=f"live Ollama unavailable: {_LIVE_REASON}")
def test_live_ollama_analysis():
    """One live integration check (PLAN M3/M6) — runs only with Ollama up."""
    raw = OllamaProvider().analyze(
        "Duplicate charge on my invoice",
        "I was charged twice for invoice #4821. Please refund the extra payment.",
    )
    result = AnalysisResult.model_validate(raw)
    assert result.category in {
        "billing",
        "delivery",
        "account",
        "technical_support",
        "product_question",
        "general",
    }
    assert result.priority.value in {"low", "medium", "high", "urgent"}
    assert result.sentiment.value in {"positive", "neutral", "negative"}
