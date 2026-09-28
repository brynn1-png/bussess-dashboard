"""Admin dashboard API tests (M4): authz matrix, aggregation, management.

The 401/403 matrix over EVERY admin route is the mandatory gate: a single
endpoint leaking to customers fails this task.
"""

from sqlalchemy import select

from app.core.security import create_access_token
from app.models.ai_analysis import AIAnalysis
from app.models.enums import UserRole
from app.models.user import User

# (method, path, json body) — valid bodies so only AUTH can cause 401/403.
ADMIN_ROUTES = [
    ("GET", "/api/admin/overview", None),
    ("GET", "/api/admin/tickets", None),
    ("GET", "/api/admin/tickets/1", None),
    ("GET", "/api/admin/customers", None),
    ("PATCH", "/api/admin/tickets/1", {"status": "open"}),
    ("PATCH", "/api/admin/tickets/1/analysis", {"is_human_confirmed": True}),
    ("POST", "/api/admin/tickets/1/messages", {"content": "A reply from support."}),
]


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


def seed_three_tickets(client, db_session):
    """Two customers, three tickets — returns (admin_token, [t1, t2, t3])."""
    admin = make_admin(db_session)
    alice = register(client, "alice@example.com", name="Alice Anderson")
    bob = register(client, "bob@example.com", name="Bob Builder")
    t1 = submit(client, alice, "Where is my parcel")
    t2 = submit(client, alice, "Refund my duplicate charge")
    t3 = submit(client, bob, "Server outage right now")
    return admin, [t1, t2, t3]


# --- Authz matrix (mandatory) -------------------------------------------------


def test_admin_routes_reject_anonymous(client):
    for method, path, body in ADMIN_ROUTES:
        res = client.request(method, path, json=body)
        assert res.status_code == 401, f"{method} {path} → {res.status_code}"


def test_admin_routes_reject_customers(client):
    token = register(client, "customer@example.com")
    for method, path, body in ADMIN_ROUTES:
        res = client.request(method, path, headers=auth(token), json=body)
        assert res.status_code == 403, f"{method} {path} → {res.status_code}"


# --- Overview -----------------------------------------------------------------


def test_overview_counts_and_avg_priority(client, db_session):
    admin, (t1, t2, t3) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    # Make the numbers deterministic (mock analysis may have assigned some).
    assert client.patch(f"/api/admin/tickets/{t1}", headers=ha, json={"priority": "low"}).status_code == 200
    assert client.patch(f"/api/admin/tickets/{t2}", headers=ha, json={"priority": "urgent"}).status_code == 200
    assert client.patch(f"/api/admin/tickets/{t3}", headers=ha, json={"priority": "high"}).status_code == 200
    assert client.patch(f"/api/admin/tickets/{t2}", headers=ha, json={"status": "in_progress"}).status_code == 200

    res = client.get("/api/admin/overview", headers=ha)
    assert res.status_code == 200
    body = res.json()

    assert body["total_tickets"] == 3
    assert body["total_customers"] == 2
    assert body["statuses"] == {"open": 2, "in_progress": 1, "resolved": 0, "closed": 0}
    assert body["priorities"] == {"low": 1, "medium": 0, "high": 1, "urgent": 1, "unassigned": 0}
    # (1 + 4 + 3) / 3
    assert abs(body["avg_priority"] - 2.67) < 0.001

    # AI: mock analyzed all three; nobody confirmed anything yet.
    assert body["ai"]["completed"] == 3
    assert body["ai"]["human_confirmed"] == 0
    assert body["ai"]["awaiting_review"] == 3

    assert len(body["recent_tickets"]) == 3
    assert {t["id"] for t in body["recent_tickets"]} == {t1, t2, t3}


def test_overview_empty_database(client, db_session):
    admin = make_admin(db_session, email="root2@example.com")
    body = client.get("/api/admin/overview", headers=auth(admin)).json()
    assert body["total_tickets"] == 0
    assert body["avg_priority"] is None
    assert body["recent_tickets"] == []


# --- Ticket list + filter -----------------------------------------------------


def test_admin_sees_all_tickets_across_customers(client, db_session):
    admin, (t1, t2, t3) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    tickets = client.get("/api/admin/tickets", headers=ha).json()
    assert len(tickets) == 3
    assert {t["customer_name"] for t in tickets} == {"Alice Anderson", "Bob Builder"}
    assert {t["id"] for t in tickets} == {t1, t2, t3}

    # Filter: set one to resolved, filter by it
    client.patch(f"/api/admin/tickets/{t3}", headers=ha, json={"status": "resolved"})
    resolved = client.get("/api/admin/tickets?status=resolved", headers=ha).json()
    assert [t["id"] for t in resolved] == [t3]
    open_tickets = client.get("/api/admin/tickets?status=open", headers=ha).json()
    assert len(open_tickets) == 2


