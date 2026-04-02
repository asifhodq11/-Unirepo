import pytest
import flask
import time
from unittest.mock import patch, MagicMock
from app import create_app

@pytest.fixture
def app():
    # Use testing config
    return create_app("testing")

@pytest.fixture
def client(app):
    return app.test_client()

# Global patches to avoid boilerplate and infra dependencies (Redis, Supabase)
@pytest.fixture(autouse=True)
def global_mocks():
    with patch("app.extensions.limiter.limit", lambda x: lambda y: y), \
         patch("app.extensions.supabase") as mock_ext_sb, \
         patch("app.utils.decorators.supabase") as mock_dec_sb, \
         patch("app.utils.decorators.get_user_by_id") as mock_get_user:
        
        # 1. Mock auth to always succeed
        mock_user_resp = MagicMock()
        mock_user_resp.user = MagicMock(id="user_123")
        mock_dec_sb.auth.get_user.return_value = mock_user_resp
        mock_get_user.return_value = {
            "id": "user_123", 
            "plan": "free",
            "business_name": "Test Biz",
            "business_type": "Restaurant",
            "reply_count_this_month": 0
        }

        # 2. Setup universal Supabase mock behavior to prevent TypeErrors (MagicMock vs int)
        mock_exec = MagicMock()
        mock_exec.data = [] # Default to empty list for collection safety
        mock_exec.count = 0
        
        # Chain mocks: sb.from().select().eq().single().execute() -> mock_exec
        # Note: .single() returns a dict, .execute() returns the wrapper
        mock_single_exec = MagicMock()
        mock_single_exec.data = {"plan": "free", "reply_count_this_month": 0, "id": "user_123"}
        mock_single_exec.count = 1

        mock_ext_sb.from_.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_single_exec
        mock_ext_sb.from_.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_exec
        mock_ext_sb.from_.return_value.select.return_value.eq.return_value.execute.return_value = mock_exec
        mock_ext_sb.rpc.return_value.execute.return_value = MagicMock(data=True) # RPC succeeds by default
        
        yield

@patch("app.routes.reviews.check_usage_limit", lambda x: None)
@patch("app.routes.reviews.update_review_status")
@patch("app.routes.reviews.insert_review")
@patch("app.routes.reviews.process_single_generation")
def test_generate_single_success(mock_gen, mock_ins_rev, mock_upd_rev, client):
    """Verify standard /generate flow with AI integration and usage increment."""
    payload = {
        "rating": 5, 
        "review_text": "Great service!",
        "reviewer_name": "Alice",
        "google_review_id": "google_abc"
    }
    
    # Setup return values
    mock_ins_rev.return_value = {"id": "rev_123", "rating": 5}
    mock_gen.return_value = {
        "text": "Thank you Alice!", 
        "tokens": 42, 
        "cost_usd": 0.0001,
        "quality_score": 95,
        "model_used": "gpt-4o"
    }

    client.set_cookie("session_token", "fake-token")
    response = client.post("/api/v1/reviews/generate", json=payload)

    assert response.status_code == 201
    mock_gen.assert_called_once()
    mock_ins_rev.assert_called_once()

@patch("app.routes.reviews.supabase")
@patch("app.routes.reviews.reserve_bulk_usage")
@patch("app.routes.reviews.process_single_generation")
def test_bulk_generate_atomic_safety(mock_gen, mock_reserve, mock_supabase, client):
    """Verify bulk generation enforces credit reservation and iterates correctly."""
    payload = {"review_ids": ["rev1", "rev2"]}
    
    # Mock individual review fetches inside the loop
    mock_exec = MagicMock()
    mock_exec.data = {"id": "revX", "rating": 4, "review_text": "Good", "status": "pending"}
    mock_supabase.from_().select().eq().eq().single().execute.return_value = mock_exec
    
    mock_gen.return_value = {"text": "Bulk Reply", "tokens": 20, "cost_usd": 0.00002}

    client.set_cookie("session_token", "fake-token")
    response = client.post("/api/v1/reviews/bulk-generate", json=payload)

    assert response.status_code == 200
    assert mock_reserve.call_count == 1
    assert mock_gen.call_count == 2
    assert len(response.get_json()["results"]) == 2

def test_history_pagination(client, mock_auth):
    """GET /history should return correctly shaped paginated results."""
    # Mocks for count and results
    # Each execute() call must return an object with BOTH data and count
    # to avoid Serializability and Comparison TypeErrors.
    mock_count_resp = MagicMock(count=25, data=[])
    mock_data_resp = MagicMock(count=25, data=[{"id": "r1", "replies": []}])
    
    with patch("app.routes.reviews.supabase") as mock_sb:
        # Handle both .from_() and .table()
        mock_sb.from_.return_value = mock_sb
        mock_sb.table.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.order.return_value = mock_sb
        mock_sb.range.return_value = mock_sb
        
        # history now calls execute() once with count="exact"
        mock_sb.execute.return_value = mock_data_resp

        client.set_cookie("session_token", "fake-token")
        # test strict_slashes=False (url without trailing slash)
        response = client.get("/api/v1/reviews/history?page=2&per_page=1")
        
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["total"] == 25
    assert len(json_data["items"]) == 1
    assert json_data["has_more"] is True

