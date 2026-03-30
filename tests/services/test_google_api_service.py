import os
# Set dummy env vars BEFORE any app imports
os.environ['SECRET_KEY'] = 'test-secret'
os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake'
os.environ['SUPABASE_ANON_KEY'] = FAKE_JWT
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = FAKE_JWT
os.environ['GOOGLE_CLIENT_ID'] = 'test-id'
os.environ['GOOGLE_CLIENT_SECRET'] = 'test-secret'
os.environ['GOOGLE_MASTER_REFRESH_TOKEN'] = 'test-token'

import pytest
from unittest.mock import patch, MagicMock
from app.services.google_api_service import fetch_recent_reviews

@patch('app.services.google_api_service.requests.get')
def test_fetch_recent_reviews_pagination(mock_get):
    """
    Verifies that fetch_recent_reviews correctly handles multiple pages 
    using the nextPageToken.
    """
    # 1. Setup mock responses for 2 pages
    page1_data = {
        "reviews": [{"name": "rev1", "comment": "good"}],
        "nextPageToken": "token_for_page_2"
    }
    page2_data = {
        "reviews": [{"name": "rev2", "comment": "bad"}]
        # No nextPageToken on page 2
    }
    
    # Configure mock_get to return these in sequence
    mock_resp1 = MagicMock()
    mock_resp1.status_code = 200
    mock_resp1.json.return_value = page1_data
    
    mock_resp2 = MagicMock()
    mock_resp2.status_code = 200
    mock_resp2.json.return_value = page2_data
    
    mock_get.side_effect = [mock_resp1, mock_resp2]

    # 2. Call the function
    results = fetch_recent_reviews("loc_123", "fake_token", max_pages=5)

    # 3. Assertions
    assert len(results) == 2
    assert results[0]["name"] == "rev1"
    assert results[1]["name"] == "rev2"
    
    # Verify mock_get was called twice with correct params
    assert mock_get.call_count == 2
    
    # Check that second call included pageToken
    second_call_params = mock_get.call_args_list[1][1]['params']
    assert second_call_params['pageToken'] == "token_for_page_2"


@patch('app.services.google_api_service.requests.get')
def test_fetch_recent_reviews_max_pages_limit(mock_get):
    """
    Verifies that fetch_recent_reviews respects the max_pages safety cap.
    """
    # Setup mock to always return a nextPageToken
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "reviews": [{"name": "rev"}],
        "nextPageToken": "infinite_token"
    }
    mock_get.return_value = mock_resp

    # Call with max_pages=2
    results = fetch_recent_reviews("loc_123", "fake_token", max_pages=2)

    # Should only have 2 reviews (2 pages)
    assert len(results) == 2
    assert mock_get.call_count == 2
