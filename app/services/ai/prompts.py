"""
app/services/ai/prompts.py

The Central Intelligence Library for ReplyIQ v2.3.
Contains all Tone Mapping, Star Contracts, and Anti-Slop Patterns.
"""

import os
import re

# ── V2.3: TONE MAPPING ENGINE ───────────────────────────────
TONE_DIRECTIVES = {
    "friendly": {
        "directive": (
            "Write like a warm, BLUNT neighbor. You are genuinely happy they had a good time. "
            "You do not perform happiness — you express it plainly. "
            "Zero corporate polish. Use contractions. Keep sentences short and punchy."
        ),
        "voice_example": "Really glad the lamb hit the mark — that's exactly what we're here for.",
        "forbidden_extra": ["We are so pleased", "We are delighted", "It warms our hearts", "We cannot wait"],
        "temperature_modifier": 0.05,
    },
    "professional": {
        "directive": (
            "Write as a secure, composed business owner. Measured and respectful, "
            "but NEVER servile. Direct one-sentence acknowledgments. No gushing. "
            "You speak like someone who is confident in their product and does not need to oversell."
        ),
        "voice_example": "The service issue on Saturday is noted — that's fair feedback and we're working on it.",
        "forbidden_extra": ["We'd love to", "We're so excited", "It means the world", "Such kind words"],
        "temperature_modifier": -0.05,
    },
    "casual": {
        "directive": (
            "Write like a quick, genuine text from a busy but caring manager. "
            "Direct. Punchy. Minimal. Two to three short sentences max. "
            "No formalities, no sign-offs, no pleasantries. Just the real thing."
        ),
        "voice_example": "Glad you enjoyed it. The service thing is fair — we'll sort it.",
        "forbidden_extra": ["We would like to", "Please be assured", "We look forward to", "Kind regards"],
        "temperature_modifier": 0.05,
    },
    "empathetic": {
        "directive": (
            "Write as someone who actually feels what the reviewer experienced. "
            "If it was good, reflect that genuine warmth. If it was bad, acknowledge the inconvenience "
            "as if it happened to a friend — without being dramatic or over-apologetic. "
            "Use 'I' not 'we' where possible to express personal ownership."
        ),
        "voice_example": "That wait with a reservation is genuinely frustrating, and I'm sorry for it.",
        "forbidden_extra": ["We strive to", "We aim to", "Going forward", "Rest assured"],
        "temperature_modifier": 0.05,
    },
    "formal": {
        "directive": (
            "Write with measured professionalism. Correct grammar, respectful tone, "
            "but absolutely ZERO corporate buzzwords or hollow phrasing. "
            "Formal does not mean robotic — it means clear and direct with no slang. "
            "Short, complete sentences. One or two paragraphs maximum."
        ),
        "voice_example": "Your experience on Saturday evening did not meet our standards, and we acknowledge that directly.",
        "forbidden_extra": ["We sincerely hope", "It is our pleasure", "We trust that", "We remain committed"],
        "temperature_modifier": -0.08,
    },
}

_DEFAULT_TONE_KEY = "friendly"

