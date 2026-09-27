"""Test fixtures. Env vars are set BEFORE any app import so Settings picks them up.

Test DB is in-memory SQLite (transient test data only — the application's
persistent store remains PostgreSQL per architecture.md).
"""

import os

# UNCONDITIONAL (safety): tests must never reach PostgreSQL — `drop_all` would
# wipe it. A pre-set DATABASE_URL (e.g. from backend/.env or the shell) must
# not win here the way `setdefault` allowed.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DEBUG", "false")

import pytest
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.session import get_engine, get_session_factory
from app.main import app


@pytest.fixture()
def client():
    engine = get_engine()
    Base.metadata.create_all(engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)


@pytest.fixture()
def db_session():
    engine = get_engine()
    Base.metadata.create_all(engine)
    session = get_session_factory()()
    yield session
    session.close()
    Base.metadata.drop_all(engine)
