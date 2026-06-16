"""Connected LLM application model (single-user — no auth linkage)."""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Application(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An instrumented LLM application routed through the TRACEai proxy."""

    __tablename__ = "applications"

    application_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="custom", server_default="custom")
    default_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    trace_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    upstream_base_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    endpoints: Mapped[list["ApplicationEndpoint"]] = relationship(
        "ApplicationEndpoint",
        back_populates="application",
        cascade="all, delete-orphan",
    )
    llm_requests: Mapped[list["LLMRequest"]] = relationship(
        "LLMRequest",
        back_populates="application",
        cascade="all, delete-orphan",
    )
    optimization_reports: Mapped[list["OptimizationReport"]] = relationship(
        "OptimizationReport",
        back_populates="application",
        cascade="all, delete-orphan",
    )
