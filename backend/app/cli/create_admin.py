"""Create an admin user.

Public registration never grants admin (context.md §4, §7); admins are
provisioned through this CLI instead.

Usage (from backend/):
    python -m app.cli.create_admin --email admin@example.com --password <strong-password>
"""

import argparse
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import ConfigurationError
from app.core.security import hash_password
from app.database.session import get_session_factory
from app.models.enums import UserRole
from app.models.user import User


class AdminCreationError(Exception):
    pass


def create_admin(
    db: Session, email: str, password: str, full_name: str = "Administrator"
) -> User:
    """Create (or return existing) admin user. Raises on non-admin email conflict."""
    email = email.lower().strip()
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        if existing.role == UserRole.ADMIN:
            return existing
        raise AdminCreationError(
            f"'{email}' already belongs to a customer account and cannot become an admin."
        )

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name.strip() or "Administrator",
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create an administrator user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--full-name", default="Administrator")
    args = parser.parse_args(argv)

    try:
        session = get_session_factory()()
    except ConfigurationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    try:
        user = create_admin(session, args.email, args.password, args.full_name)
    except AdminCreationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    finally:
        session.close()

    print(f"Admin ready: {user.email} (id={user.id}, role={user.role.value})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
