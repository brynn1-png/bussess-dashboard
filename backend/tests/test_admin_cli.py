"""Tests for the admin provisioning CLI (TASK-002 requirement)."""

import pytest
from sqlalchemy import select

from app.api.deps import require_admin
from app.cli.create_admin import AdminCreationError, create_admin
from app.models.enums import UserRole
from app.models.user import User


def test_create_admin_provisions_admin_role(db_session):
    user = create_admin(db_session, "root@example.com", "admin-pass-123")
    assert user.role == UserRole.ADMIN

    stored = db_session.scalar(select(User).where(User.email == "root@example.com"))
    assert stored is not None
    assert stored.role == UserRole.ADMIN
    # and the dependency accepts it
    assert require_admin(stored) is stored


def test_create_admin_idempotent_for_same_admin_email(db_session):
    first = create_admin(db_session, "root@example.com", "admin-pass-123")
    second = create_admin(db_session, "root@example.com", "different-pass-456")
    assert first.id == second.id


def test_create_admin_rejects_customer_email_conflict(db_session):
    customer = User(
        email="taken@example.com",
        hashed_password="x",
        full_name="Casey",
        role=UserRole.CUSTOMER,
    )
    db_session.add(customer)
    db_session.commit()

    with pytest.raises(AdminCreationError):
        create_admin(db_session, "taken@example.com", "admin-pass-123")