# ──────────────────────────────────────────────────────────────
# NEW Tests for Coverage Expansion
# ──────────────────────────────────────────────────────────────

@patch("app.routes.reviews.supabase")
@patch("app.routes.reviews.reserve_bulk_usage")
@patch("app.routes.reviews.process_single_generation")
def test_bulk_generate_partial_failure(mock_gen, mock_reserve, mock_supabase, client):
    """Verify bulk generate handles individual failures gracefully without crashing the batch."""
    payload = {"review_ids": ["rev_success", "rev_fail"]}
    
    # Success return then failure
    mock_gen.side_effect = [
        {"text": "Success!", "tokens": 10, "cost_usd": 0.0001},
        Exception("AI CRASHED")
    ]
    
    mock_exec = MagicMock()
    mock_exec.data = {"id": "rev", "rating": 5, "review_text": "Text", "status": "pending"}
    mock_supabase.from_().select().eq().eq().single().execute.return_value = mock_exec
    
    client.set_cookie("session_token", "fake-token")
    response = client.post("/api/v1/reviews/bulk-generate", json=payload)
    
    assert response.status_code == 200
    results = response.get_json()["results"]
    assert len(results) == 2
    assert results[0]["status"] == "success"
    assert results[1]["status"] == "failed"

def test_history_pagination_edge_cases(client):
    """Verify history pagination handles invalid parameters by falling back to defaults."""
    with patch("app.routes.reviews.supabase") as mock_sb:
        mock_sb.from_.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.order.return_value = mock_sb
        mock_sb.range.return_value = mock_sb

        # Ensure every execute return has valid types
        mock_resp = MagicMock(data=[], count=0)
        mock_sb.execute.return_value = mock_resp
        
        client.set_cookie("session_token", "fake-token")
        # Test with negative page and zero limit
        response = client.get("/api/v1/reviews/history?page=-5&limit=0")
        assert response.status_code == 200
        
        # Test with huge page size
        response = client.get("/api/v1/reviews/history?limit=1000")
        assert response.status_code == 200

@patch("app.routes.reviews.supabase")
def test_activity_feed_success(mock_supabase, client):
    """Verify activity feed aggregates reviews correctly."""
    mock_data = [
        {"id": "r1", "rating": 5, "reviewer_name": "Alice", "status": "replied", "created_at": "2024-01-01", "replies": [{"id": "rep1"}]},
        {"id": "r2", "rating": 3, "reviewer_name": None, "status": "pending", "created_at": "2024-01-02", "replies": []}
    ]
    mock_supabase.from_().select().eq().eq().order().limit().execute.return_value = MagicMock(data=mock_data)
    
    client.set_cookie("session_token", "fake-token")
    response = client.get("/api/v1/reviews/activity")
    
    assert response.status_code == 200
    events = response.get_json()["events"]
    assert len(events) == 2
    assert events[0]["type"] == "reply_sent" # Based on 'replied' status
    assert events[1]["type"] == "review_found" # Based on empty 'replies'

@patch("app.routes.reviews.supabase")
def test_activity_feed_error(mock_supabase, client):
    """Verify activity feed handles exceptions."""
    mock_supabase.from_().select().eq().eq().order().limit().execute.side_effect = Exception("Crash")
    
    client.set_cookie("session_token", "fake-token")
    response = client.get("/api/v1/reviews/activity")
    
    assert response.status_code == 500
    assert response.get_json()["code"] == "SERVER_ERROR"

@patch("app.models.reply_model.update_reply")
@patch("app.routes.reviews.update_review_status")
def test_confirm_and_send_success(mock_upd_rev, mock_upd_rep, client):
    """Verify reply confirmation updates both reply and review status."""
    mock_upd_rep.return_value = {"id": "rep1", "status": "sent"}
    
    payload = {"reply_id": "rep1", "reply_text": "Updated text"}
    client.set_cookie("session_token", "fake-token")
    response = client.post("/api/v1/reviews/r123/send", json=payload)
    
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    mock_upd_rep.assert_called_once()
    mock_upd_rev.assert_called_once_with("user_123", "r123", "replied")

@patch("app.models.reply_model.update_reply", return_value=None)
def test_confirm_and_send_not_found(mock_upd_rep, client):
    """Verify reply confirmation returns 404 if draft missing."""
    payload = {"reply_id": "missing", "reply_text": "irrelevant"}
    client.set_cookie("session_token", "fake-token")
    response = client.post("/api/v1/reviews/r123/send", json=payload)
    
    assert response.status_code == 404
