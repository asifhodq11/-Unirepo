"""
app/services/model_router.py

Implements the Smart Model Router defined in Chapter 6.
Classifies review complexity and returns the exact model string to use.
"""

import os

# Exact list from Chapter 6 of the Bible
CRISIS_WORDS = [
    # Legal
    "lawyer", "lawsuit", "attorney", "court", "legal action", "sue",
    # Health
    "food poisoning", "poison", "sick", "ill", "health department",
    # Action
    "police", "illegal", "report you", "shut down",
    # Emotional (NEW — catches 3x more crises)
    "refund", "worst", "terrible", "scam", "disgusting", "unacceptable",
    "never again", "rip off", "waste of money", "demand",
]


def classify_complexity(star_rating: int, review_text: str) -> str:
    """
    Classifies review complexity using a behavioral Emotional Energy score.
    Returns one of: 'crisis', 'simple', 'standard'.
    """
    text = (review_text or "").lower()
    word_count = len(text.split())

    # GATE 1: Star-based fast path (4-5★ are almost never crises)
    if star_rating >= 4 and word_count < 30:
        return "simple"

    # GATE 2: Crisis keyword check
    if star_rating <= 2 and any(w in text for w in CRISIS_WORDS):
        return "crisis"

    # GATE 3: Emotional Energy Score (behavioral signals)
    exclaim = text.count("!") + text.count("?")
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    
    # 1 star = 32 points, 2 star = 24 points, etc.
    anger_score = (
        ((5 - star_rating) * 8) + 
        (min(exclaim, 10) * 3) + 
        (caps_ratio * 40) + 
        (min(word_count / 10, 5))
    )

    if anger_score > 45:
        return "crisis"
    if anger_score < 15:
        return "simple"
    return "standard"


def get_model_for_complexity(complexity: str) -> str:
    """
    Maps complexity to the correct model string.
    Reads AI_PROVIDER env var to select the right
    model name format for OpenRouter or OpenAI direct.
    """
    provider = os.environ.get("AI_PROVIDER", "openrouter")

    models = {
        "openai": {
            "crisis":   "gpt-4o",
            "simple":   "gemini-2.0-flash-lite-preview-02-05",
            "standard": "gpt-4o-mini",
        },
        "openrouter": {
            "crisis":   "openai/gpt-4o",
            "simple":   "google/gemma-3-27b-it:free",
            "standard": "openai/gpt-4o-mini",
        },
    }

    provider_models = models.get(provider, models["openrouter"])
    return provider_models.get(complexity, "openai/gpt-4o-mini")
