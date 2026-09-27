"""Authentication + authorization tests (M1 acceptance criteria)."""

from fastapi import HTTPException
import pytest
from sqlalchemy import select

from app.api.deps import require_admin
from app.models.enums import UserRole
from app.models.user import Customer, User

VALID_EMAIL = "customer@example.com"
VALID_PASSWORD = "securepass123"


def register(client, email=VALID_EMAIL, password=VALID_PASSWORD, full_name="Casey Customer"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )


# --- Register ---------------------------------------------------------------


def test_register_creates_customer_with_token(client):
    response = register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "customer"
    assert body["user"]["email"] == VALID_EMAIL
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_register_duplicate_email_conflicts(client):
    assert register(client).status_code == 201
    assert register(client).status_code == 409


def test_register_weak_password_rejected(client):
    response = register(client, password="short")
    assert response.status_code == 422


def test_register_invalid_email_rejected(client):
    response = register(client, email="not-an-email")
    assert response.status_code == 422


def test_register_creates_customer_profile(client, db_session):
    user_id = register(client).json()["user"]["id"]
    customer = db_session.scalar(select(Customer).where(Customer.user_id == user_id))
    assert customer is not None


# --- Login ------------------------------------------------------------------


def test_login_success(client):
    register(client)
    response = client.post(
        "/api/auth/login", json={"email": VALID_EMAIL, "password": VALID_PASSWORD}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == VALID_EMAIL


def test_login_wrong_password_401(client):
    register(client)
    response = client.post(
        "/api/auth/login", json={"email": VALID_EMAIL, "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_login_unknown_email_401(client):
    response = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": VALID_PASSWORD}
    )
    assert response.status_code == 401


# --- Current user -----------------------------------------------------------


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_rejects_garbage_token(client):
    response = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer garbage.token.here"}
    )
    assert response.status_code == 401


def test_me_returns_current_user(client):
    token = register(client).json()["access_token"]
    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == VALID_EMAIL


# --- Role-based authorization ------------------------------------------------


def test_require_admin_rejects_customer():
    customer = User(id=1, email="c@example.com", hashed_password="x", role=UserRole.CUSTOMER)
    with pytest.raises(HTTPException) as exc:
        require_admin(customer)
    assert exc.value.status_code == 403


def test_require_admin_allows_admin():
    admin = User(id=1, email="a@example.com", hashed_password="x", role=UserRole.ADMIN)
    assert require_admin(admin) is admin
