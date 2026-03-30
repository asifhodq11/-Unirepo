import pytest
from unittest.mock import patch, MagicMock

def test_call_llm_rate_limit_retry():
    """Verify call_llm retries on RateLimitError."""
    import openai
    from app.services.ai_engine import call_llm
    
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Success"))]
    mock_response.usage = MagicMock(total_tokens=10)
    
    mock_client.chat.completions.create.side_effect = [
        openai.RateLimitError("Rate limit", response=MagicMock(), body={}),
        openai.RateLimitError("Rate limit", response=MagicMock(), body={}),
        mock_response
    ]
    
    with patch("app.services.ai_engine.get_openai_client", return_value=mock_client), \
         patch("time.sleep"):
        content, tokens = call_llm("test", "test", model_id="gpt-4o-mini")
        
    assert content == "Success"
    assert tokens == 10

def test_call_llm_bad_request_fallback():
    """Verify call_llm falls back to gpt-4o-mini on BadRequestError."""
    import openai
    from app.services.ai_engine import call_llm
    
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Fallback success"))]
    mock_response.usage = MagicMock(total_tokens=5)
    
    mock_client.chat.completions.create.side_effect = [
        openai.BadRequestError("Bad request", response=MagicMock(), body={}),
        mock_response
    ]
    
    with patch("app.services.ai_engine.get_openai_client", return_value=mock_client):
        content, tokens = call_llm("test", "test", model_id="openai/gpt-4o")
        
    assert content == "Fallback success"
    # Mini fallback check - it can be 'gpt-4o-mini' or 'openai/gpt-4o-mini' depending on how it's defined
    _, kwargs = mock_client.chat.completions.create.call_args
    assert "gpt-4o-mini" in kwargs["model"]

def test_call_llm_billing_error():
    """Verify call_llm raises AIBillingError on 402."""
    import openai
    from app.services.ai_engine import call_llm
    from app.utils.exceptions import AIBillingError
    
    mock_client = MagicMock()
    error = openai.APIStatusError("Billing", response=MagicMock(status_code=402), body={})
    mock_client.chat.completions.create.side_effect = error
    
    with patch("app.services.ai_engine.get_openai_client", return_value=mock_client):
        with pytest.raises(AIBillingError):
            call_llm("test", "test", model_id="gpt-4o-mini")

def test_call_llm_exhaustive_failure():
    """Verify call_llm raises AIServiceError after max retries."""
    import openai
    from app.services.ai_engine import call_llm
    from app.utils.exceptions import AIServiceError
    
    mock_client = MagicMock()
    # Use RateLimitError to actually trigger the retry loop and reach the final raise
    mock_client.chat.completions.create.side_effect = openai.RateLimitError("Fail", response=MagicMock(), body={})
    
    with patch("app.services.ai_engine.get_openai_client", return_value=mock_client), \
         patch("time.sleep"):
        with pytest.raises(AIServiceError):
            call_llm("test", "test", model_id="gpt-4o-mini")

@patch("app.services.ai_engine.call_llm")
def test_generate_reply_crisis_path(mock_llm):
    """Verify high-stakes reviews are routed to gpt-4o (Pass 1)."""
    from app.services.ai_engine import generate_reply
    
    mock_llm.side_effect = [
        ("Pass 1 Crisis Draft", 100),
        ("Pass 2 Crisis Humanized", 150),
        ("Final Crisis Reply\nMETADATA_JSON: {\"quality_score\": 95}", 200)
    ]
    
    result = generate_reply(
        business_name="Test Biz",
        business_type="Cafe",
        tone_preference="professional",
        star_rating=1,
        review_text="DISGUSTING EXPERIENCE NEVER COMING BACK!!!",
        user_id="user_123"
    )
    
    assert result["text"] == "Final Crisis Reply"
    # Check that the first call used the high-complexity model (gpt-4o)
    args, kwargs = mock_llm.call_args_list[0]
    # Flexibility: model can be in args[2] or kwargs['model_id']
    model_val = kwargs.get("model_id") or (args[2] if len(args) > 2 else None)
    assert model_val is not None
    assert "gpt-4o" in model_val
