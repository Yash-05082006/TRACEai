"""Pydantic schemas for analytics API responses."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OverviewResponse(BaseModel):
    total_requests: int
    total_tokens: int
    total_cost: float
    avg_latency: float
    error_rate: float
    range: str = "24h"


class TrendPoint(BaseModel):
    timestamp: datetime
    cost: float | None = None
    tokens: int | None = None
    requests: int | None = None
    avg_latency_ms: float | None = None
    p95_latency_ms: float | None = None


class ProviderStats(BaseModel):
    provider: str
    cost: float
    requests: int
    tokens: int
    pct: float | None = None


class RequestLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_name: str | None = None
    model: str
    provider: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    latency_ms: int
    status: int
    feature: str | None = None
    endpoint: str | None = None
    prompt_preview: str | None = None
    completion_preview: str | None = None
    created_at: datetime


class RequestLogPage(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[RequestLogItem]


class EndpointStats(BaseModel):
    endpoint: str
    cost: float
    requests: int
    tokens: int
    avg_latency_ms: float
    error_rate: float
    pct: float | None = None


class FeatureStats(BaseModel):
    feature: str
    cost: float
    requests: int
    tokens: int


class ApplicationMetricsResponse(BaseModel):
    application_id: UUID
    application_name: str | None = None
    total_requests: int
    total_tokens: int
    total_cost: float
    avg_latency: float
    error_rate: float
    range: str = "30d"
    top_endpoints: list[EndpointStats] = []
