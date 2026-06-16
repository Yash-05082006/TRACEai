"""Application endpoint model for endpoint-centric observability."""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ApplicationEndpoint(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A specific endpoint within a registered application."""

    __tablename__ = "application_endpoints"

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    endpoint_name: Mapped[str] = mapped_column(String(255), nullable=False)
    endpoint_path: Mapped[str] = mapped_column(String(255), nullable=False)
    request_method: Mapped[str] = mapped_column(String(16), nullable=False, default="POST")
    feature: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    application: Mapped["Application"] = relationship("Application", back_populates="endpoints")
