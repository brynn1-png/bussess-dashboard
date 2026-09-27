"""Workflow engine + config API + analytics tests (M5, TASK-006).

Gates:
- the 401/403 matrix over EVERY new admin route (same rule as M4),
- PLAN §5 engine behavior: exactly one run row per evaluated workflow
  (success / skipped / failed), actions of a failed workflow rolled back,
  human-confirmed suggestions never overwritten,
- analytics aggregates come from SQL, not frontend math.
"""

from sqlalchemy import select

from app.core.security import create_access_token
from app.models.enums import MessageSender, RunStatus, TicketPriority, UserRole
from app.models.ticket import Ticket
from app.models.user import User
from app.models.workflow import Workflow, WorkflowRun
from app.workflows.engine import evaluate_ticket_workflows

# (method, path, json body) — valid bodies so only AUTH can cause 401/403.
WORKFLOW_ROUTES = [
    ("GET", "/api/admin/workflows", None),
    (
        "POST",
        "/api/admin/workflows",
        {"name": "W", "trigger": "ticket.created", "actions": [{"type": "add_tag", "value": "x"}]},
    ),
    ("GET", "/api/admin/workflows/1", None),
    ("PATCH", "/api/admin/workflows/1", {"name": "Renamed"}),
    ("DELETE", "/api/admin/workflows/1", None),
    ("GET", "/api/admin/workflows/1/runs", None),
    ("GET", "/api/admin/analytics", None),
]

_NEUTRAL_SUBJECT = ("Question about features", "Does it support CSV export")


