"""OpenAI-compatible LLM proxy with telemetry capture (OpenAI + Gemini)."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.utils.providers import normalize_provider

from app.database import get_db_session
from app.proxy.capture import extract_telemetry
from app.proxy.forwarder import forward_chat_completion
from app.services.application_service import get_application_by_trace_key
from app.services.telemetry_service import store_llm_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/proxy/v1", tags=["proxy"])

DbSession = Annotated[AsyncSession, Depends(get_db_session)]

CHAT_COMPLETIONS_ENDPOINT = "/proxy/v1/chat/completions"


@router.post("/chat/completions")
async def proxy_chat_completions(
    request: Request,
    db: DbSession,
    x_trace_key: Annotated[str | None, Header(alias="x-trace-key")] = None,
    x_trace_endpoint: Annotated[str | None, Header(alias="x-trace-endpoint")] = None,
    x_trace_feature: Annotated[str | None, Header(alias="x-trace-feature")] = None,
    x_trace_user: Annotated[str | None, Header(alias="x-trace-user")] = None,
) -> Response:
    """Forward chat completion requests to OpenAI or Gemini and capture telemetry."""
    if not x_trace_key:
        raise HTTPException(status_code=400, detail="Missing x-trace-key header")

    application = await get_application_by_trace_key(db, x_trace_key)
    if application is None:
        raise HTTPException(status_code=400, detail="Invalid x-trace-key — application not found")

    provider = normalize_provider(application.provider)
    openai_compatible = {"openai", "openrouter", "deepseek"}

    if provider in openai_compatible and not request.headers.get("authorization"):
        raise HTTPException(
            status_code=400,
            detail=f"Missing Authorization header — {provider.title()} API key required",
        )

    if provider == "google" and not settings.gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the server — add it to backend/.env and restart",
        )

    if provider not in openai_compatible and provider != "google":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider '{application.provider}'. Supported: openai, google, openrouter, deepseek",
        )

    body = await request.body()

    try:
        status_code, response_body, response_headers, latency_ms = await forward_chat_completion(
            provider=provider,
            body=body,
            request_headers=dict(request.headers),
            gemini_api_key=settings.gemini_api_key,
            upstream_base_url=application.upstream_base_url,
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Upstream forward failed for application %s", application.id)
        raise HTTPException(status_code=502, detail=f"Upstream provider error: {exc}") from exc

    telemetry = extract_telemetry(
        provider=provider,
        request_body=body,
        response_body=response_body,
        status_code=status_code,
        latency_ms=latency_ms,
    )

    try:
        await store_llm_request(
            db,
            application_id=application.id,
            endpoint=x_trace_endpoint or CHAT_COMPLETIONS_ENDPOINT,
            telemetry=telemetry,
            feature=x_trace_feature,
            user_ref=x_trace_user,
        )
    except Exception:
        logger.exception("Failed to persist telemetry for application %s", application.id)

    return Response(
        content=response_body,
        status_code=status_code,
        headers=response_headers,
        media_type=response_headers.get("content-type", "application/json"),
    )
