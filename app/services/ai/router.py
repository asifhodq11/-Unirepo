"""
app/services/ai/router.py

Complexity Classification and Model Routing.
Optimizes costs by using smaller models for simpler reviews.
"""

import os

def classify_complexity(star_rating: int, review_text: str) -> str:
    """
    Classifies the review complexity for model routing.
    - Low: Rating only (any stars) OR 4/5 stars with short text (< 15 words).
    - High: 1/2/3 stars with text OR any star with long text (> 120 words).
    - Medium: Everything else.
    """
    has_text = bool(review_text and review_text.strip())
    text_len = len(review_text.split()) if has_text else 0

    if not has_text:
        return "low"
    
    if star_rating <= 3:
        return "high" if text_len > 15 else "medium"
    
    if text_len > 120:
        return "high"
    
    if text_len < 15:
        return "low"
        
    return "medium"

def get_model_for_complexity(complexity: str) -> str:
    """
    Returns the optimal model ID for the given complexity.
    Prefers Gemini 2.5 Flash for speed/cost unless high complexity.
    """
    provider = os.environ.get("AI_PROVIDER", "openrouter")
    
    models = {
        "low":    "google/gemini-2.0-flash-lite-preview-02-05:free",
        "medium": "google/gemini-2.0-flash-lite-preview-02-05:free",
        "high":   "google/gemini-2.0-flash-lite-preview-02-05:free",
    }
    
    # OpenRouter Overrides
    if provider == "openrouter":
        models["high"] = "anthropic/claude-3.5-sonnet"
        
    return models.get(complexity, models["medium"])
