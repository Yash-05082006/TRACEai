"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the TRACEai API (single-user hackathon mode)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(..., description="PostgreSQL connection URL (Neon)")
    openai_api_key: str | None = Field(default=None)
    gemini_api_key: str | None = Field(default=None)
    log_level: str = Field(default="INFO")
    cors_origins: str = Field(default="http://localhost:8080,http://localhost:8081")

    @property
    def async_database_url(self) -> str:
        """Return asyncpg-compatible URL without unsupported query parameters."""
        base_url = self.database_url.split("?")[0]
        if base_url.startswith("postgresql+asyncpg://"):
            return base_url
        if base_url.startswith("postgresql://"):
            return base_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return base_url

    @property
    def database_requires_ssl(self) -> bool:
        """Whether SSL is required (Neon / cloud Postgres)."""
        return "sslmode=require" in self.database_url or "neon" in self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
