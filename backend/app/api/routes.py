"""API route definitions. Routes stay thin; business logic belongs in services."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
