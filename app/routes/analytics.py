"""
app/routes/analytics.py

Lightweight analytics API for the dashboard mini-hub.
Returns aggregated review statistics without requiring new DB tables.
"""

from datetime import datetime, timedelta
from flask import Blueprint, g, jsonify
from app.utils.decorators import require_auth
from app.extensions import supabase

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/overview", methods=["GET"])
@require_auth
def dashboard_overview():
    """
    Returns a compact analytics payload for the dashboard widget.
    - avg_rating: overall average star rating
    - total_reviews: total non-deleted reviews
    - total_replied: reviews that have been replied to
    - daily_ratings: last 14 days of { date, avg, count }
    """
    user_id = g.current_user["id"]

    # 1. Fetch all non-deleted reviews for this user (ratings + dates)
    result = (
        supabase.from_("reviews")
        .select("rating, status, created_at")
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .order("created_at", desc=True)
        .execute()
    )
    reviews = result.data or []

    if not reviews:
        return jsonify({
            "avg_rating": 0,
            "total_reviews": 0,
            "total_replied": 0,
            "reply_rate": 0,
            "daily_ratings": [],
        }), 200

    # 2. Compute aggregates
    total_reviews = len(reviews)
    total_replied = sum(1 for r in reviews if r.get("status") == "replied")
    ratings = [r["rating"] for r in reviews if r.get("rating")]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    reply_rate = round((total_replied / total_reviews) * 100) if total_reviews else 0

    # 3. Build daily buckets for the last 14 days
    cutoff = datetime.utcnow() - timedelta(days=14)
    daily_map = {}

    for r in reviews:
        created = r.get("created_at", "")
        if not created:
            continue
        # Parse ISO timestamp to date string
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            continue

        if dt < cutoff:
            continue

        day_key = dt.strftime("%b %d")  # e.g. "Mar 27"
        if day_key not in daily_map:
            daily_map[day_key] = {"total": 0, "count": 0}
        daily_map[day_key]["total"] += r.get("rating", 0)
        daily_map[day_key]["count"] += 1

    # Convert to sorted list (oldest first for chart rendering)
    daily_ratings = []
    for i in range(14, -1, -1):
        d = datetime.utcnow() - timedelta(days=i)
        key = d.strftime("%b %d")
        bucket = daily_map.get(key)
        if bucket and bucket["count"] > 0:
            daily_ratings.append({
                "date": key,
                "avg": round(bucket["total"] / bucket["count"], 1),
                "count": bucket["count"],
            })
        else:
            daily_ratings.append({"date": key, "avg": 0, "count": 0})

    return jsonify({
        "avg_rating": avg_rating,
        "total_reviews": total_reviews,
        "total_replied": total_replied,
        "reply_rate": reply_rate,
        "daily_ratings": daily_ratings,
    }), 200
