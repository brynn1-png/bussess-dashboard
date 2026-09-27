"""Application configuration loaded from environment variables / .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Secrets (e.g. DATABASE_URL) come from env / .env only."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AI Business Automation Platform"
    debug: bool = False
    database_url: str = ""


settings = Settings()