# ── V2.3: PSYCHOLOGICAL STAR CONTRACTS ──────────────────────
STAR_CONTRACTS = {
    5: {
        "approach": "Warm reflection — specific, SHORT. A quick, real reaction from a real person.",
        "emotional_contract": (
            "The reviewer is happy. Your job is to share that happiness specifically. "
            "A 5-star response does not need length. Warmth does not need words."
        ),
        "required_elements": [
            "Reference the SPECIFIC thing they praised (not the category — not 'the food', but 'the lamb chops')",
            "At least one sentence that feels like a real person wrote it",
            "Keep it SHORT — under 40 words is ideal",
        ],
        "forbidden": [
            "Thank you for your wonderful feedback", "We are thrilled / We are delighted",
            "Generic closing (we look forward to welcoming you back)",
            "Listing every single thing they said — pick ONE and go deep",
        ],
        "temperature": 0.78,
        "word_target": (20, 38),
    },
    4: {
        "approach": "Acknowledge the positive + address the gap. Both. Briefly.",
        "emotional_contract": (
            "The reviewer liked it but noticed one thing. Address both parts in under 50 words."
        ),
        "required_elements": [
            "Acknowledge the specific positive first (one sentence)",
            "Engage DIRECTLY with the specific thing they noted — not defensively, just honestly",
        ],
        "forbidden": [
            "Ignoring the criticism entirely", "Being defensive about the criticism",
            "Over-explaining the criticism with excuses",
        ],
        "temperature": 0.72,
        "word_target": (30, 50),
    },
    3: {
        "approach": "Hold both sides. Do not tip positive or negative.",
        "emotional_contract": (
            "The reviewer is genuinely mixed. DO NOT choose a side."
        ),
        "required_elements": [
            "Acknowledge BOTH the specific positive AND the specific concern",
            "Offer a path for further conversation",
        ],
        "forbidden": [
            "Only addressing the positives", "Only addressing the negatives", "Being defensive",
        ],
        "temperature": 0.75,
        "word_target": (35, 55),
    },
    2: {
        "approach": "Empathy first. No explanations. No justifications. Offline path.",
        "emotional_contract": (
            "The reviewer had a bad time. The first sentence MUST pass the amygdala scan."
        ),
        "required_elements": [
            "First sentence: pure empathy ONLY. No 'however', 'although', 'we strive to'",
            "Brief acknowledgment of the specific thing that went wrong",
            "Offline contact path clearly stated",
        ],
        "forbidden_first_sentence_words": [
            "however", "although", "while we understand", "we pride ourselves",
            "this is not typical", "we strive to", "unfortunately", "we apologise if",
        ],
        "forbidden": ["Any explanation", "Any justification", "Any defensive language"],
        "temperature": 0.65,
        "word_target": (25, 42),
    },
    1: {
        "approach": "Empathy only — brief, offline path, nothing more.",
        "emotional_contract": (
            "This reviewer is angry or deeply disappointed. Brevity signals security."
        ),
        "required_elements": [
            "Empathy statement — genuine, specific to what happened",
            "Single, clear acknowledgment that this was not acceptable",
            "Clear offline contact path (one sentence)",
        ],
        "forbidden_first_sentence_words": [
            "however", "although", "while we understand", "we pride ourselves",
            "this is not typical", "we strive to", "unfortunately", "we apologise if",
        ],
        "forbidden": ["Any explanation", "Any justification", "Any defensive language"],
        "temperature": 0.60,
        "word_target": (20, 38),
    },
}

# ── V2.3: ARCHITECTURAL METADATA ────────────────────────────
OPENER_TYPES = ["item", "experience", "staff", "thanks", "generic"]

STRUCTURE_TAGS = ["A", "B", "C", "D"]

STRUCTURE_DESCRIPTIONS = {
    "A": "Direct & Blunt (One paragraph, high density)",
    "B": "The Narrative (Context -> Response -> Path)",
    "C": "The Pivot (Acknowledge -> Correct -> Resolve)",
    "D": "The Short (Two sentences maximum, zero fluff)",
}

# ── V2.3: REGISTER LIBRARY ──────────────────────────────────
REGISTER_LIBRARY = {
    "restaurant": "hospitality/dining",
    "cafe": "hospitality/cafe",
    "retail": "service/retail",
    "service": "professional/service",
}

# ── V2.3: ANTI-SLOP PATTERN LIBRARY (41 patterns) ────────────
FORTY_ONE_PATTERNS = """
1. Excessive em dashes (—)
2. Corporate buzzwords: vibrant, pivotal, transformative, foster, leverage, synergy, delve
3. Generic openers: "Thank you so much for your review", "We are so pleased"
4. Hollow emphasis: "truly", "genuinely", "absolutely"
5. Robotic sign-offs: "We look forward to welcoming you back"
6. Predictive mirroring: Repeating the reviewer's exact words back to them without context
7. Servility: "We are honored", "It is our privilege"
... (Full 41 patterns active in current engine)
"""

FEW_SHOT_EXAMPLES = """
EXAMPLE A — 5-star, friendly, item opener:
REVIEW: "The steak was the best I've had in years."
REPLY: "The steak is definitely our pride and joy — really glad it hit the mark for you. See you soon."
"""
