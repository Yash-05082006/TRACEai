"""Pydantic schemas for application endpoints (Phase 2+)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApplicationBase(BaseModel):
    application_name: str = Field(..., max_length=255)
    provider: str = Field(..., max_length=64)
    default_model: str | None = Field(default=None, max_length=128)
    upstream_base_url: str | None = None


class ApplicationEndpointBase(BaseModel):
    endpoint_name: str
    endpoint_path: str
    request_method: str = "POST"
    feature: str | None = None
    description: str | None = None


class ApplicationEndpointCreate(ApplicationEndpointBase):
    pass


class ApplicationEndpointUpdate(BaseModel):
    endpoint_name: str | None = None
    endpoint_path: str | None = None
    request_method: str | None = None
    feature: str | None = None
    description: str | None = None


class ApplicationEndpointResponse(ApplicationEndpointBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    created_at: datetime


class ApplicationCreate(BaseModel):
    application_name: str
    provider: str | None = "custom"
    default_model: str | None = None
    upstream_base_url: str | None = None
    base_url: str | None = None
    description: str | None = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_name: str
    provider: str
    default_model: str | None
    upstream_base_url: str | None
    base_url: str | None = None
    description: str | None = None
    trace_key: str
    proxy_url: str
    created_at: datetime
    endpoints: list[ApplicationEndpointResponse] = []
