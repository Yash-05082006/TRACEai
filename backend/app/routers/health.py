"""Health check endpoint with database connectivity validation."""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.database import check_database_connection

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Liveness probe — validates API process and database connectivity."""
    db_ok = await check_database_connection()

    body = {
        "status": "ok" if db_ok else "unhealthy",
        "database": "connected" if db_ok else "disconnected",
    }

    if not db_ok:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=body)

    return body
