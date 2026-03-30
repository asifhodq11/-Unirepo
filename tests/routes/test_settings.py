import pytest
from unittest.mock import patch, MagicMock
from app import create_app

@pytest.fixture
def app():
    return create_app("testing")

@pytest.fixture
def client(app):
    return app.test_client()

def test_get_settings(client, mock_auth):
    """Verify settings retrieval returns correctly mapped user preferences."""
    with patch("app.routes.settings.supabase") as mock_sb:
        mock_sb.from_.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.single.return_value = mock_sb
        
        mock_res = MagicMock()
        mock_res.data = {
            "tone_preference": "professional",
            "business_name": "Test Salon",
            "plan": "free"
        }
        mock_sb.execute.return_value = mock_res
        
        client.set_cookie("session_token", "fake-token")
        response = client.get("/api/v1/settings/")
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["tone_preference"] == "professional"

def test_update_settings(client, mock_auth):
    """PATCH /api/v1/settings/ should update the user fields."""
    payload = {"tone_preference": "professional"}
    
    with patch("app.routes.settings.supabase") as mock_sb:
        mock_sb.from_.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.update.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.single.return_value = mock_sb
        
        # 1. update call, 2. _fetch_settings call
        mock_sb.execute.side_effect = [
            MagicMock(data=None),
            MagicMock(data={"tone_preference": "professional", "plan": "free"})
        ]

        client.set_cookie("session_token", "fake-token")
        response = client.patch("/api/v1/settings/", json=payload)
        
    assert response.status_code == 200
    data = response.get_json()
    assert data["tone_preference"] == "professional"
