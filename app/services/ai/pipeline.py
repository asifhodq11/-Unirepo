"""
app/services/ai/pipeline.py

The 4-Pass Logic Pipeline for ReplyIQ v2.3.
Contains Pass 1-3 Prompt Builders and Structured Parsers.
"""

import json
from app.services.ai.prompts import (
    TONE_DIRECTIVES, STAR_CONTRACTS, REGISTER_LIBRARY, 
    STRUCTURE_DESCRIPTIONS, FEW_SHOT_EXAMPLES, FORTY_ONE_PATTERNS,
    OPENER_TYPES, STRUCTURE_TAGS, _DEFAULT_TONE_KEY
)

def build_pass1_prompts(
    business_name: str,
    business_type: str,
    tone_preference: str,
    star_rating: int,
    review_text: str,
    signals: dict,
    variance: dict,
    business_register: str,
    min_words: int,
    max_words: int,
    brand_voice: str = "",
) -> tuple[str, str]:
    """Pass 1: Weighted Generation Prompt Builder."""
    contract = STAR_CONTRACTS.get(star_rating, STAR_CONTRACTS[5])
    register = REGISTER_LIBRARY.get(business_register, REGISTER_LIBRARY["restaurant"])
    
    key = (tone_preference or _DEFAULT_TONE_KEY).lower().strip()
    tone = TONE_DIRECTIVES.get(key, TONE_DIRECTIVES[_DEFAULT_TONE_KEY])

    # Context injection from Pass 0
    context_lines = []
    if signals.get("reviewer_name") != "not provided":
        context_lines.append(f"— Reviewer name: {signals.get('reviewer_name')} (use naturally)")
    if signals.get("specific_items"):
        context_lines.append(f"— Specific items: {', '.join(signals['specific_items'][:3])}")
    
    context_injection = "\n".join(context_lines) if context_lines else "— No specific signals."

    # Variance directive
    suggested_opener = variance.get("suggested_opener", "experience")
    suggested_structure = variance.get("suggested_structure", "B")

    system_prompt = f"""You are the owner of {business_name}, a {business_type}.
TONE: {tone['directive']}
REQUIRED: Use opener '{suggested_opener}' and structure '{suggested_structure}'.
WORD LIMIT: {min_words}–{max_words} words.
BANNED: {FORTY_ONE_PATTERNS[:200]}...
{brand_voice}"""

    user_prompt = f"""SIGNALS: {context_injection}
REVIEW: "{review_text}"
Write the reply now ({min_words}-{max_words} words)."""

    return system_prompt, user_prompt

def build_pass2_prompts(pass1_output: str, review_text: str, star_rating: int, max_words: int) -> tuple[str, str]:
    """Pass 2: Burstiness Humaniser Prompt Builder."""
    system_prompt = "You are a ruthless Slop-Detecting Filter and Brevity Enforcer."
    user_prompt = f"EDIT THIS REPLY (UNDER {max_words} WORDS): {pass1_output}\n\nCONTEXT: {review_text}"
    return system_prompt, user_prompt

def build_pass3_prompts(
    pass2_output: str,
    review_text: str,
    star_rating: int,
    suggested_opener: str,
    suggested_structure: str,
    max_words: int,
) -> tuple[str, str]:
    """Pass 3: Cognitive Audit Prompt Builder."""
    system_prompt = """Final quality checker. 
OUTPUT FORMAT:
Line 1: Final reply text
Line 2: METADATA_JSON: {"opener_type": "X", "structure_tag": "Y", "quality_score": N}"""
    
    user_prompt = f"AUDIT THIS: {pass2_output}\nRating: {star_rating}\nReview: {review_text}"
    return system_prompt, user_prompt

def parse_pass3_output(raw_output: str) -> tuple[str, dict]:
    """Parses Pass 3 output with resilient fallbacks."""
    metadata_defaults = {
        "opener_type":   "experience",
        "structure_tag": "B",
        "quality_score": 18,
    }
    
    lines = raw_output.strip().split("\n")
    metadata_line = next((l for l in lines if l.startswith("METADATA_JSON:")), None)
    
    reply_lines = [l for l in lines if not l.startswith("METADATA_JSON:")]
    reply_text = "\n".join(reply_lines).strip()

    if metadata_line:
        try:
            metadata = json.loads(metadata_line.replace("METADATA_JSON:", "").strip())
            return reply_text, {**metadata_defaults, **metadata}
        except:
            pass
            
    return reply_text or raw_output.strip(), metadata_defaults
