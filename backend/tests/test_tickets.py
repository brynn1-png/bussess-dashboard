"""Ticket submission tests (M2 acceptance criteria): CRUD + cross-customer isolation."""

from app.core.security import create_access_token
from app.models.enums import UserRole
from app.models.user import User


def register(client, email, password="securepass123", name="Casey Customer"):
    res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": name},
    )
    assert res.status_code == 201, res.text
    return res.json()


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def submit(client, token, subject="Printer on fire", message="It is literally on fire"):
    return client.post(
        "/api/tickets",
        headers=auth(token),
        json={"subject": subject, "message": message},
    )


# --- Creation -----------------------------------------------------------------


def test_create_ticket_requires_auth(client):
    res = client.post("/api/tickets", json={"subject": "Hello there friend", "message": "This is a message"})
    assert res.status_code == 401


def test_create_ticket_returns_201_with_initial_message(client):
    token = register(client, "a@example.com")["access_token"]
    res = submit(client, token)
    assert res.status_code == 201
    body = res.json()
    assert body["subject"] == "Printer on fire"
    assert body["status"] == "open"
    assert len(body["messages"]) == 1
    assert body["messages"][0]["content"] == "It is literally on fire"
    assert body["messages"][0]["sender"] == "customer"


def test_create_ticket_rejects_invalid_payloads(client):
    token = register(client, "a@example.com")["access_token"]
    assert submit(client, token, subject="x", message="long enough message").status_code == 422
    assert submit(client, token, subject="Valid subject", message="short").status_code == 422
    assert submit(client, token, subject="", message="long enough message").status_code == 422


def test_admin_cannot_submit_tickets(client, db_session):
    admin = User(
        email="root@example.com",
        hashed_password="x",
        full_name="Root",
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token(admin.id, admin.role.value)
    assert submit(client, token).status_code == 403


# --- Listing & detail --------------------------------------------------------


def test_list_shows_only_own_tickets(client):
    alice = register(client, "alice@example.com")["access_token"]
    bob = register(client, "bob@example.com")["access_token"]

    own = submit(client, alice, subject="Alice problem").json()
    submit(client, bob, subject="Bob problem")

    listing = client.get("/api/tickets", headers=auth(alice)).json()
    assert [t["subject"] for t in listing] == ["Alice problem"]
    assert listing[0]["id"] == own["id"]


def test_get_detail_includes_thread(client):
    token = register(client, "a@example.com")["access_token"]
    ticket_id = submit(client, token).json()["id"]

    res = client.get(f"/api/tickets/{ticket_id}", headers=auth(token))
    assert res.status_code == 200
    assert len(res.json()["messages"]) == 1


def test_unknown_ticket_is_404(client):
    token = register(client, "a@example.com")["access_token"]
    assert client.get("/api/tickets/9999", headers=auth(token)).status_code == 404


# --- Cross-customer isolation (mandatory) -------------------------------------


def test_other_customers_ticket_is_invisible(client):
    alice = register(client, "alice@example.com")["access_token"]
    bob = register(client, "bob@example.com")["access_token"]
    alice_ticket = submit(client, alice).json()["id"]

    # Bob cannot read it — 404 (existence not leaked), never 403/200
    assert client.get(f"/api/tickets/{alice_ticket}", headers=auth(bob)).status_code == 404
    # Bob cannot append messages to it
    res = client.post(
        f"/api/tickets/{alice_ticket}/messages",
        headers=auth(bob),
        json={"content": "let me in"},
    )
    assert res.status_code == 404
    # And it never shows up in Bob's list
    assert client.get("/api/tickets", headers=auth(bob)).json() == []
    # Alice unaffected: still exactly 1 message
    detail = client.get(f"/api/tickets/{alice_ticket}", headers=auth(alice)).json()
    assert len(detail["messages"]) == 1


# --- Follow-ups ---------------------------------------------------------------


def test_owner_can_add_followup_message(client):
    token = register(client, "a@example.com")["access_token"]
    ticket_id = submit(client, token).json()["id"]

    res = client.post(
        f"/api/tickets/{ticket_id}/messages",
        headers=auth(token),
        json={"content": "Any update on this?"},
    )
    assert res.status_code == 201

    detail = client.get(f"/api/tickets/{ticket_id}", headers=auth(token)).json()
    contents = [m["content"] for m in detail["messages"]]
    assert contents == ["It is literally on fire", "Any update on this?"]


def test_followup_rejects_empty_content(client):
    token = register(client, "a@example.com")["access_token"]
    ticket_id = submit(client, token).json()["id"]
    res = client.post(
        f"/api/tickets/{ticket_id}/messages",
        headers=auth(token),
        json={"content": ""},
    )
    assert res.status_code == 422
