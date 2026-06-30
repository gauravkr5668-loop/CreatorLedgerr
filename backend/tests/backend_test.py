"""CreatorLedger backend e2e API tests.

Tests:
- Auth: login (demo), google demo, register (new), me, refresh, logout, invalid creds
- Dashboard summary
- Campaigns: list, create, delete
- Invoices: list, filter (status/severity/q), get-by-id, patch, approve/reject
- Reconciliation: rerun
- Settings: get, patch
- Insights: list (with and without LLM)
- Export: CSV with status filter
- Global search
"""
import os
import time
import uuid

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fall back to reading frontend/.env directly
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@creatorledger.com"
DEMO_PASSWORD = "demo1234"


# --------- Fixtures ---------
@pytest.fixture(scope="session")
def demo_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Demo login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def new_user_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(
        f"{API}/auth/register",
        json={"email": email, "password": "Strong#Pass123", "name": "Test User"},
        timeout=60,
    )
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    s._email = email  # type: ignore
    return s


# --------- Auth ---------
class TestAuth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_demo_login(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == DEMO_EMAIL
        assert "id" in data
        # httpOnly cookies should be set
        assert "access_token" in s.cookies or any(c.name == "access_token" for c in s.cookies)

    def test_invalid_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_google_demo_login(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/google", timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["email"] == DEMO_EMAIL

    def test_me(self, demo_client):
        r = demo_client.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_refresh(self, demo_client):
        r = demo_client.post(f"{API}/auth/refresh", timeout=15)
        assert r.status_code == 200

    def test_register_new_user_seeds_data(self, new_user_client):
        # /me should return the new user
        r = new_user_client.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == new_user_client._email.lower()  # type: ignore

        # New user should have seeded campaigns + invoices
        r2 = new_user_client.get(f"{API}/campaigns", timeout=30)
        assert r2.status_code == 200
        assert len(r2.json()) > 0, "New user should have seeded campaigns"
        r3 = new_user_client.get(f"{API}/invoices", timeout=30)
        assert r3.status_code == 200
        assert len(r3.json()) > 0, "New user should have seeded invoices"

    def test_logout(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=15)
        r = s.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200

    def test_unauthenticated_blocked(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401


# --------- Dashboard ---------
class TestDashboard:
    def test_summary_non_zero(self, demo_client):
        r = demo_client.get(f"{API}/dashboard/summary", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["invoices_uploaded", "creators_processed", "total_campaign_value",
                  "flagged_issues", "approved_payouts", "pending_review", "campaigns_count"]:
            assert k in d, f"Missing key {k}"
        assert d["invoices_uploaded"] > 0
        assert d["creators_processed"] > 0
        assert d["campaigns_count"] > 0


# --------- Campaigns ---------
class TestCampaigns:
    def test_list_campaigns(self, demo_client):
        r = demo_client.get(f"{API}/campaigns", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) > 0

    def test_create_and_delete_campaign(self, demo_client):
        payload = {
            "creator_name": "TEST_Creator_X",
            "campaign_name": "TEST_Campaign_X",
            "agreed_fee": 50000,
            "deliverables": "1 reel",
            "status": "active",
        }
        r = demo_client.post(f"{API}/campaigns", json=payload, timeout=60)
        assert r.status_code == 200
        created = r.json()
        assert created["creator_name"] == "TEST_Creator_X"
        assert created["agreed_fee"] == 50000
        cid = created["id"]

        # verify GET sees it
        r2 = demo_client.get(f"{API}/campaigns", timeout=30)
        ids = [c["id"] for c in r2.json()]
        assert cid in ids

        # delete
        rd = demo_client.delete(f"{API}/campaigns/{cid}", timeout=60)
        assert rd.status_code == 200
        r3 = demo_client.get(f"{API}/campaigns", timeout=30)
        assert cid not in [c["id"] for c in r3.json()]


# --------- Invoices ---------
class TestInvoices:
    def test_list_invoices(self, demo_client):
        r = demo_client.get(f"{API}/invoices", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) > 0
        TestInvoices.sample_id = rows[0]["id"]
        TestInvoices.sample_creator = rows[0].get("creator_name", "")

    def test_search_invoices(self, demo_client):
        # Pick a creator name from list
        r = demo_client.get(f"{API}/invoices", timeout=30)
        creator = next((row["creator_name"] for row in r.json() if row.get("creator_name")), None)
        assert creator
        r2 = demo_client.get(f"{API}/invoices", params={"q": creator[:4]}, timeout=30)
        assert r2.status_code == 200
        rows = r2.json()
        assert len(rows) > 0
        assert all(creator[:4].lower() in (row.get("creator_name") or "").lower() or
                   creator[:4].lower() in (row.get("invoice_number") or "").lower() or
                   creator[:4].lower() in (row.get("campaign_reference") or "").lower()
                   for row in rows[:5])

    def test_filter_by_severity_critical(self, demo_client):
        r = demo_client.get(f"{API}/invoices", params={"severity": "critical"}, timeout=30)
        assert r.status_code == 200
        for inv in r.json():
            severities = [d.get("severity") for d in inv.get("discrepancies", [])]
            assert "critical" in severities

    def test_get_invoice_by_id(self, demo_client):
        r = demo_client.get(f"{API}/invoices", timeout=30)
        invoice_id = r.json()[0]["id"]
        r2 = demo_client.get(f"{API}/invoices/{invoice_id}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["id"] == invoice_id

    def test_patch_invoice_persists(self, demo_client):
        r = demo_client.get(f"{API}/invoices", timeout=30)
        invoice_id = r.json()[0]["id"]
        new_notes = f"TEST_NOTES_{uuid.uuid4().hex[:6]}"
        r2 = demo_client.patch(f"{API}/invoices/{invoice_id}", json={"invoice_notes": new_notes}, timeout=30)
        assert r2.status_code == 200
        assert r2.json()["invoice_notes"] == new_notes
        # verify via GET
        r3 = demo_client.get(f"{API}/invoices/{invoice_id}", timeout=15)
        assert r3.json()["invoice_notes"] == new_notes

    def test_approve_and_reject(self, demo_client):
        r = demo_client.get(f"{API}/invoices", timeout=30)
        rows = r.json()
        # use 2 different invoices
        inv_a = rows[0]["id"]
        inv_r = rows[1]["id"]

        ra = demo_client.post(f"{API}/invoices/{inv_a}/approve", timeout=30)
        assert ra.status_code == 200
        assert ra.json()["status"] == "approved"

        rj = demo_client.post(f"{API}/invoices/{inv_r}/reject", timeout=30)
        assert rj.status_code == 200
        assert rj.json()["status"] == "rejected"


# --------- Reconciliation ---------
class TestReconciliation:
    def test_rerun(self, demo_client):
        r = demo_client.post(f"{API}/reconciliation/run", params={"use_llm": "false"}, timeout=60)
        assert r.status_code == 200


# --------- Settings ---------
class TestSettings:
    def test_get_settings(self, demo_client):
        r = demo_client.get(f"{API}/settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["gst_rate", "tds_rate", "agency_commission_pct", "platform_fee_pct"]:
            assert k in d

    def test_patch_settings(self, demo_client):
        r = demo_client.patch(
            f"{API}/settings",
            json={"gst_rate": 18.5, "tds_rate": 9.5, "agency_commission_pct": 12.0, "platform_fee_pct": 3.0},
            timeout=15,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["gst_rate"] == 18.5
        assert d["tds_rate"] == 9.5
        # restore
        demo_client.patch(
            f"{API}/settings",
            json={"gst_rate": 18.0, "tds_rate": 10.0, "agency_commission_pct": 10.0, "platform_fee_pct": 2.0},
            timeout=15,
        )


# --------- Insights ---------
class TestInsights:
    def test_insights_list(self, demo_client):
        r = demo_client.get(f"{API}/insights", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "insights" in d
        assert isinstance(d["insights"], list)
        assert len(d["insights"]) > 0


# --------- Export ---------
class TestExport:
    def test_export_csv_approved(self, demo_client):
        r = demo_client.get(f"{API}/export/payouts.csv", params={"status": "approved"}, timeout=60)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        # header row present
        first_line = r.text.splitlines()[0]
        assert "Invoice Number" in first_line
        assert "Net Payable" in first_line

    def test_export_csv_all(self, demo_client):
        r = demo_client.get(f"{API}/export/payouts.csv", params={"status": "all"}, timeout=60)
        assert r.status_code == 200
        lines = r.text.splitlines()
        assert len(lines) > 1


# --------- Search ---------
class TestSearch:
    def test_search(self, demo_client):
        r = demo_client.get(f"{API}/invoices", timeout=30)
        creator = next((row["creator_name"] for row in r.json() if row.get("creator_name")), "a")
        r2 = demo_client.get(f"{API}/search", params={"q": creator[:3]}, timeout=15)
        assert r2.status_code == 200
        d = r2.json()
        assert "creators" in d and "campaigns" in d and "invoices" in d
