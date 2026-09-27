"""Application configuration loaded from environment variables / .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class ConfigurationError(RuntimeError):
    """Raised when required runtime configuration is missing (mapped to HTTP 503)."""


class Settings(BaseSettings):
    """Runtime settings. Secrets (e.g. DATABASE_URL) come from env / .env only."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AI Business Automation Platform"
    debug: bool = False
    database_url: str = ""

    # Auth (decision D4: JWT + bcrypt)
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60


settings = Settings()
