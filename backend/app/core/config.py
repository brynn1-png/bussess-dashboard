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

    # AI (decision D2, resolved 2026-09-28: Ollama — cloud endpoint by default,
    # local install via config; mock stays the
    # default so tests/demos/reviewers work offline)
    ai_provider: str = "mock"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_api_key: str = ""  # required for Ollama cloud; empty for local Ollama
    ollama_timeout_seconds: float = 60.0


settings = Settings()
