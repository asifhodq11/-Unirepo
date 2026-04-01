"""
app/routes/reviews.py

REST API endpoint for submitting manual reviews and orchestrating
the AI Engine pipeline.
"""

import time
from flask import Blueprint, g, jsonify, request
from app.schemas.review_schema import GenerateReplySchema, SendReplySchema, BulkGenerateSchema

from app.utils.decorators import require_auth, validate_request
from app.utils.errors import build_error
from app.utils.logger import log_event
from app.extensions import supabase, limiter

from app.models.review_model import insert_review, update_review_status
from app.models.reply_model import insert_reply, update_reply

from app.services.usage_service import check_usage_limit, increment_usage, reserve_bulk_usage
from app.services.model_router import classify_complexity, get_model_for_complexity
from app.services.ai_engine import generate_reply


reviews_bp = Blueprint("reviews", __name__)




@reviews_bp.route("/generate", methods=["POST"])
@require_auth
@limiter.limit("20 per hour")
@validate_request(GenerateReplySchema)
def generate():
    """
    Submits a review and generates a 3-pass AI reply.
    """
    user = g.current_user
    data = g.validated_data
    user_id = user["id"]

    # 1. Enforce Subscription Usage Limits
    check_usage_limit(user_id)

    # 2. Save the incoming review to DB
    # Column names MUST match the DB schema exactly (see 002_create_reviews.sql)
    # DB column is "rating" NOT "star_rating". No "platform" column exists.
    review_data = {
        "rating": data["rating"],
        "review_text": data["review_text"] if data["review_text"] else None,
        "reviewer_name": data["reviewer_name"] if data["reviewer_name"] else None,
        "google_review_id": data.get("google_review_id") if data.get("google_review_id") else None,
        "status": "pending",
    }

    saved_review = insert_review(user_id, review_data)
    if not saved_review:
        return build_error("SERVER_ERROR", details="Failed to persist review.")

    # 3. Generate the AI Reply (v2.0 — 4-pass Intelligence Pipeline)
    log_event("ai_generation_start", user_id=user_id, review_id=saved_review["id"])
    start_time = time.time()

    ai_result = generate_reply(
        business_name=user.get("business_name", "your business"),
        business_type=user.get("business_type", "business"),
        tone_preference=user.get("tone_preference", "friendly"),
        star_rating=data["rating"],
        review_text=data.get("review_text", ""),
        reviewer_name=data.get("reviewer_name", "") or "",
        user_id=user_id,
        business_register=user.get("business_register", "restaurant"),
    )

    duration_ms = int((time.time() - start_time) * 1000)

    # Track which model was chosen
    complexity = classify_complexity(data["rating"], data.get("review_text", ""))
    model_used = get_model_for_complexity(complexity)

    # 4. Save the generated reply to DB (including Intelligence v2.0 variance/quality fields)
    reply_data = {
        "review_id":     saved_review["id"],
        "reply_text":    ai_result["text"],
        "status":        "draft",
        "generation_ms": duration_ms,
        "model_used":    ai_result.get("model_used", model_used),
        "tokens_used":   ai_result.get("tokens", 0),
    }

    saved_reply = insert_reply(user_id, reply_data)
    if not saved_reply:
        return build_error("SERVER_ERROR", details="Reply generation succeeded but failed to save to database.")

    # 5. Mark review as 'replied' now that reply is saved
    update_review_status(user_id, saved_review["id"], "replied")

    # 6. Increment Usage atomically via RPC
    try:
        increment_usage(user_id)
    except Exception as e:
        log_event("increment_usage_failed", user_id=user_id, level="error", error=str(e))
        # We don't fail the request here, but we log the usage drift.

    log_event(
        "ai_generation_success",
        user_id=user_id,
        review_id=saved_review["id"],
        ms=duration_ms,
        quality_score=ai_result.get("quality_score", 0),
    )

    # Standard success
    return jsonify({"review": saved_review, "reply": saved_reply}), 201


