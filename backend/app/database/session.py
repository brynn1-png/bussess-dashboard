"""Database engine, session factory, and FastAPI dependency."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import ConfigurationError, settings

_engine = None
_session_factory: sessionmaker | None = None


def get_engine():
    """Create the engine lazily so import never fails on missing config."""
    global _engine
    if _engine is None:
        url = settings.database_url
        if not url:
            raise ConfigurationError(
                "DATABASE_URL is not configured. "
                "Copy backend/.env.example to backend/.env and set DATABASE_URL."
            )
        kwargs: dict = {"pool_pre_ping": True}
        if url.startswith("sqlite"):
            kwargs["connect_args"] = {"check_same_thread": False}
            # In-memory SQLite needs a shared connection (tests).
            if url in ("sqlite://", "sqlite:///:memory:"):
                kwargs["poolclass"] = StaticPool
        _engine = create_engine(url, **kwargs)
    return _engine


def get_session_factory() -> sessionmaker:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(bind=get_engine(), expire_on_commit=False)
    return _session_factory


def get_db():
    """FastAPI dependency: one session per request."""
    session: Session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()
