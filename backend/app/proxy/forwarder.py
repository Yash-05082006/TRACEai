"""Forward proxied requests to OpenAI or Google Gemini via httpx."""

from app.utils.providers import normalize_provider
import json
import time
from typing import Any
from urllib.parse import quote

import httpx

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

# Headers forwarded to OpenAI (client Authorization is required).
_OPENAI_REQUEST_HEADERS = frozenset(
    {
        "authorization",
        "content-type",
        "accept",
        "user-agent",
        "openai-organization",
        "openai-project",
        "http-referer",
        "x-title",
    }
)

_OPENAI_RESPONSE_HEADERS = frozenset(
    {
        "content-type",
        "openai-processing-ms",
        "openai-version",
        "x-request-id",
    }
)

_GEMINI_RESPONSE_HEADERS = frozenset({"content-type"})


def _filter_headers(headers: dict[str, str], allowed: frozenset[str]) -> dict[str, str]:
    return {key: value for key, value in headers.items() if key.lower() in allowed}


def _normalize_gemini_model(model: str) -> str:
    """Strip optional models/ prefix from Gemini model ids."""
    if model.startswith("models/"):
        return model[len("models/") :]
    return model


def openai_to_gemini_request(openai_body: dict[str, Any]) -> dict[str, Any]:
    """Translate an OpenAI chat/completions body into Gemini generateContent format."""
    contents: list[dict[str, Any]] = []

    for message in openai_body.get("messages", []):
        role = message.get("role", "user")
        content = message.get("content", "")
        if not isinstance(content, str):
            content = json.dumps(content)

        if role == "system":
            gemini_role = "user"
            text = f"System: {content}"
        elif role == "assistant":
            gemini_role = "model"
            text = content
        else:
            gemini_role = "user"
            text = content

        contents.append({"role": gemini_role, "parts": [{"text": text}]})

    if not contents:
        contents = [{"role": "user", "parts": [{"text": ""}]}]

    return {"contents": contents}


async def _forward_openai(
    *,
    upstream_base_url: str,
    body: bytes,
    request_headers: dict[str, str],
    timeout: float,
) -> tuple[int, bytes, dict[str, str], int]:
    base = upstream_base_url.rstrip("/")
    url = f"{base}/chat/completions"

    outbound_headers = _filter_headers(request_headers, _OPENAI_REQUEST_HEADERS)
    if "content-type" not in {k.lower() for k in outbound_headers}:
        outbound_headers["content-type"] = "application/json"

    started = time.perf_counter()
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, content=body, headers=outbound_headers)
    latency_ms = int((time.perf_counter() - started) * 1000)

    response_headers = _filter_headers(dict(response.headers), _OPENAI_RESPONSE_HEADERS)
    return response.status_code, response.content, response_headers, latency_ms


async def _forward_gemini(
    *,
    body: bytes,
    gemini_api_key: str,
    timeout: float,
) -> tuple[int, bytes, dict[str, str], int]:
    openai_payload = json.loads(body)
    model = _normalize_gemini_model(openai_payload.get("model", "gemini-2.5-pro"))
    gemini_payload = openai_to_gemini_request(openai_payload)

    url = (
        f"{GEMINI_BASE_URL}/models/{quote(model, safe='')}:generateContent"
        f"?key={quote(gemini_api_key, safe='')}"
    )

    started = time.perf_counter()
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            url,
            json=gemini_payload,
            headers={"content-type": "application/json"},
        )
    latency_ms = int((time.perf_counter() - started) * 1000)

    response_headers = _filter_headers(dict(response.headers), _GEMINI_RESPONSE_HEADERS)
    return response.status_code, response.content, response_headers, latency_ms


async def forward_chat_completion(
    *,
    provider: str,
    body: bytes,
    request_headers: dict[str, str],
    gemini_api_key: str | None = None,
    upstream_base_url: str | None = None,
    timeout: float = 120.0,
) -> tuple[int, bytes, dict[str, str], int]:
    """Route a chat completion to the correct upstream provider."""
    normalized = normalize_provider(provider)

    if normalized == "google":
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured on the server")
        return await _forward_gemini(body=body, gemini_api_key=gemini_api_key, timeout=timeout)

    if normalized in {"openai", "openrouter", "deepseek"}:
        if normalized == "openrouter":
            base_url = upstream_base_url or "https://openrouter.ai/api/v1"
        elif normalized == "deepseek":
            base_url = upstream_base_url or "https://api.deepseek.com/v1"
        else:
            base_url = upstream_base_url or "https://api.openai.com/v1"

        return await _forward_openai(
            upstream_base_url=base_url,
            body=body,
            request_headers=request_headers,
            timeout=timeout,
        )

    raise ValueError(f"Unsupported provider for proxy: {provider}")
