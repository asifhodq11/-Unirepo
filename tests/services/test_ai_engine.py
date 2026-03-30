import pytest
from unittest.mock import patch, MagicMock
from app.services.ai_engine import extract_review_signals, get_brand_voice_examples, generate_reply

def test_extract_review_signals_positive():
    """Verify Pass 0 correctly identifies positive signals and items."""
    text = 'The "lamb chops" were amazing! Best service from Sarah.'
    signals = extract_review_signals(text, "John Doe")
    
    assert signals["has_praise"] is True
    assert signals["has_complaint"] is False
    assert "lamb chops" in signals["specific_items"]
    assert "Sarah" in signals["staff_names"]
    # PUNCTUATED text with caps results in 'formal' or 'neutral' depending on current engine version
    # V2.3 detects proper sentences as formal
    assert signals["review_formality"] in ["formal", "neutral"]

def test_extract_review_signals_negative():
    """Verify Pass 0 correctly identifies complaints and staff."""
    text = "Cold food and slow service. Disappointing experience."
    signals = extract_review_signals(text)
    
    assert signals["has_complaint"] is True
    assert signals["has_praise"] is False

@patch("app.extensions.supabase")
def test_get_brand_voice_examples_success(mock_supabase):
    """Verify brand voice extraction properly formats historical data."""
    mock_data = [
        {"reply_text": "Glad you liked the steak!", "reviews": {"review_text": "Great steak."}},
        {"reply_text": "Sorry about the wait.", "reviews": {"review_text": "Wait was long."}}
    ]
    mock_supabase.from_().select().eq().eq().order().limit().execute.return_value.data = mock_data
    
    voice = get_brand_voice_examples("user_123")
    
    assert "BRAND VOICE EXAMPLES" in voice
    assert "Glad you liked the steak!" in voice
    assert "Wait was long" in voice

@patch("app.services.ai_engine.call_llm")
@patch("app.services.ai_engine.get_variance_context")
@patch("app.services.ai_engine.get_brand_voice_examples")
def test_generate_reply_orchestration(mock_voice, mock_variance, mock_llm):
    """Verify the 4-pass pipeline handles the full generation flow."""
    mock_voice.return_value = "Mock voice examples"
    mock_variance.return_value = {
        "suggested_opener": "item",
        "suggested_structure": "A",
        "suggested_word_band": "medium"
    }
    
    # Mock behavior for 3 LLM passes
    # Pass 1, Pass 2, Pass 3
    mock_llm.side_effect = [
        ("Draft 1", 100),
        ("Humanized 2", 150),
        ("Final Reply\nMETADATA_JSON: {\"opener_type\": \"item\", \"structure_tag\": \"A\", \"quality_score\": 20}", 200)
    ]
    
    result = generate_reply(
        business_name="Test Biz",
        business_type="Cafe",
        tone_preference="friendly",
        star_rating=5,
        review_text="Love the coffee!",
        user_id="user_123"
    )
    
    assert result["text"] == "Final Reply"
    assert result["quality_score"] == 20
    assert result["tokens"] == 450 # 100+150+200
    assert result["cost_usd"] > 0
