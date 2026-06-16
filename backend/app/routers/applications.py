"""Application management endpoints (single-user — no auth)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db_session
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationEndpointCreate, ApplicationEndpointResponse, ApplicationEndpointUpdate
from app.models.application_endpoint import ApplicationEndpoint
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])

DbSession = Annotated[AsyncSession, Depends(get_db_session)]


def _to_response(application) -> ApplicationResponse:
    endpoints_list = []
    if 'endpoints' in application.__dict__:
        endpoints_list = [ApplicationEndpointResponse.model_validate(ep) for ep in application.endpoints]

    return ApplicationResponse(
        id=application.id,
        application_name=application.application_name,
        provider=application.provider,
        default_model=application.default_model,
        upstream_base_url=application.upstream_base_url,
        base_url=application.base_url,
        description=application.description,
        trace_key=application.trace_key,
        created_at=application.created_at,
        proxy_url="/proxy/v1",
        endpoints=endpoints_list
    )


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(payload: ApplicationCreate, db: DbSession) -> ApplicationResponse:
    """Register a new instrumented application and receive a trace key."""
    application = await application_service.create_application(db, payload)
    return _to_response(application)


@router.get("", response_model=list[ApplicationResponse])
async def list_applications(db: DbSession) -> list[ApplicationResponse]:
    """List all registered applications."""
    applications = await application_service.list_applications(db)
    return [_to_response(app) for app in applications]


from app.schemas.analytics import ApplicationMetricsResponse
from app.services import analytics_service

@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(application_id: uuid.UUID, db: DbSession) -> ApplicationResponse:
    """Get a single application by ID."""
    application = await application_service.get_application(db, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return _to_response(application)


@router.get("/{application_id}/overview", response_model=ApplicationMetricsResponse)
async def get_application_overview(application_id: uuid.UUID, db: DbSession) -> ApplicationMetricsResponse:
    """Get high-level metrics for an application (alias for dashboard)."""
    data = await analytics_service.get_application_metrics(db, application_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationMetricsResponse(**data)


@router.post("/{application_id}/endpoints", response_model=ApplicationEndpointResponse, status_code=201)
async def create_endpoint(application_id: uuid.UUID, payload: ApplicationEndpointCreate, db: DbSession) -> ApplicationEndpointResponse:
    """Add a tracked endpoint to an application."""
    application = await application_service.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    endpoint = await application_service.create_endpoint(db, application_id, payload)
    return ApplicationEndpointResponse.model_validate(endpoint)


@router.get("/{application_id}/endpoints", response_model=list[ApplicationEndpointResponse])
async def list_endpoints(application_id: uuid.UUID, db: DbSession) -> list[ApplicationEndpointResponse]:
    """List all endpoints for an application."""
    application = await application_service.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return [ApplicationEndpointResponse.model_validate(ep) for ep in getattr(application, 'endpoints', [])]


@router.put("/{application_id}/endpoints/{endpoint_id}", response_model=ApplicationEndpointResponse)
async def update_endpoint(application_id: uuid.UUID, endpoint_id: uuid.UUID, payload: ApplicationEndpointUpdate, db: DbSession) -> ApplicationEndpointResponse:
    """Update an existing endpoint."""
    result = await db.execute(select(ApplicationEndpoint).where(ApplicationEndpoint.id == endpoint_id, ApplicationEndpoint.application_id == application_id))
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    updated = await application_service.update_endpoint(db, endpoint, payload)
    return ApplicationEndpointResponse.model_validate(updated)


@router.delete("/{application_id}/endpoints/{endpoint_id}", status_code=204)
async def delete_endpoint(application_id: uuid.UUID, endpoint_id: uuid.UUID, db: DbSession):
    """Delete an endpoint."""
    result = await db.execute(select(ApplicationEndpoint).where(ApplicationEndpoint.id == endpoint_id, ApplicationEndpoint.application_id == application_id))
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    await application_service.delete_endpoint(db, endpoint)
    return Response(status_code=204)
