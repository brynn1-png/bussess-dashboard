"""DB-free security helper tests (approved TASK-002 criterion: runnable without DATABASE_URL)."""

from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest

from app.core import security
from app.core.config import settings


def test_password_hash_roundtrip():
    hashed = security.hash_password("s3cret-passw0rd")
    assert hashed != "s3cret-passw0rd"
    assert security.verify_password("s3cret-passw0rd", hashed)
    assert not security.verify_password("wrong-password", hashed)


def test_access_token_roundtrip():
    token = security.create_access_token(42, "admin")
    payload = security.decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "admin"
    assert "exp" in payload


def test_expired_token_rejected():
    expired = datetime.now(timezone.utc) - timedelta(minutes=1)
    token = pyjwt.encode(
        {"sub": "1", "role": "customer", "exp": expired},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(pyjwt.ExpiredSignatureError):
        security.decode_access_token(token)


def test_tampered_token_rejected():
    token = security.create_access_token(1, "customer")
    with pytest.raises(pyjwt.PyJWTError):
        security.decode_access_token(token + "tampered")

    forged = pyjwt.encode(
        {"sub": "1", "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "wrong-secret-key-far-too-short-to-accidentally-match",  # deliberately wrong key
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(pyjwt.PyJWTError):
        security.decode_access_token(forged)
