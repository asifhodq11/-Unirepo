"""
app/services/ai/variance.py

The Variance Engine for ReplyIQ v2.3.
Prevents history-level AI detection by rotating openers and structural patterns.
"""

from app.extensions import supabase
from app.services.ai.prompts import (
    OPENER_TYPES, STRUCTURE_TAGS, STRUCTURE_DESCRIPTIONS, STAR_CONTRACTS
)

def get_variance_context(user_id: str) -> dict:
    """
    Queries history and determines the optimal variance parameters.
    Defeats document-level AI detection (GPT Zero Level 3).
    """
    default = {
        "recent_openers":     [],
        "recent_structures":  [],
        "suggested_opener":   "experience",
        "suggested_structure": "B",
        "suggested_word_band": "medium",
    }

    if not user_id:
        return default

    try:
        result = (
            supabase.from_("replies")
            .select("opener_type, structure_tag")
            .eq("user_id", user_id)
            .not_.is_("opener_type", "null")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        recent = result.data or []
        recent_openers = [r.get("opener_type") for r in recent if r.get("opener_type")]
        recent_structures = [r.get("structure_tag") for r in recent if r.get("structure_tag")]

        suggested_opener = next(
            (o for o in OPENER_TYPES if o not in recent_openers),
            OPENER_TYPES[0]
        )
        suggested_structure = next(
            (s for s in STRUCTURE_TAGS if s not in recent_structures),
            STRUCTURE_TAGS[0]
        )

        band_cycle = ["short", "medium", "long"]
        suggested_word_band = band_cycle[len(recent) % 3]

        return {
            "recent_openers":      recent_openers,
            "recent_structures":   recent_structures,
            "suggested_opener":    suggested_opener,
            "suggested_structure": suggested_structure,
            "suggested_word_band": suggested_word_band,
        }
    except Exception:
        return default

def get_word_target(star_rating: int, variance_context: dict) -> tuple[int, int]:
    """
    Computes word targets adjusted by the variance engine's band suggestion.
    """
    base_contract = STAR_CONTRACTS.get(star_rating, STAR_CONTRACTS[5])
    base_min, base_max = base_contract["word_target"]
    band = variance_context.get("suggested_word_band", "medium")

    if band == "short":
        return (base_min, int(base_max * 0.88))
    elif band == "long":
        return (int(base_min * 1.05), int(base_max * 1.15))
    return (base_min, base_max)

def get_brand_voice_examples(user_id: str) -> str:
    """
    Retrieves the last 3 high-quality replies from this user to 
    serve as 'Brand Voice' few-shot anchors.
    """
    if not user_id:
        return ""

    try:
        result = (
            supabase.from_("replies")
            .select("reply_text, reviews(review_text)")
            .eq("user_id", user_id)
            .eq("status", "sent")
            .order("created_at", desc=True)
            .limit(3)
            .execute()
        )

        data = result.data or []
        if not data:
            return ""

        examples = []
        for r in data:
            rev_txt = r.get("reviews", {}).get("review_text", "N/A") if r.get("reviews") else "N/A"
            examples.append(f"REVIEW: {rev_txt}\nREPLY: {r['reply_text']}")

        return "\n\nYOUR PREVIOUS BRAND VOICE EXAMPLES:\n" + "\n---\n".join(examples)
    except Exception:
        return ""
