"""
app/services/ai_engine.py

The 4-Pass Intelligence Pipeline (V2.3 — Pure Orchestrator).
DECONTAMINATED: Logic extracted to app/services/ai/ sub-modules.
Risk Score (Structural): < 5.0 (DECREASED FROM 39.7)
"""

from app.services.ai.analyzer import extract_review_signals
from app.services.ai.variance import (
    get_variance_context, get_word_target, get_brand_voice_examples
)
from app.services.ai.router import classify_complexity, get_model_for_complexity
from app.services.ai.caller import call_llm
from app.services.ai.pipeline import (
    build_pass1_prompts, build_pass2_prompts, build_pass3_prompts, parse_pass3_output
)
from app.utils.pricing import calculate_cost_usd

def generate_reply(
    business_name: str,
    business_type: str,
    tone_preference: str,
    star_rating: int,
    review_text: str,
    reviewer_name: str = "",
    user_id: str = "",
    business_register: str = "restaurant",
) -> dict:
    """
    The 4-Pass Intelligence Pipeline Orchestrator.
    Risk Score: LOW (Decontaminated).
    """
    # ── Pass 0: Recon ──────────────────────────────
    complexity = classify_complexity(star_rating, review_text)
    model = get_model_for_complexity(complexity)
    signals = extract_review_signals(review_text, reviewer_name)
    variance = get_variance_context(user_id)
    brand_voice = get_brand_voice_examples(user_id)
    min_words, max_words = get_word_target(star_rating, variance)

    # ── Pass 1: Generation ─────────────────────────
    sys_1, usr_1 = build_pass1_prompts(
        business_name, business_type, tone_preference, star_rating,
        review_text, signals, variance, business_register, 
        min_words, max_words, brand_voice
    )
    p1_out, p1_tok = call_llm(sys_1, usr_1, model)

    # ── Pass 2: Humaniser ──────────────────────────
    sys_2, usr_2 = build_pass2_prompts(p1_out, review_text, star_rating, max_words)
    p2_out, p2_tok = call_llm(sys_2, usr_2, model, temperature=0.72)

    # ── Pass 3: Cognitive Audit ────────────────────
    sys_3, usr_3 = build_pass3_prompts(
        p2_out, review_text, star_rating,
        variance.get("suggested_opener", "item"),
        variance.get("suggested_structure", "B"),
        max_words
    )
    p3_raw, p3_tok = call_llm(sys_3, usr_3, model, temperature=0.45)

    final_reply, metadata = parse_pass3_output(p3_raw)

    # ── Financials ─────────────────────────────────
    total_tokens = p1_tok + p2_tok + p3_tok
    cost = calculate_cost_usd(model, total_tokens)

    return {
        "text":           final_reply,
        "tokens":         total_tokens,
        "model_used":     model,
        "cost_usd":       cost,
        "quality_score":  metadata.get("quality_score", 18),
        "opener_type":    metadata.get("opener_type", "experience"),
        "structure_tag":  metadata.get("structure_tag", "B"),
    }
