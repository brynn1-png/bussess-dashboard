"""Authentication use cases. Routes stay thin and map errors to HTTP status."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import Customer, User
from app.schemas.auth import LoginRequest, RegisterRequest


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


def register_customer(
    db: Session, payload: RegisterRequest
) -> tuple[User, str]:
    """Create a customer user + profile and return (user, access_token)."""
    email = payload.email.lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise EmailAlreadyRegisteredError(email)

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=UserRole.CUSTOMER,
    )
    user.customer = Customer()
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role.value)
    return user, token


def login(db: Session, payload: LoginRequest) -> tuple[User, str]:
    """Verify credentials and return (user, access_token)."""
    email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise InvalidCredentialsError()
    if not user.is_active:
        raise InvalidCredentialsError()

    token = create_access_token(user.id, user.role.value)
    return user, token
