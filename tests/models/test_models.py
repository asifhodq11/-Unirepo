import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_supabase():
    with patch("app.models.review_model.supabase") as mock_rev_sb, \
         patch("app.models.user_model.supabase") as mock_user_sb:
        yield {"reviews": mock_rev_sb, "users": mock_user_sb}

def test_insert_review_fallback_logic(mock_supabase):
    """Verify fallback fetch when insert returns no content (PGRST204 simulation)."""
    from app.models.review_model import insert_review
    
    # 1. Insert returns empty data
    mock_supabase["reviews"].table().insert().execute.return_value = MagicMock(data=[])
    # 2. Fallback fetch returns data
    mock_supabase["reviews"].table().select().eq().eq().maybe_single().execute.return_value = MagicMock(data={"id": "rev_fallback"})
    
    result = insert_review("user_123", {"google_review_id": "g123"})
    assert result["id"] == "rev_fallback"

def test_insert_review_exception_handling(mock_supabase):
    """Verify insert_review handles exceptions gracefully."""
    from app.models.review_model import insert_review
    
    # Raise a real error (not PGRST204)
    mock_supabase["reviews"].table().insert().execute.side_effect = Exception("DB DEAD")
    
    result = insert_review("user_123", {"google_review_id": "g123"})
    assert result is None

def test_get_review_by_id_failure(mock_supabase):
    """Verify get_review_by_id handles exceptions."""
    from app.models.review_model import get_review_by_id
    
    mock_supabase["reviews"].table().select().eq().eq().eq().execute.side_effect = Exception("Fail")
    
    result = get_review_by_id("user_123", "rev_123")
    assert result is None

def test_update_review_status_failure(mock_supabase):
    """Verify update_review_status handles exceptions."""
    from app.models.review_model import update_review_status
    
    mock_supabase["reviews"].table().update().eq().eq().execute.side_effect = Exception("Fail")
    
    result = update_review_status("user_123", "rev_123", "completed")
    assert result is False

def test_get_user_by_id_exception(mock_supabase):
    """Verify get_user_by_id handles exceptions."""
    from app.models.user_model import get_user_by_id
    
    mock_supabase["users"].table().select().eq().eq().maybe_single().execute.side_effect = Exception("Fail")
    
    result = get_user_by_id("user_123")
    assert result is None