@reviews_bp.route("/<review_id>/generate", methods=["POST"])
@require_auth
@limiter.limit("30 per hour")
def generate_for_existing(review_id):
    """
    On-demand AI generation for an already-collected pending review.
    Used by Starter plan users (and Pro users in surge overflow).
    Security: review must belong to the authenticated user.
    Idempotency: only generates if review status is 'pending'.
    """
    user    = g.current_user
    user_id = user["id"]

    # 1. Fetch the review — MUST be scoped to this user (Security Rule 1)
    result = (
        supabase.from_("reviews")
        .select("id, rating, review_text, reviewer_name, status")
        .eq("id", review_id)
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )

    if not result.data:
        return build_error("NOT_FOUND", details="Review not found or access denied."), 404

    review = result.data

    # 2. Idempotency guard — do not regenerate if already replied
    if review["status"] != "pending":
        return build_error(
            "CONFLICT",
            details=f"Review is already in '{review['status']}' state. Generation skipped."
        ), 409

    # 3. Enforce monthly usage limits
    check_usage_limit(user_id)

    # 4. Run the 4-Pass AI Intelligence Pipeline (v2.0)
    log_event("on_demand_generation_start", user_id=user_id, review_id=review_id)
    start_time = time.time()

    ai_result = generate_reply(
        business_name=user.get("business_name", "your business"),
        business_type=user.get("business_type", "business"),
        tone_preference=user.get("tone_preference", "friendly"),
        star_rating=review["rating"],
        review_text=review.get("review_text", ""),
        reviewer_name=review.get("reviewer_name", "") or "",
        user_id=user_id,
        business_register=user.get("business_register", "restaurant"),
    )

    duration_ms = int((time.time() - start_time) * 1000)
    complexity  = classify_complexity(review["rating"], review.get("review_text", ""))
    model_used  = get_model_for_complexity(complexity)

    # 5. Save reply (including Intelligence v2.0 variance/quality fields)
    reply_data = {
        "review_id":     review_id,
        "reply_text":    ai_result["text"],
        "status":        "draft",
        "generation_ms": duration_ms,
        "model_used":    ai_result.get("model_used", model_used),
        "tokens_used":   ai_result["tokens"],
        "cost_usd":      ai_result["cost_usd"],
        "opener_type":   ai_result.get("opener_type"),
        "structure_tag": ai_result.get("structure_tag"),
        "quality_score": ai_result.get("quality_score", 0),
    }
    saved_reply = insert_reply(user_id, reply_data)
    if not saved_reply:
        return build_error("SERVER_ERROR", details="Reply generated but failed to save."), 500

    # 6. Mark review as replied (REMOVED - now waiting for user confirm)
    # update_review_status(user_id, review_id, "replied")

    # 7. Increment usage
    try:
        increment_usage(user_id)
    except Exception as e:
        log_event("increment_usage_failed", user_id=user_id, level="error", error=str(e))

    log_event(
        "on_demand_generation_success",
        user_id=user_id,
        review_id=review_id,
        ms=duration_ms,
        quality_score=ai_result.get("quality_score", 0),
    )

    return jsonify({"review": {**review, "status": "pending"}, "reply": saved_reply}), 201