def test_admin_ticket_filter_invalid_status_is_422(client, db_session):
    admin = make_admin(db_session, email="root3@example.com")
    res = client.get("/api/admin/tickets?status=bogus", headers=auth(admin))
    assert res.status_code == 422


# --- Detail + updates ---------------------------------------------------------


def test_admin_ticket_detail_includes_customer_messages_analysis(client, db_session):
    admin, (t1, _, _) = seed_three_tickets(client, db_session)
    body = client.get(f"/api/admin/tickets/{t1}", headers=auth(admin)).json()
    assert body["customer"]["email"] == "alice@example.com"
    assert len(body["messages"]) == 1
    assert body["analysis"] is not None
    assert body["analysis"]["status"] == "completed"


def test_update_ticket_persists_and_validates(client, db_session):
    admin, (t1, _, _) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    res = client.patch(
        f"/api/admin/tickets/{t1}",
        headers=ha,
        json={"status": "in_progress", "category": "Escalated", "priority": "urgent"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "in_progress"

    detail = client.get(f"/api/admin/tickets/{t1}", headers=ha).json()
    assert detail["status"] == "in_progress"
    assert detail["category"] == "Escalated"
    assert detail["priority"] == "urgent"

    assert client.patch(f"/api/admin/tickets/{t1}", headers=ha, json={"status": "bogus"}).status_code == 422
    assert client.patch(f"/api/admin/tickets/{t1}", headers=ha, json={"category": "x" * 51}).status_code == 422
    assert client.patch(f"/api/admin/tickets/{t1}", headers=ha, json={}).status_code == 422
    assert client.patch("/api/admin/tickets/99999", headers=ha, json={"status": "open"}).status_code == 404
    assert client.get("/api/admin/tickets/99999", headers=ha).status_code == 404


# --- AI analysis review -------------------------------------------------------


def test_update_analysis_edit_and_confirm(client, db_session):
    admin, (t1, t2, _) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    res = client.patch(
        f"/api/admin/tickets/{t1}/analysis",
        headers=ha,
        json={"suggested_response": "Admin edited this reply before sending.", "is_human_confirmed": True},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["is_human_confirmed"] is True
    assert body["suggested_response"] == "Admin edited this reply before sending."

    # Provenance survives: confirmed flag persisted on the row.
    analysis = db_session.scalars(
        select(AIAnalysis).where(AIAnalysis.ticket_id == t1)
    ).one()
    assert analysis.is_human_confirmed is True
    assert analysis.suggested_response.startswith("Admin edited")

    # Un-confirmed second ticket stays AI-only.
    second = client.get(f"/api/admin/tickets/{t2}", headers=ha).json()
    assert second["analysis"]["is_human_confirmed"] is False

    assert client.patch(f"/api/admin/tickets/{t1}/analysis", headers=ha, json={}).status_code == 422
    assert client.patch(f"/api/admin/tickets/99999/analysis", headers=ha, json={"is_human_confirmed": True}).status_code == 404


def test_update_analysis_404_when_no_analysis_row(client, db_session):
    admin, (t1, _, _) = seed_three_tickets(client, db_session)
    analysis = db_session.scalars(
        select(AIAnalysis).where(AIAnalysis.ticket_id == t1)
    ).one()
    db_session.delete(analysis)
    db_session.commit()

    res = client.patch(
        f"/api/admin/tickets/{t1}/analysis",
        headers=auth(admin),
        json={"is_human_confirmed": True},
    )
    assert res.status_code == 404


# --- Triage queue: AI review filters ------------------------------------------


def test_review_filter_awaiting_and_confirmed(client, db_session):
    admin, (t1, t2, t3) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    # Every seeded ticket has a completed, unconfirmed analysis (mock).
    awaiting = client.get("/api/admin/tickets?review=awaiting", headers=ha).json()
    assert {t["id"] for t in awaiting} == {t1, t2, t3}
    assert all(t["analysis_status"] == "completed" for t in awaiting)
    assert all(t["is_human_confirmed"] is False for t in awaiting)

    # Confirm exactly one → it leaves the queue and joins `confirmed`.
    assert client.patch(
        f"/api/admin/tickets/{t1}/analysis", headers=ha, json={"is_human_confirmed": True}
    ).status_code == 200

    awaiting = client.get("/api/admin/tickets?review=awaiting", headers=ha).json()
    assert {t["id"] for t in awaiting} == {t2, t3}
    confirmed = client.get("/api/admin/tickets?review=confirmed", headers=ha).json()
    assert [t["id"] for t in confirmed] == [t1]

    # The Overview KPI and the queue agree — same predicate, server-side.
    overview = client.get("/api/admin/overview", headers=ha).json()
    assert overview["ai"]["awaiting_review"] == len(awaiting)


def test_review_filter_combines_with_status_and_validates(client, db_session):
    admin, (t1, t2, t3) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    # Confirm t1, then put it in_progress — both filters must hold at once.
    client.patch(f"/api/admin/tickets/{t1}/analysis", headers=ha, json={"is_human_confirmed": True})
    client.patch(f"/api/admin/tickets/{t2}", headers=ha, json={"status": "in_progress"})

    both = client.get(
        "/api/admin/tickets?review=awaiting&status=in_progress", headers=ha
    ).json()
    assert [t["id"] for t in both] == [t2]

    # Status-only still returns everything unconfirmed by review.
    assert len(client.get("/api/admin/tickets?status=in_progress", headers=ha).json()) == 1
    assert len(client.get("/api/admin/tickets", headers=ha).json()) == 3

    # Bad review value is a 422, not a silent no-op.
    res = client.get("/api/admin/tickets?review=bogus", headers=ha)
    assert res.status_code == 422
    assert client.get("/api/admin/tickets?review=bogus", headers=auth(admin)).status_code == 422
    # t3 untouched by the setup above.
    assert {t["id"] for t in client.get("/api/admin/tickets", headers=ha).json()} == {t1, t2, t3}


def test_ticket_summary_reports_ai_review_state(client, db_session):
    admin, (t1, _, _) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    row = client.get("/api/admin/tickets", headers=ha).json()[0]
    assert row["analysis_status"] == "completed"
    assert row["is_human_confirmed"] is False

    # The PATCH response carries the same state (used by the list after an edit).
    patched = client.patch(
        f"/api/admin/tickets/{t1}", headers=ha, json={"status": "in_progress"}
    ).json()
    assert patched["analysis_status"] == "completed"
    assert patched["is_human_confirmed"] is False


# --- Admin reply (M6 reply loop) ----------------------------------------------


def test_admin_reply_posts_as_admin_and_reaches_customer(client, db_session):
    admin, (t1, _, t3) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    res = client.post(
        f"/api/admin/tickets/{t1}/messages",
        headers=ha,
        json={"content": "Refund issued — it will clear in 3–5 days."},
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["sender"] == "admin"
    assert body["ticket_id"] == t1
    assert body["content"] == "Refund issued — it will clear in 3–5 days."

    # The reply is on the thread both sides read.
    detail = client.get(f"/api/admin/tickets/{t1}", headers=ha).json()
    assert detail["messages"][-1]["sender"] == "admin"
    assert len(detail["messages"]) == 2

    # An admin may reply to ANY customer's ticket — seed_three_tickets gives
    # t3 to Bob while t1 belongs to Alice; no ownership scoping applies.
    res = client.post(
        f"/api/admin/tickets/{t3}/messages",
        headers=ha,
        json={"content": "Escalating this outage now."},
    )
    assert res.status_code == 201
    assert res.json()["sender"] == "admin"


def test_admin_reply_validation_and_missing_ticket(client, db_session):
    admin, (t1, _, _) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    # Reuses the customer AddMessageRequest limits: empty and over-long are 422.
    assert client.post(f"/api/admin/tickets/{t1}/messages", headers=ha, json={"content": ""}).status_code == 422
    assert client.post(
        f"/api/admin/tickets/{t1}/messages", headers=ha, json={"content": "x" * 10001}
    ).status_code == 422
    assert client.post(
        "/api/admin/tickets/99999/messages", headers=ha, json={"content": "hello there"}
    ).status_code == 404


def test_admin_reply_trims_and_customer_route_still_forbidden(client, db_session):
    admin, (t1, _, _) = seed_three_tickets(client, db_session)
    ha = auth(admin)

    res = client.post(
        f"/api/admin/tickets/{t1}/messages",
        headers=ha,
        json={"content": "  Padded reply  "},
    )
    assert res.status_code == 201
    assert res.json()["content"] == "Padded reply"

    # The customer-owned route still rejects admins (unchanged M2 behaviour).
    customer = register(client, "owner@example.com", name="Owner")
    own = submit(client, customer, subject="My own ticket")
    assert client.post(
        f"/api/tickets/{own}/messages", headers=ha, json={"content": "admin trying here"}
    ).status_code == 403


# --- Customers ----------------------------------------------------------------


def test_customers_list_with_ticket_counts(client, db_session):
    admin = make_admin(db_session)
    alice = register(client, "alice@example.com", name="Alice A")
    bob = register(client, "bob@example.com", name="Bob B")
    submit(client, alice)
    submit(client, alice, subject="Second issue from Alice")
    submit(client, bob)

    rows = client.get("/api/admin/customers", headers=auth(admin)).json()
    assert len(rows) == 2
    by_email = {row["email"]: row for row in rows}
    assert by_email["alice@example.com"]["ticket_count"] == 2
    assert by_email["alice@example.com"]["full_name"] == "Alice A"
    assert by_email["bob@example.com"]["ticket_count"] == 1
