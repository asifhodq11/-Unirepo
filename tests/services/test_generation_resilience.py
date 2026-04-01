"""
tests/services/test_generation_resilience.py

Final Decontamination Sweep.
Verifies the 'Resilient Persistence' (v2.3) and 'Generation Service' logic.
"""

import pytest
from unittest.mock import patch, MagicMock
from app.services.generation_service import process_single_generation

@pytest.fixture
def mock_user():
    return {
        "id": "user_123",
        "business_name": "Resilient Cafe",
        "business_type": "Cafe",
        "tone_preference": "friendly",
        "plan": "pro"
    }

@patch("app.services.generation_service.insert_reply")
@patch("app.services.generation_service.generate_reply")
@patch("app.services.generation_service.update_review_status")
@patch("app.services.generation_service.increment_usage")
def test_resilient_generation_success(mock_inc, mock_status, mock_ai, mock_insert, mock_user):
    """Verify standard generation correctly maps v2.3 metadata."""
    mock_ai.return_value = {
        "text": "Great coffee!",
        "tokens": 450,
        "model_used": "gpt-4o",
        "cost_usd": 0.002,
        "quality_score": 22,
        "opener_type": "item",
        "structure_tag": "A"
    }
    mock_insert.return_value = {"id": "reply_789"}

    result = process_single_generation(
        user=mock_user,
        review_id="rev_456",
        rating=5,
        text="Loved the latte",
        name="John"
    )

    # Use args list for robust positional checking
    args, kwargs = mock_insert.call_args
    called_data = args[1] if len(args) > 1 else kwargs.get("reply_data")
    
    assert called_data["quality_score"] == 22
    assert called_data["cost_usd"] == 0.002
    assert result["id"] == "reply_789"

@patch("app.models.reply_model.supabase")
def test_reply_model_resilience_fallback(mock_supabase):
    """
    CRITICAL RESILIENCE TEST:
    Verify that if 'cost_usd' column is missing in DB (desync),
    the model retries with a minimalist payload.
    """
    from app.models.reply_model import insert_reply
    
    # Mocking first call failing (exception or error result)
    mock_supabase.table().insert().execute.side_effect = [
        Exception("column cost_usd does not exist"),
        MagicMock(data=[{"id": "fallback_id"}])
    ]

    payload = {
        "review_id": "rev_1",
        "reply_text": "Safe text",
        "cost_usd": 0.05,
        "quality_score": 20
    }

    result = insert_reply("user_1", payload)

    assert result["id"] == "fallback_id"
    # Verify second call was minimalist (last call)
    fallback_payload = mock_supabase.table().insert.call_args_list[-1][0][0]
    assert "cost_usd" not in fallback_payload
    assert "quality_score" not in fallback_payload
