"""Application CRUD and trace-key lookup."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.application_endpoint import ApplicationEndpoint
from app.schemas.application import ApplicationCreate, ApplicationEndpointCreate, ApplicationEndpointUpdate
from app.utils.providers import normalize_provider
from app.utils.trace_keys import generate_trace_key

DEFAULT_UPSTREAM_URLS: dict[str, str] = {
    "openai": "https://api.openai.com/v1",
    "anthropic": "https://api.anthropic.com/v1",
    "google": "https://generativelanguage.googleapis.com/v1beta",
    "gemini": "https://generativelanguage.googleapis.com/v1beta",
    "deepseek": "https://api.deepseek.com/v1",
}


def resolve_upstream_base_url(provider: str, upstream_base_url: str | None) -> str:
    """Use explicit URL or fall back to provider default."""
    if upstream_base_url:
        return upstream_base_url.rstrip("/")
    if provider == "custom":
        return ""
    key = normalize_provider(provider)
    if key == "google":
        return DEFAULT_UPSTREAM_URLS["google"]
    return DEFAULT_UPSTREAM_URLS.get(provider.lower(), DEFAULT_UPSTREAM_URLS["openai"])


async def create_application(db: AsyncSession, payload: ApplicationCreate) -> Application:
    """Create an application with a generated trace key."""
    application = Application(
        application_name=payload.application_name,
        provider=payload.provider or "custom",
        default_model=payload.default_model,
        trace_key=generate_trace_key(),
        upstream_base_url=resolve_upstream_base_url(payload.provider or "custom", payload.upstream_base_url),
        base_url=payload.base_url,
        description=payload.description,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


async def list_applications(db: AsyncSession) -> list[Application]:
    """Return all applications ordered by creation time."""
    result = await db.execute(
        select(Application).options(selectinload(Application.endpoints)).order_by(Application.created_at.desc())
    )
    return list(result.scalars().all())


async def get_application(db: AsyncSession, application_id: uuid.UUID) -> Application | None:
    """Fetch a single application by primary key."""
    result = await db.execute(
        select(Application).options(selectinload(Application.endpoints)).where(Application.id == application_id)
    )
    return result.scalar_one_or_none()


async def get_application_by_trace_key(db: AsyncSession, trace_key: str) -> Application | None:
    """Resolve an application from the x-trace-key header value."""
    result = await db.execute(
        select(Application).options(selectinload(Application.endpoints)).where(Application.trace_key == trace_key)
    )
    return result.scalar_one_or_none()


async def create_endpoint(db: AsyncSession, application_id: uuid.UUID, payload: ApplicationEndpointCreate) -> ApplicationEndpoint:
    """Create a new endpoint for an application."""
    endpoint = ApplicationEndpoint(
        application_id=application_id,
        endpoint_name=payload.endpoint_name,
        endpoint_path=payload.endpoint_path,
        request_method=payload.request_method,
        feature=payload.feature,
        description=payload.description,
    )
    db.add(endpoint)
    await db.commit()
    await db.refresh(endpoint)
    return endpoint


async def update_endpoint(db: AsyncSession, endpoint: ApplicationEndpoint, payload: ApplicationEndpointUpdate) -> ApplicationEndpoint:
    """Update an existing endpoint."""
    if payload.endpoint_name is not None:
        endpoint.endpoint_name = payload.endpoint_name
    if payload.endpoint_path is not None:
        endpoint.endpoint_path = payload.endpoint_path
    if payload.request_method is not None:
        endpoint.request_method = payload.request_method
    if payload.feature is not None:
        endpoint.feature = payload.feature
    if payload.description is not None:
        endpoint.description = payload.description
    
    await db.commit()
    await db.refresh(endpoint)
    return endpoint


async def delete_endpoint(db: AsyncSession, endpoint: ApplicationEndpoint) -> None:
    """Delete an application endpoint."""
    await db.delete(endpoint)
    await db.commit()