def register(client, email, password="securepass123", name="Casey Customer"):
    res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": name},
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def make_admin(db_session, email="root@example.com", name="Root Admin"):
    admin = User(
        email=email,
        hashed_password="x",
        full_name=name,
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()
    return create_access_token(admin.id, admin.role.value)


def submit(client, token, subject="Where is my parcel", message="It has not arrived yet"):
    res = client.post(
        "/api/tickets",
        headers=auth(token),
        json={"subject": subject, "message": message},
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


def create_workflow(
    client,
    admin_token,
    name="Escalate refunds",
    conditions=None,
    actions=None,
    is_active=True,
):
    payload = {
        "name": name,
        "trigger": "ticket.created",
        "is_active": is_active,
        "conditions": conditions or [],
        "actions": actions or [{"type": "add_tag", "value": "vip"}],
    }
    res = client.post("/api/admin/workflows", headers=auth(admin_token), json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def runs_for(db_session, workflow_id):
    return db_session.scalars(
        select(WorkflowRun)
        .where(WorkflowRun.workflow_id == workflow_id)
        .order_by(WorkflowRun.id.asc())
    ).all()


# --- Authz matrix (mandatory) -------------------------------------------------


def test_new_admin_routes_reject_anonymous(client):
    for method, path, body in WORKFLOW_ROUTES:
        res = client.request(method, path, json=body)
        assert res.status_code == 401, f"{method} {path} -> {res.status_code}: {res.text}"


def test_new_admin_routes_reject_customers(client, db_session):
    token = register(client, "customer@example.com")
    for method, path, body in WORKFLOW_ROUTES:
        res = client.request(method, path, headers=auth(token), json=body)
        assert res.status_code == 403, f"{method} {path} -> {res.status_code}: {res.text}"


# --- Config CRUD + validation (backend is authoritative) ---------------------


def test_create_workflow_validates_the_cap(client, db_session):
    admin = make_admin(db_session)
    created = create_workflow(client, admin, name="First workflow")
    assert created["name"] == "First workflow"
    assert created["trigger"] == "ticket.created"
    assert created["is_active"] is True
    assert created["run_counts"] == {"success": 0, "failed": 0, "skipped": 0}

    invalid_payloads = [
        {"name": "W", "trigger": "message.created", "actions": [{"type": "add_tag", "value": "x"}]},
        {"name": "W", "conditions": [{"field": "bogus", "value": "x"}], "actions": [{"type": "add_tag", "value": "x"}]},
        {"name": "W", "conditions": [{"field": "priority", "value": "bogus"}], "actions": [{"type": "add_tag", "value": "x"}]},
        {"name": "W", "conditions": [{"field": "sentiment", "value": "ok"}], "actions": [{"type": "add_tag", "value": "x"}]},
        {"name": "W", "actions": [{"type": "explode", "value": "x"}]},
        {"name": "W", "actions": [{"type": "set_priority", "value": "sudden"}]},
        {"name": "W", "actions": [{"type": "add_tag", "value": "t" * 31}]},
        {"name": "W", "actions": [{"type": "record_notification", "value": "n" * 201}]},
        {"name": "", "actions": [{"type": "add_tag", "value": "x"}]},
        {"name": "W", "actions": []},
        {
            "name": "W",
            "conditions": [{"field": "status", "value": "open"}] * 6,
            "actions": [{"type": "add_tag", "value": "x"}],
        },
    ]
    for payload in invalid_payloads:
        res = client.post("/api/admin/workflows", headers=auth(admin), json=payload)
        assert res.status_code == 422, f"{payload} -> {res.status_code}: {res.text}"


def test_workflow_crud(client, db_session):
    admin = make_admin(db_session)
    workflow = create_workflow(client, admin, name="Original")
    workflow_id = workflow["id"]

    res = client.patch(
        f"/api/admin/workflows/{workflow_id}",
        headers=auth(admin),
        json={"name": "Renamed", "is_active": False},
    )
    assert res.status_code == 200, res.text
    assert res.json()["name"] == "Renamed"
    assert res.json()["is_active"] is False

    res = client.get(f"/api/admin/workflows/{workflow_id}", headers=auth(admin))
    assert res.status_code == 200
    assert res.json()["name"] == "Renamed"

    # Empty PATCH is a 422 (same rule as M4 ticket updates).
    res = client.patch(f"/api/admin/workflows/{workflow_id}", headers=auth(admin), json={})
    assert res.status_code == 422

    # Unknown workflow: 404 on GET / PATCH / DELETE / runs.
    for method, path, body in [
        ("GET", "/api/admin/workflows/9999", None),
        ("PATCH", "/api/admin/workflows/9999", {"name": "x"}),
        ("DELETE", "/api/admin/workflows/9999", None),
        ("GET", "/api/admin/workflows/9999/runs", None),
    ]:
        res = client.request(method, path, headers=auth(admin), json=body)
        assert res.status_code == 404, f"{method} {path} -> {res.status_code}"

    res = client.delete(f"/api/admin/workflows/{workflow_id}", headers=auth(admin))
    assert res.status_code == 204, res.text
    res = client.get(f"/api/admin/workflows/{workflow_id}", headers=auth(admin))
    assert res.status_code == 404


# --- Engine (PLAN M5 exit criteria) ------------------------------------------


def test_matching_workflow_executes_actions_and_records_success(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "chain@example.com")
    workflow = create_workflow(
        client,
        admin,
        conditions=[{"field": "status", "value": "open"}],
        actions=[
            {"type": "set_priority", "value": "urgent"},
            {"type": "add_tag", "value": "escalated"},
            {"type": "record_notification", "value": "Admin alerted: {subject}"},
        ],
    )

    # End of chain: POST /api/tickets -> analysis -> workflow evaluation.
    ticket_id = submit(client, customer, subject="Refund my duplicate charge")

    db_session.expire_all()
    runs = runs_for(db_session, workflow["id"])
    assert len(runs) == 1
    assert runs[0].status == RunStatus.SUCCESS
    assert [a["type"] for a in runs[0].details["actions"]] == [
        "set_priority",
        "add_tag",
        "record_notification",
    ]

    ticket = db_session.get(Ticket, ticket_id)
    assert ticket.priority == TicketPriority.URGENT  # workflow overrides AI suggestion
    assert ticket.tags == ["escalated"]
    system_messages = [m for m in ticket.messages if m.sender == MessageSender.SYSTEM]
    assert len(system_messages) == 1
    assert "Refund my duplicate charge" in system_messages[0].content


def test_conditions_not_met_records_skipped(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "skip@example.com")
    workflow = create_workflow(
        client,
        admin,
        conditions=[{"field": "priority", "value": "urgent"}],
        actions=[{"type": "add_tag", "value": "escalated"}],
    )

    # Neutral ticket -> mock analysis assigns low priority -> condition fails.
    ticket_id = submit(client, customer, subject=_NEUTRAL_SUBJECT[0], message=_NEUTRAL_SUBJECT[1])

    db_session.expire_all()
    runs = runs_for(db_session, workflow["id"])
    assert len(runs) == 1
    assert runs[0].status == RunStatus.SKIPPED
    assert runs[0].details["reason"] == "conditions_not_met"
    assert runs[0].details["mismatched"]["field"] == "priority"
    assert runs[0].details["mismatched"]["actual"] == "low"

    ticket = db_session.get(Ticket, ticket_id)
    assert not ticket.tags  # actions never ran
    assert all(m.sender != MessageSender.SYSTEM for m in ticket.messages)


def test_failed_action_rolls_back_and_records_failure(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "broken@example.com")
    # Invalid action type injected directly in the DB (API validation bypassed
    # on purpose): the engine must fail the run, not the request.
    workflow = Workflow(
        name="Broken",
        trigger="ticket.created",
        is_active=True,
        conditions=[],
        actions=[
            {"type": "add_tag", "value": "workflowed"},
            {"type": "explode_now", "value": "x"},
        ],
    )
    db_session.add(workflow)
    db_session.commit()

    ticket_id = submit(client, customer, subject=_NEUTRAL_SUBJECT[0], message=_NEUTRAL_SUBJECT[1])

    db_session.expire_all()
    runs = runs_for(db_session, workflow.id)
    assert len(runs) == 1  # exactly one row even on failure
    assert runs[0].status == RunStatus.FAILED
    assert "Unknown action type" in runs[0].details["error"]

    # Savepoint rollback: the first action's tag must not survive.
    ticket = db_session.get(Ticket, ticket_id)
    assert "workflowed" not in (ticket.tags or [])
    assert all(m.sender != MessageSender.SYSTEM for m in ticket.messages)


def test_inactive_workflow_not_evaluated(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "off@example.com")
    workflow = create_workflow(
        client,
        admin,
        is_active=False,
        conditions=[{"field": "status", "value": "open"}],
    )

    submit(client, customer, subject=_NEUTRAL_SUBJECT[0], message=_NEUTRAL_SUBJECT[1])

    db_session.expire_all()
    assert runs_for(db_session, workflow["id"]) == []


def test_generate_action_never_overwrites_human_confirmation(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "human@example.com")
    workflow = create_workflow(
        client,
        admin,
        actions=[{"type": "generate_suggested_response", "value": "Hello {customer}, about {subject}"}],
    )

    ticket_id = submit(client, customer, subject=_NEUTRAL_SUBJECT[0], message=_NEUTRAL_SUBJECT[1])

    db_session.expire_all()
    ticket = db_session.get(Ticket, ticket_id)
    assert ticket.ai_analysis.suggested_response.startswith("Hello Casey Customer")

    # Admin edits and confirms the reply.
    res = client.patch(
        f"/api/admin/tickets/{ticket_id}/analysis",
        headers=auth(admin),
        json={"suggested_response": "Human edited reply", "is_human_confirmed": True},
    )
    assert res.status_code == 200, res.text

    # Re-evaluation (same trigger event) must respect the human edit.
    evaluate_ticket_workflows(ticket_id)

    db_session.expire_all()
    ticket = db_session.get(Ticket, ticket_id)
    assert ticket.ai_analysis.suggested_response == "Human edited reply"
    assert ticket.ai_analysis.is_human_confirmed is True

    runs = runs_for(db_session, workflow["id"])
    assert [r.status for r in runs] == [RunStatus.SUCCESS, RunStatus.SUCCESS]
    notes = [a.get("note") for a in runs[-1].details["actions"]]
    assert "skipped: human-confirmed" in notes


def test_add_tag_deduplicates_on_re_evaluation(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "dupe@example.com")
    workflow = create_workflow(client, admin, actions=[{"type": "add_tag", "value": "vip"}])

    ticket_id = submit(client, customer, subject=_NEUTRAL_SUBJECT[0], message=_NEUTRAL_SUBJECT[1])
    evaluate_ticket_workflows(ticket_id)  # second evaluation of the same event

    db_session.expire_all()
    ticket = db_session.get(Ticket, ticket_id)
    assert ticket.tags == ["vip"]  # no duplicate

    runs = runs_for(db_session, workflow["id"])
    assert [r.status for r in runs] == [RunStatus.SUCCESS, RunStatus.SUCCESS]
    notes = [a.get("note") for a in runs[-1].details["actions"]]
    assert "already tagged" in notes


# --- Runs endpoint + list counts ---------------------------------------------


def test_runs_endpoint_counts_and_cascade(client, db_session):
    admin = make_admin(db_session)
    customer = register(client, "runs@example.com")
    workflow = create_workflow(client, admin)

    submit(client, customer, subject=_NEUTRAL_SUBJECT[0], message=_NEUTRAL_SUBJECT[1])

    res = client.get(f"/api/admin/workflows/{workflow['id']}/runs", headers=auth(admin))
    assert res.status_code == 200, res.text
    runs = res.json()
    assert len(runs) == 1
    assert runs[0]["status"] == "success"
    assert runs[0]["workflow_id"] == workflow["id"]
    assert {"id", "workflow_id", "status", "details", "created_at"} <= set(runs[0])

    res = client.get(f"/api/admin/workflows/{workflow['id']}", headers=auth(admin))
    assert res.json()["run_counts"] == {"success": 1, "failed": 0, "skipped": 0}

    res = client.delete(f"/api/admin/workflows/{workflow['id']}", headers=auth(admin))
    assert res.status_code == 204
    res = client.get(f"/api/admin/workflows/{workflow['id']}/runs", headers=auth(admin))
    assert res.status_code == 404  # workflow gone -> runs unavailable


# --- Analytics (DB-derived aggregates) ---------------------------------------


def test_analytics_aggregates_window(client, db_session):
    admin = make_admin(db_session)
    alice = register(client, "alice@example.com", name="Alice Anderson")
    bob = register(client, "bob@example.com", name="Bob Builder")

    submit(client, alice, subject="Refund for overcharge", message="I want my money back")
    submit(client, alice, subject="Another refund request", message="Please refund twice")
    submit(client, bob, subject="Cannot sign in", message="Locked out of the account")

    res = client.get("/api/admin/analytics?days=7", headers=auth(admin))
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["days"] == 7
    assert data["total_tickets"] == 3  # all time
    assert data["by_status"] == {"open": 3, "in_progress": 0, "resolved": 0, "closed": 0}
    assert {c["category"]: c["count"] for c in data["by_category"]} == {
        "billing": 2,
        "account": 1,
    }

    assert len(data["by_day"]) == 7
    assert data["by_day"][-1]["count"] == 3  # everything created today
    assert sum(d["count"] for d in data["by_day"]) == 3  # other days zero-filled
    assert data["ai"]["completed"] == 3
    assert data["ai"]["human_confirmed"] == 0

    # Window bounds are validated server-side.
    assert client.get("/api/admin/analytics?days=0", headers=auth(admin)).status_code == 422
    assert client.get("/api/admin/analytics?days=91", headers=auth(admin)).status_code == 422
