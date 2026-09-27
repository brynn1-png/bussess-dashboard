"""Workflow config CRUD + run history. EVERY route requires `require_admin`
(deviation flagged in TASK-006: mounted under /api/admin/* instead of the
architecture's `/api/workflows` sketch — reconciled in M6)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowRunResponse,
    WorkflowUpdate,
)
from app.services import workflow_service

router = APIRouter(prefix="/api/admin/workflows", tags=["workflows"])


def _map_error(exc: Exception) -> HTTPException:
    if isinstance(exc, workflow_service.NotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error"
    )


def _require_fields(payload: WorkflowUpdate) -> None:
    if not payload.model_fields_set:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No fields to update",
        )


@router.get("", response_model=list[WorkflowResponse])
def list_workflows(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[WorkflowResponse]:
    return [WorkflowResponse.model_validate(row) for row in workflow_service.list_workflows(db)]


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    payload: WorkflowCreate,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WorkflowResponse:
    return WorkflowResponse.model_validate(workflow_service.create_workflow(db, payload))


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: int,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WorkflowResponse:
    try:
        row = workflow_service.get_workflow_row(db, workflow_id)
    except workflow_service.NotFoundError as exc:
        raise _map_error(exc)
    return WorkflowResponse.model_validate(row)


@router.patch("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: int,
    payload: WorkflowUpdate,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WorkflowResponse:
    _require_fields(payload)
    try:
        row = workflow_service.update_workflow(db, workflow_id, payload)
    except workflow_service.NotFoundError as exc:
        raise _map_error(exc)
    return WorkflowResponse.model_validate(row)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: int,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    try:
        workflow_service.delete_workflow(db, workflow_id)
    except workflow_service.NotFoundError as exc:
        raise _map_error(exc)


@router.get("/{workflow_id}/runs", response_model=list[WorkflowRunResponse])
def workflow_runs(
    workflow_id: int,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[WorkflowRunResponse]:
    try:
        runs = workflow_service.workflow_runs(db, workflow_id)
    except workflow_service.NotFoundError as exc:
        raise _map_error(exc)
    return [WorkflowRunResponse.model_validate(run) for run in runs]
