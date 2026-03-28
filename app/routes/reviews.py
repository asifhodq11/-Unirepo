"""
app/routes/reviews.py

REST API endpoint for submitting manual reviews and orchestrating
the AI Engine pipeline.
"""

import time
from flask import Blueprint, g, jsonify, request
from app.schemas.review_schema import GenerateReplySchema, SendReplySchema

from app.utils.decorators import require_auth, validate_request
from app.utils.errors import build_error
from app.utils.logger import log_event
from app.extensions import supabase, limiter

from app.models.review_model import insert_review, update_review_status
from app.models.reply_model import insert_reply, update_reply

from app.services.usage_service import check_usage_limit, increment_usage
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
        "google_review_id": data["google_review_id"] if data["google_review_id"] else None,
        "status": "pending",
    }

    saved_review = insert_review(user_id, review_data)
    if not saved_review:
        return build_error("SERVER_ERROR", details="Failed to persist review.")

    # 3. Generate the AI Reply
    log_event("ai_generation_start", user_id=user_id, review_id=saved_review["id"])
    start_time = time.time()

    reply_text = generate_reply(
        business_name=user.get("business_name", "your business"),
        business_type=user.get("business_type", "business"),
        tone_preference=user.get("tone_preference", "friendly"),
        star_rating=data["rating"],
        review_text=data.get("review_text", ""),
    )

    duration_ms = int((time.time() - start_time) * 1000)

    # Track which model was chosen
    complexity = classify_complexity(data["rating"], data.get("review_text", ""))
    model_used = get_model_for_complexity(complexity)

    # 4. Save the generated reply to DB
    # Column names match 003_create_replies.sql; is_deleted has DB DEFAULT
    reply_data = {
        "review_id": saved_review["id"],
        "reply_text": reply_text,
        "status": "draft",
        "generation_ms": duration_ms,
        "model_used": model_used,
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

    log_event("ai_generation_success", user_id=user_id, review_id=saved_review["id"], ms=duration_ms)

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

    # 4. Run the 3-Pass AI Pipeline
    log_event("on_demand_generation_start", user_id=user_id, review_id=review_id)
    start_time = time.time()

    reply_text = generate_reply(
        business_name=user.get("business_name", "your business"),
        business_type=user.get("business_type", "business"),
        tone_preference=user.get("tone_preference", "friendly"),
        star_rating=review["rating"],
        review_text=review.get("review_text", ""),
    )

    duration_ms = int((time.time() - start_time) * 1000)
    complexity  = classify_complexity(review["rating"], review.get("review_text", ""))
    model_used  = get_model_for_complexity(complexity)

    # 5. Save reply
    reply_data = {
        "review_id":     review_id,
        "reply_text":    reply_text,
        "status":        "draft",
        "generation_ms": duration_ms,
        "model_used":    model_used,
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

    log_event("on_demand_generation_success", user_id=user_id, review_id=review_id, ms=duration_ms)

    return jsonify({"review": {**review, "status": "pending"}, "reply": saved_reply}), 201


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

    # Fetch total count (non-deleted, this user only)
    count_query = supabase.from_("reviews").select("id", count="exact").eq("user_id", user_id).eq("is_deleted", False)
    if status_filter:
        count_query = count_query.eq("status", status_filter)
    count_result = count_query.execute()
    total = count_result.count if count_result.count is not None else 0

    # Fetch page of reviews with their associated replies
    rows_query = (
        supabase.from_("reviews")
        .select("id, review_text, rating, reviewer_name, status, created_at, replies(id, reply_text, status, generation_ms, model_used)")
        .eq("user_id", user_id)
        .eq("is_deleted", False)
    )
    if status_filter:
        rows_query = rows_query.eq("status", status_filter)
    rows_result = (
        rows_query
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )

    items = rows_result.data or []
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
        return build_error("NOT_FOUND", details="Draft reply not found or not owned by user."), 404

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
        # Fetch the 10 most recent reviews
        rows_result = (
            supabase.from_("reviews")
            .select("id, review_text, rating, reviewer_name, created_at, replies(id, status, model_used)")
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
            status = "Draft Ready" if has_reply else "Scanning..."
            
            events.append({
                "id": str(row["id"]),
                "type": "draft_created" if has_reply else "review_found",
                "title": f"Reply generated for {reviewer}" if has_reply else f"New {row['rating']}★ review detected",
                "timestamp": row["created_at"],
                "status": status,
                "rating": row["rating"],
                "model": row["replies"][0]["model_used"] if has_reply and row["replies"] else "auto"
            })
            
        return jsonify({"events": events}), 200

    except Exception as e:
        log_event("activity_feed_error", user_id=user_id, error=str(e))
        return build_error("SERVER_ERROR", details="Failed to fetch activity feed."), 500
