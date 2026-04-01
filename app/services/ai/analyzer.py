"""
app/services/ai/analyzer.py

Pass 0: Signal Extraction.
Performs deterministic, local analysis of review text without LLM overhead.
"""

import re

_OCCASION_SIGNALS = {
    "birthday": ["birthday", "bday", "turned", "celebrating my", "my birthday"],
    "anniversary": ["anniversary", "years together", "years married", "our anniversary"],
    "first_visit": ["first time", "first visit", "never been", "tried for the first", "first time here"],
    "regular": ["always come", "every week", "regular", "usually come", "favourite spot", "come here often", "always visit"],
    "special": ["graduation", "promotion", "engagement", "proposed", "date night", "special occasion"],
}

_STAFF_CONTEXT_PATTERNS = [
    r"(?:ask for|served by|our|was|helped|by|from)\s+([A-Z][a-z]+)",
    r"([A-Z][a-z]+)\s+(?:was|helped|served|assisted|looked after)",
]

_NEGATIVE_SIGNALS = [
    "cold", "slow", "wait", "wrong", "terrible", "awful", "worst", "disappointing",
    "rude", "dirty", "disgusting", "unacceptable", "never again", "waste", "overpriced",
    "late", "missing", "broken", "fault", "problem", "issue", "complaint", "refund",
    "hair", "bug", "undercooked", "raw", "burnt", "stale",
]

_POSITIVE_SIGNALS = [
    "great", "amazing", "excellent", "perfect", "love", "fantastic", "wonderful",
    "best", "delicious", "outstanding", "brilliant", "highly recommend", "lovely",
    "fresh", "friendly", "warm", "attentive", "professional", "clean", "beautiful",
]

def extract_review_signals(review_text: str, reviewer_name: str = "") -> dict:
    """
    Pass 0: Extracts semantic signals from review text.
    Fast, deterministic, zero cost.
    """
    text = review_text or ""
    text_lower = text.lower()
    words = text.split()

    # 1. Item Extraction
    specific_items = re.findall(r'"([^"]+)"', text)
    capitalised = [w for w in words if len(w) > 2 and w[0].isupper() and w.isalpha() and w.lower() not in
                   {"the", "a", "an", "we", "i", "my", "our", "your", "this", "that", "they",
                    "there", "their", "it", "he", "she", "but", "and", "so", "for", "with",
                    reviewer_name.split()[0] if reviewer_name else ""}]
    specific_items.extend(capitalised[:3])
    specific_items = list(dict.fromkeys(specific_items))

    # 2. Staff Discovery
    staff_names = []
    for pattern in _STAFF_CONTEXT_PATTERNS:
        matches = re.findall(pattern, text)
        staff_names.extend(matches)
    reviewer_first = reviewer_name.split()[0] if reviewer_name else ""
    staff_names = list(dict.fromkeys(
        n for n in staff_names if n != reviewer_first and len(n) > 1
    ))

    # 3. Occasion Detection
    detected_occasion = None
    for occasion, keywords in _OCCASION_SIGNALS.items():
        if any(kw in text_lower for kw in keywords):
            detected_occasion = occasion
            break

    # 4. Formality Register
    has_emoji = bool(re.search(r'[\U0001F300-\U0001FFFF]', text))
    lowercase_ratio = len([c for c in text if c.islower()]) / max(len(text.replace(" ", "")), 1)
    has_proper_sentences = bool(re.search(r'[A-Z][^.!?]+[.!?]', text))

    if has_emoji or lowercase_ratio > 0.9:
        review_formality = "casual"
    elif has_proper_sentences and not has_emoji:
        review_formality = "formal"
    else:
        review_formality = "neutral"

    return {
        "reviewer_name":     reviewer_name or "not provided",
        "specific_items":    specific_items,
        "staff_names":       staff_names,
        "occasion":          detected_occasion,
        "emotional_register": review_formality,
        "word_count":        len(words),
        "has_complaint":     any(w in text_lower for w in _NEGATIVE_SIGNALS),
        "has_praise":        any(w in text_lower for w in _POSITIVE_SIGNALS),
        "review_formality":  review_formality,
    }
