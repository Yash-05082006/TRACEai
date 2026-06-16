"""SQL aggregation queries over llm_requests for dashboard analytics."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import Float, Select, String, and_, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.llm_request import LLMRequest

RangeKey = Literal["1h", "24h", "7d", "30d", "90d"]
BucketKey = Literal["hour", "day"]

RANGE_DELTAS: dict[str, timedelta] = {
    "1h": timedelta(hours=1),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_range(range_key: str) -> tuple[datetime, RangeKey]:
    """Return (since, normalized_range) for a query window."""
    key = range_key if range_key in RANGE_DELTAS else "24h"
    return _utc_now() - RANGE_DELTAS[key], key  # type: ignore[return-value]


def bucket_for_range(range_key: str) -> BucketKey:
    """Choose time bucket granularity based on window length."""
    return "day" if range_key in {"30d", "90d"} else "hour"


def _time_bucket(column, bucket: BucketKey):
    if bucket == "day":
        return func.date_trunc("day", column)
    return func.date_trunc("hour", column)


def _base_filters(since: datetime, application_id: uuid.UUID | None = None):
    clauses = [LLMRequest.created_at >= since]
    if application_id is not None:
        clauses.append(LLMRequest.application_id == application_id)
    return and_(*clauses)


async def get_overview(
    db: AsyncSession,
    *,
    range_key: str = "24h",
    application_id: uuid.UUID | None = None,
) -> dict:
    since, normalized = parse_range(range_key)
    filters = _base_filters(since, application_id)

    stmt = select(
        func.count(LLMRequest.id).label("total_requests"),
        func.coalesce(func.sum(LLMRequest.total_tokens), 0).label("total_tokens"),
        func.coalesce(func.sum(LLMRequest.cost), 0).label("total_cost"),
        func.coalesce(func.avg(LLMRequest.latency_ms), 0).label("avg_latency"),
        func.coalesce(
            cast(
                func.count(LLMRequest.id).filter(LLMRequest.status >= 400),
                Float,
            )
            * 100.0
            / func.nullif(func.count(LLMRequest.id), 0),
            0,
        ).label("error_rate"),
    ).where(filters)

    row = (await db.execute(stmt)).one()
    return {
        "total_requests": int(row.total_requests),
        "total_tokens": int(row.total_tokens),
        "total_cost": float(row.total_cost or 0),
        "avg_latency": round(float(row.avg_latency or 0), 2),
        "error_rate": round(float(row.error_rate or 0), 4),
        "range": normalized,
    }


async def get_cost_trend(
    db: AsyncSession,
    *,
    range_key: str = "24h",
    application_id: uuid.UUID | None = None,
) -> list[dict]:
    since, _ = parse_range(range_key)
    bucket = bucket_for_range(range_key)
    ts = _time_bucket(LLMRequest.created_at, bucket).label("timestamp")

    stmt = (
        select(
            ts,
            func.coalesce(func.sum(LLMRequest.cost), 0).label("cost"),
        )
        .where(_base_filters(since, application_id))
        .group_by(ts)
        .order_by(ts)
    )

    rows = await db.execute(stmt)
    return [
        {"timestamp": row.timestamp, "cost": round(float(row.cost or 0), 6)}
        for row in rows
    ]


async def get_token_trend(
    db: AsyncSession,
    *,
    range_key: str = "24h",
    application_id: uuid.UUID | None = None,
) -> list[dict]:
    since, _ = parse_range(range_key)
    bucket = bucket_for_range(range_key)
    ts = _time_bucket(LLMRequest.created_at, bucket).label("timestamp")

    stmt = (
        select(
            ts,
            func.coalesce(func.sum(LLMRequest.total_tokens), 0).label("tokens"),
        )
        .where(_base_filters(since, application_id))
        .group_by(ts)
        .order_by(ts)
    )

    rows = await db.execute(stmt)
    return [
        {"timestamp": row.timestamp, "tokens": int(row.tokens or 0)}
        for row in rows
    ]


async def get_request_volume_trend(
    db: AsyncSession,
    *,
    range_key: str = "24h",
    application_id: uuid.UUID | None = None,
) -> list[dict]:
    since, _ = parse_range(range_key)
    bucket = bucket_for_range(range_key)
    ts = _time_bucket(LLMRequest.created_at, bucket).label("timestamp")

    stmt = (
        select(ts, func.count(LLMRequest.id).label("requests"))
        .where(_base_filters(since, application_id))
        .group_by(ts)
        .order_by(ts)
    )

    rows = await db.execute(stmt)
    return [
        {"timestamp": row.timestamp, "requests": int(row.requests)}
        for row in rows
    ]


async def get_latency_trend(
    db: AsyncSession,
    *,
    range_key: str = "24h",
    application_id: uuid.UUID | None = None,
) -> list[dict]:
    since, _ = parse_range(range_key)
    bucket = bucket_for_range(range_key)
    ts = _time_bucket(LLMRequest.created_at, bucket).label("timestamp")

    stmt = (
        select(
            ts,
            func.coalesce(func.avg(LLMRequest.latency_ms), 0).label("avg_latency_ms"),
            func.percentile_cont(0.95)
            .within_group(LLMRequest.latency_ms)
            .label("p95_latency_ms"),
        )
        .where(_base_filters(since, application_id))
        .group_by(ts)
        .order_by(ts)
    )

    rows = await db.execute(stmt)
    return [
        {
            "timestamp": row.timestamp,
            "avg_latency_ms": round(float(row.avg_latency_ms or 0), 2),
            "p95_latency_ms": round(float(row.p95_latency_ms or 0), 2),
        }
        for row in rows
    ]


async def get_providers(
    db: AsyncSession,
    *,
    range_key: str = "30d",
    application_id: uuid.UUID | None = None,
    include_pct: bool = False,
) -> list[dict]:
    since, _ = parse_range(range_key)
    filters = _base_filters(since, application_id)

    stmt = (
        select(
            LLMRequest.provider.label("provider"),
            func.coalesce(func.sum(LLMRequest.cost), 0).label("cost"),
            func.count(LLMRequest.id).label("requests"),
            func.coalesce(func.sum(LLMRequest.total_tokens), 0).label("tokens"),
        )
        .where(filters)
        .group_by(LLMRequest.provider)
        .order_by(func.sum(LLMRequest.cost).desc())
    )

    rows = (await db.execute(stmt)).all()
    total_cost = sum(float(r.cost or 0) for r in rows) or 1.0

    results = []
    for row in rows:
        item = {
            "provider": row.provider,
            "cost": round(float(row.cost or 0), 6),
            "requests": int(row.requests),
            "tokens": int(row.tokens or 0),
        }
        if include_pct:
            item["pct"] = round(float(row.cost or 0) * 100.0 / total_cost, 2)
        results.append(item)
    return results


async def get_requests(
    db: AsyncSession,
    *,
    limit: int = 50,
    offset: int = 0,
    range_key: str | None = None,
    application_id: uuid.UUID | None = None,
    status_filter: str | None = None,
    provider: str | None = None,
    search: str | None = None,
) -> dict:
    filters = []
    if range_key:
        since, _ = parse_range(range_key)
        filters.append(LLMRequest.created_at >= since)
    if application_id is not None:
        filters.append(LLMRequest.application_id == application_id)
    if status_filter == "success":
        filters.append(LLMRequest.status < 400)
    elif status_filter == "error":
        filters.append(LLMRequest.status >= 400)
    if provider:
        filters.append(func.lower(LLMRequest.provider) == provider.lower())
    if search:
        pattern = f"%{search.lower()}%"
        filters.append(
            func.lower(
                func.concat(
                    LLMRequest.id.cast(String),
                    " ",
                    LLMRequest.model,
                    " ",
                    func.coalesce(LLMRequest.feature, ""),
                    " ",
                    func.coalesce(LLMRequest.prompt_preview, ""),
                )
            ).like(pattern)
        )

    where_clause = and_(*filters) if filters else True

    count_stmt = select(func.count(LLMRequest.id)).where(where_clause)
    total = int((await db.execute(count_stmt)).scalar_one())

    from sqlalchemy.orm import selectinload
    stmt: Select = (
        select(LLMRequest)
        .options(selectinload(LLMRequest.application))
        .where(where_clause)
        .order_by(LLMRequest.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    rows = (await db.execute(stmt)).scalars().all()
    items = [
        {
            "id": row.id,
            "application_name": row.application.application_name if row.application else "Unknown",
            "model": row.model,
            "provider": row.provider,
            "prompt_tokens": row.prompt_tokens,
            "completion_tokens": row.completion_tokens,
            "total_tokens": row.total_tokens,
            "cost": float(row.cost or 0),
            "latency_ms": row.latency_ms,
            "status": row.status,
            "feature": row.feature,
            "endpoint": row.endpoint,
            "prompt_preview": row.prompt_preview,
            "completion_preview": row.completion_preview,
            "created_at": row.created_at,
        }
        for row in rows
    ]

    return {"total": total, "limit": limit, "offset": offset, "items": items}


async def get_endpoints(
    db: AsyncSession,
    *,
    range_key: str = "30d",
    application_id: uuid.UUID | None = None,
) -> list[dict]:
    since, _ = parse_range(range_key)
    filters = _base_filters(since, application_id)

    stmt = (
        select(
            LLMRequest.endpoint.label("endpoint"),
            func.coalesce(func.sum(LLMRequest.cost), 0).label("cost"),
            func.count(LLMRequest.id).label("requests"),
            func.coalesce(func.sum(LLMRequest.total_tokens), 0).label("tokens"),
            func.coalesce(func.avg(LLMRequest.latency_ms), 0).label("avg_latency_ms"),
            func.coalesce(
                cast(func.count(LLMRequest.id).filter(LLMRequest.status >= 400), Float)
                * 100.0 / func.nullif(func.count(LLMRequest.id), 0),
                0,
            ).label("error_rate"),
        )
        .where(filters)
        .group_by(LLMRequest.endpoint)
        .order_by(func.sum(LLMRequest.cost).desc())
    )

    rows = (await db.execute(stmt)).all()
    total_cost = sum(float(r.cost or 0) for r in rows) or 1.0

    results = []
    for row in rows:
        results.append({
            "endpoint": row.endpoint,
            "cost": round(float(row.cost or 0), 6),
            "requests": int(row.requests),
            "tokens": int(row.tokens or 0),
            "avg_latency_ms": round(float(row.avg_latency_ms or 0), 2),
            "error_rate": round(float(row.error_rate or 0), 4),
            "pct": round(float(row.cost or 0) * 100.0 / total_cost, 2),
        })
    return results


async def get_features(
    db: AsyncSession,
    *,
    range_key: str = "30d",
    application_id: uuid.UUID | None = None,
) -> list[dict]:
    since, _ = parse_range(range_key)
    filters = _base_filters(since, application_id)

    stmt = (
        select(
            func.coalesce(LLMRequest.feature, "unknown").label("feature"),
            func.coalesce(func.sum(LLMRequest.cost), 0).label("cost"),
            func.count(LLMRequest.id).label("requests"),
            func.coalesce(func.sum(LLMRequest.total_tokens), 0).label("tokens"),
        )
        .where(filters)
        .group_by(LLMRequest.feature)
        .order_by(func.sum(LLMRequest.cost).desc())
    )

    rows = (await db.execute(stmt)).all()
    return [
        {
            "feature": row.feature,
            "cost": round(float(row.cost or 0), 6),
            "requests": int(row.requests),
            "tokens": int(row.tokens or 0),
        }
        for row in rows
    ]


async def get_applications(
    db: AsyncSession,
    *,
    range_key: str = "30d",
) -> list[dict]:
    from app.models.application import Application
    since, _ = parse_range(range_key)
    filters = _base_filters(since, None)

    stmt = (
        select(
            Application.application_name.label("application_name"),
            func.coalesce(func.sum(LLMRequest.cost), 0).label("cost"),
            func.count(LLMRequest.id).label("requests"),
            func.coalesce(func.sum(LLMRequest.total_tokens), 0).label("tokens"),
        )
        .join(Application, Application.id == LLMRequest.application_id)
        .where(filters)
        .group_by(Application.application_name)
        .order_by(func.sum(LLMRequest.cost).desc())
    )

    rows = (await db.execute(stmt)).all()
    return [
        {
            "application_name": row.application_name,
            "cost": round(float(row.cost or 0), 6),
            "requests": int(row.requests),
            "tokens": int(row.tokens or 0),
        }
        for row in rows
    ]


async def get_application_metrics(
    db: AsyncSession,
    application_id: uuid.UUID,
    *,
    range_key: str = "30d",
) -> dict | None:
    from app.models.application import Application

    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()
    if application is None:
        return None

    overview = await get_overview(db, range_key=range_key, application_id=application_id)
    top_endpoints = await get_endpoints(db, range_key=range_key, application_id=application_id)
    
    return {
        "application_id": application_id,
        "application_name": application.application_name,
        **overview,
        "top_endpoints": top_endpoints[:5],
    }
