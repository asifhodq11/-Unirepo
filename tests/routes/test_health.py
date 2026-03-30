import pytest
from unittest.mock import patch, MagicMock
from app import create_app

@pytest.fixture
def app():
    app = create_app("testing")
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@patch("app.routes.health.supabase")
def test_health_endpoint_success(mock_supabase, client):
    """Verify health endpoint returns 200 and healthy status when DB is up."""
    mock_supabase.table().select().limit().execute.return_value = MagicMock()
    
    response = client.get("/api/v1/health")
    data = response.get_json()
    
    assert response.status_code == 200
    assert data["status"] == "healthy"
    assert data["checks"]["database"]["status"] == "ok"

@patch("app.routes.health.supabase")
def test_health_endpoint_db_failure(mock_supabase, client):
    """Verify health endpoint accurately reflects database connection errors."""
    mock_supabase.table().select().limit().execute.side_effect = Exception("DB Down")
    
    response = client.get("/api/v1/health")
    data = response.get_json()
    
    assert response.status_code == 200 # Monitoring should still get a 200 but check the JSON
    assert data["checks"]["database"]["status"] == "error"
