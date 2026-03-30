import pytest
from unittest.mock import patch, MagicMock
from app import create_app

@pytest.fixture()
def app():
    application = create_app("testing")
    application.config["TESTING"] = True
    yield application

@pytest.fixture()
def client(app):
    return app.test_client()

def test_capture_lead_success(client):
    """Verify unauthenticated lead capture works."""
    with patch("app.routes.analytics.supabase") as mock_sb:
        mock_sb.table.return_value = mock_sb
        mock_sb.upsert.return_value = mock_sb
        mock_sb.execute.return_value = MagicMock()
        
        response = client.post("/api/v1/analytics/lead", json={"email": "lead@test.com"})
        
    assert response.status_code == 201
    assert response.get_json()["status"] == "captured"

def test_dashboard_overview_populated(client, mock_auth):
    """Verify 14-day aggregation logic for dashboard charts."""
    from datetime import datetime, timezone, timedelta
    mock_data = [
        {"rating": 5, "status": "replied", "created_at": datetime.now(timezone.utc).isoformat()},
        {"rating": 4, "status": "pending", "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
    ]
    
    with patch("app.routes.analytics.supabase") as mock_sb:
        mock_sb.from_.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.neq.return_value = mock_sb
        mock_sb.order.return_value = mock_sb
        mock_sb.execute.return_value = MagicMock(data=mock_data)
        
        client.set_cookie("session_token", "fake")
        response = client.get("/api/v1/analytics/overview")
        
    assert response.status_code == 200
    data = response.get_json()
    assert data["total_reviews"] == 2
    assert data["avg_rating"] == 4.5

def test_handle_inbound_email_unregistered(client):
    """Verify inbound email intercept loop ignores unknown senders."""
    with patch("app.routes.webhooks.supabase") as mock_sb:
        mock_sb.table.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.maybe_single.return_value = mock_sb
        mock_sb.execute.return_value = MagicMock(data=None)
        
        payload = {"sender": "stranger@test.com", "text_body": "Nice place!"}
        response = client.post("/api/v1/webhooks/inbound-email", json=payload)
        
    assert response.status_code == 200
    assert response.get_json()["reason"] == "unregistered_sender"

@patch("app.routes.webhooks.generate_reply")
@patch("app.routes.webhooks.send_ai_reply_alert")
def test_handle_inbound_email_success(mock_email, mock_gen, client):
    """Verify full success path for inbound email intercept loop."""
    mock_user = {
        "id": "u1", "email": "pro@test.com", 
        "business_name": "Pro Biz", "tone_preference": "professional"
    }
    mock_gen.return_value = "AI Generated Response"
    
    with patch("app.routes.webhooks.supabase") as mock_sb, \
         patch("app.routes.webhooks.insert_review") as mock_ir, \
         patch("app.routes.webhooks.insert_reply") as mock_ip, \
         patch("app.routes.webhooks.increment_usage"):
        
        mock_sb.table.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.maybe_single.return_value = mock_sb
        mock_sb.execute.return_value = MagicMock(data=mock_user)
        
        mock_sb.update.return_value = mock_sb
        mock_ir.return_value = {"id": "rev1"}
        
        payload = {"sender": "pro@test.com", "text_body": "Great service!"}
        response = client.post("/api/v1/webhooks/inbound-email", json=payload)
        
    assert response.status_code == 200
    assert response.get_json()["status"] == "success"
