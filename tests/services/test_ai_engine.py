"""
tests/services/test_ai_engine.py

Expert Structural Regression Suite.
Verifies the modular 4-pass AI architecture and Intelligence v2.3 logic.
"""

import pytest
from unittest.mock import patch, MagicMock
from app.services.ai_engine import generate_reply
from app.services.ai.analyzer import extract_review_signals

def test_extract_review_signals_positive():
    """Verify Pass 0 correctly identifies positive signals."""
    text = 'The "lamb chops" were amazing! Best service from Sarah.'
    signals = extract_review_signals(text, "John Doe")
    assert signals["has_praise"] is True
    assert "lamb chops" in signals["specific_items"]

@patch("app.services.ai.variance.supabase")
def test_get_brand_voice_examples_success(mock_supabase):
    """Verify brand voice extraction properly formats historical data."""
    from app.services.ai.variance import get_brand_voice_examples
    mock_data = [
        {"reply_text": "Glad you liked the steak!", "reviews": {"review_text": "Great steak."}}
    ]
    # Correcting the mock chain for Supabase filter logic
    mock_supabase.from_().select().eq().eq().order().limit().execute.return_value.data = mock_data
    
    voice = get_brand_voice_examples("user_123")
    assert "Glad you liked the steak!" in voice

@patch("app.services.ai.caller.get_gemini_client")
@patch("app.services.ai_engine.get_variance_context")
@patch("app.services.ai_engine.get_brand_voice_examples")
def test_generate_reply_orchestration(mock_voice, mock_variance, mock_gemini):
    """Verify the 4-pass pipeline handles the full generation flow."""
    mock_voice.return_value = "Mock voice examples"
    mock_variance.return_value = {"suggested_opener": "item", "suggested_structure": "A", "suggested_word_band": "medium"}
    
    # Mock behavior for Gemini 
    mock_client = MagicMock()
    mock_gemini.return_value = mock_client
    
    # Pass 1, 2, 3
    mock_res1 = MagicMock()
    mock_res1.text = "Draft 1"
    mock_res1.usage_metadata.total_token_count = 100
    
    mock_res2 = MagicMock()
    mock_res2.text = "Humanized 2"
    mock_res2.usage_metadata.total_token_count = 150
    
    mock_res3 = MagicMock()
    mock_res3.text = "Final Reply\nMETADATA_JSON: {\"opener_type\": \"item\", \"structure_tag\": \"A\", \"quality_score\": 20}"
    mock_res3.usage_metadata.total_token_count = 200
    
    mock_client.models.generate_content.side_effect = [mock_res1, mock_res2, mock_res3]
    
    result = generate_reply(
        business_name="Test Biz", business_type="Cafe", 
        tone_preference="friendly", star_rating=5, 
        review_text="Love the coffee!", user_id="user_123"
    )
    
    assert result["text"] == "Final Reply"
    assert result.get("quality_score") == 20
    assert result["tokens"] == 450