@reviews_bp.route("/bulk-generate", methods=["POST"])
@require_auth
@limiter.limit("5 per minute")
@validate_request(BulkGenerateSchema)
def bulk_generate():
    """
    Atomic bulk generation. Deducts credits for the ENTIRE batch upfront.
    Prevents partial generation leaks.
    """
    user    = g.current_user
    user_id = user["id"]
    review_ids = g.validated_data["review_ids"]
    count = len(review_ids)

    # 1. Atomic Pre-Check & Reservation
    try:
        reserve_bulk_usage(user_id, count)
    except Exception as e:
        return build_error("FORBIDDEN", details=str(e)), 403

    results = []
    
    # 2. Sequential Processing (credits are already 'paid')
    for rid in review_ids:
        try:
            # Fetch review logic (reused from single generate but optimized for batch)
            rev_res = supabase.from_("reviews").select("*").eq("id", rid).eq("user_id", user_id).single().execute()
            if not rev_res.data or rev_res.data["status"] != "pending":
                results.append({"id": rid, "status": "skipped", "reason": "Already replied or not found"})
                continue

            review = rev_res.data
            
            # 3. AI Pipeline
            start_time = time.time()
            ai_res = generate_reply(
                business_name=user.get("business_name", "your business"),
                business_type=user.get("business_type", "business"),
                tone_preference=user.get("tone_preference", "friendly"),
                star_rating=review["rating"],
                review_text=review.get("review_text", ""),
                reviewer_name=review.get("reviewer_name", "") or "",
                user_id=user_id,
                business_register=user.get("business_register", "restaurant"),
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            complexity  = classify_complexity(review["rating"], review.get("review_text", ""))
            model_used  = get_model_for_complexity(complexity)
            
            # 4. Save Reply
            reply_data = {
                "review_id": rid,
                "reply_text": ai_res["text"],
                "status": "draft",
                "generation_ms": duration_ms,
                "model_used": ai_res.get("model_used", model_used),
                "tokens_used": ai_res["tokens"],
                "cost_usd": ai_res["cost_usd"],
                "quality_score": ai_res.get("quality_score", 0),
            }
            saved_reply = insert_reply(user_id, reply_data)
            results.append({"id": rid, "status": "success", "reply": saved_reply})
            
        except Exception as e_ai:
            log_event("bulk_item_failed", user_id=user_id, review_id=rid, error=str(e_ai))
            results.append({"id": rid, "status": "failed", "error": str(e_ai)})

    return jsonify({
        "message": f"Successfully processed {len([r for r in results if r['status'] == 'success'])} reviews.",
        "results": results
    }), 200


@reviews_bp.route("/history", methods=["GET"])
@require_auth
def history():
    """
    Returns a paginated list of reviews (with reply status) for the current user.
    Soft-deleted reviews (is_deleted=true) are never returned.
    """
    user_id = g.current_user["id"]

    # Parse and clamp pagination params
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    except (ValueError, TypeError):
        per_page = 20

    # Optional status filter (e.g. ?status=pending)
    status_filter = request.args.get("status")

    offset = (page - 1) * per_page

    # 1. Base query for filtered results (non-deleted, this user)
    query = (
        supabase.from_("reviews")
        .select("id, review_text, rating, reviewer_name, status, created_at, replies(id, reply_text, status, generation_ms, model_used, tokens_used)")
        .eq("user_id", user_id)
        .eq("is_deleted", False)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    # 2. Sequential pagination & atomic count execution
    # Using 'exact' count on the final query avoids a separate trip to Supabase
    rows_result = (
        query
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute(count="exact")
    )

    items = rows_result.data or []
    total = rows_result.count if rows_result.count is not None else 0
    has_more = (offset + len(items)) < total

    return (
        jsonify(
            {
                "items": items,
                "total": total,
                "has_more": has_more,
            }
        ),
        200,
    )

@reviews_bp.route("/<review_id>/send", methods=["POST"])
@require_auth
@validate_request(SendReplySchema)
def confirm_and_send(review_id):
    """
    Confirms an AI draft, updates its text, marks the reply as "sent", and the review as "replied".
    """
    user_id = g.current_user["id"]
    data = g.validated_data

    # 1. Update the reply draft
    updates = {
        "reply_text": data["reply_text"],
        "status": "sent"
    }
    updated_reply = update_reply(user_id, data["reply_id"], updates)
    if not updated_reply:
        return build_error("REPLY_NOT_FOUND", details="Draft reply not found or not owned by user.")

    # 2. Mark the review as replied
    update_review_status(user_id, review_id, "replied")

    log_event("manual_draft_sent", user_id=user_id, review_id=review_id)

    return jsonify({"success": True, "reply": updated_reply}), 200


@reviews_bp.route("/activity", methods=["GET"])
@require_auth
def activity_feed():
    """
    Returns the latest 10 'Autonomous' events for the Dashboard Live Feed.
    Currently maps recent review generations to activity items.
    """
    user_id = g.current_user["id"]

    try:
        # Fetch the 10 most recent reviews with full text for modal display
        rows_result = (
            supabase.from_("reviews")
            .select("id, review_text, rating, reviewer_name, status, created_at, replies(id, reply_text, status, model_used)")
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        
        events = []
        for row in (rows_result.data or []):
            has_reply = bool(row.get("replies"))
            reviewer = row.get("reviewer_name") or "Anonymous Guest"
            review_status = row.get("status", "pending")
            
            events.append({
                "id": str(row["id"]),
                "type": "draft_created" if has_reply else "review_found",
                "title": f"Reply for {reviewer}" if has_reply else f"New {row['rating']}★ review",
                "timestamp": row["created_at"],
                "status": review_status,
                "rating": row["rating"],
                "review_text": row.get("review_text") or "",
                "reviewer_name": reviewer,
                "replies": row.get("replies") or [],
            })
            
        return jsonify({"events": events}), 200

    except Exception as e:
        log_event("activity_feed_error", user_id=user_id, error=str(e))
        return build_error("SERVER_ERROR", details="Failed to fetch activity feed.")
