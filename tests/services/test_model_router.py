import os

# Set dummy env vars BEFORE any app imports
os.environ['SECRET_KEY'] = 'test-secret'
os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake'
os.environ['SUPABASE_ANON_KEY'] = FAKE_JWT
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = FAKE_JWT
os.environ['OPENAI_API_KEY'] = 'test-openai-key'
os.environ['GEMINI_API_KEY'] = 'test-gemini-key'
os.environ['OPENROUTER_API_KEY'] = 'test-openrouter-key'
os.environ['AI_PROVIDER'] = 'openrouter'
os.environ['FRONTEND_URL'] = 'http://localhost'

import pytest
from app.services.model_router import classify_complexity, get_model_for_complexity

def test_classify_crisis():
    # Crisis: rating <= 2 AND contains crisis word
    assert classify_complexity(1, "I'm going to call my lawyer.") == 'crisis'
    assert classify_complexity(2, "The food poisoning was terrible.") == 'crisis'
    # Mixed: crisis word but high rating -> Simple (because rating > 2 and count < 30)
    assert classify_complexity(5, "The sick beat at the restaurant was sick!") == 'simple'
    # No word but low rating -> Not crisis
    assert classify_complexity(1, "I hated it.") == 'standard'

def test_classify_simple():
    # Simple: rating >= 4 AND word count < 30
    assert classify_complexity(5, "Great food!") == 'simple'
    assert classify_complexity(4, "Good.") == 'simple'
    
    # Simple even if long text, if the anger score is low (< 15)
    # 5-star, 50 words, no caps/exclaims -> score = 0 + 5 = 5 < 15
    long_calm_text = " ".join(["word"] * 50)
    assert classify_complexity(5, long_calm_text) == 'simple'

def test_classify_standard():
    # Standard: anger score between 15 and 45
    # 3 star, 5 words -> score = 16.5 -> STANDARD
    assert classify_complexity(3, "Average food.") == 'standard'
    # 4 star, some exclaim -> 8 (rating) + 9 (3 exclaims) + 5 (long text) = 22 -> STANDARD
    text = "Good. " + "word " * 40 + "!!!"
    assert classify_complexity(4, text) == 'standard'
    # 2 star, NO crisis words -> (5-2)*8 + low words = 24.5 -> STANDARD
    assert classify_complexity(2, "Not great.") == 'standard'

def test_model_mapping():
    # Default provider is openrouter — expect prefixed names
    assert get_model_for_complexity('crisis') == 'openai/gpt-4o'
    assert get_model_for_complexity('simple') == 'openai/gpt-4o-mini'
    assert get_model_for_complexity('standard') == 'openai/gpt-4o-mini'
    assert get_model_for_complexity('unknown') == 'openai/gpt-4o-mini'
