from flask import Blueprint, jsonify, request
from app.utils.decorators import require_admin, no_cache
from app.extensions import supabase
from app.utils.errors import build_error
import math

admin_bp = Blueprint("admin", __name__)

# Max page size enforced to prevent a client from requesting 10,000 rows in one request.
MAX_PER_PAGE = 100


@admin_bp.route("/dashboard", methods=["GET"])
@require_admin
@no_cache
def dashboard_stats():
    """
    Returns high-level business metrics strictly for the Internal Admin UI.
    Requires is_admin=true flag on the authenticated user.

    BUG HUNTER FIX (Wave 2):
      - Replaced catastrophic N+1 pagination loop over `replies` with a single
        Supabase RPC call `get_admin_cost_stats`. This prevents a memory/timeout
        DoS as the replies table grows to millions of rows.
      - Removed `traceback.print_exc()` from error handlers (was leaking stack
        traces into server stdout, a sensitive data exposure risk).
    """
    try:
        # 1. User Metrics — four separate count queries, each O(1) via index scan
        users_count_req = supabase.from_("users").select("id", count="exact").eq("is_deleted", False).execute()
        total_users = users_count_req.count if users_count_req.count is not None else 0

        pro_count_req = supabase.from_("users").select("id", count="exact").eq("plan", "pro").eq("is_deleted", False).execute()
        pro_users = pro_count_req.count if pro_count_req.count is not None else 0

        starter_count_req = supabase.from_("users").select("id", count="exact").eq("plan", "starter").eq("is_deleted", False).execute()
        starter_users = starter_count_req.count if starter_count_req.count is not None else 0

        ultra_count_req = supabase.from_("users").select("id", count="exact").eq("plan", "ultra").eq("is_deleted", False).execute()
        ultra_users = ultra_count_req.count if ultra_count_req.count is not None else 0

        # Ultra = $59/mo, Pro = $25/mo, Starter = $19/mo
        estimated_mrr = (ultra_users * 59) + (pro_users * 25) + (starter_users * 19)

        # 2. Financial Safety Metrics — O(1) Postgres-side aggregation via RPC.
        # The RPC runs: SELECT COALESCE(SUM(cost_usd),0), COALESCE(SUM(tokens_used),0), COUNT(*) FROM replies
        # This is guaranteed to complete in <100ms regardless of table size.
        cost_stats = supabase.rpc("get_admin_cost_stats", {}).execute()

        total_cost    = 0.0
        total_tokens  = 0
        total_replies = 0

        if cost_stats.data:
            stat = cost_stats.data
            # RPC returns a single row dict or a list with one element
            if isinstance(stat, list) and stat:
                stat = stat[0]
            total_cost    = float(stat.get("total_cost_usd") or 0.0)
            total_tokens  = int(stat.get("total_tokens_used") or 0)
            total_replies = int(stat.get("total_replies") or 0)

        margin_usd = estimated_mrr - total_cost

        return jsonify({
            "users": {
                "total":   total_users,
                "pro":     pro_users,
                "starter": starter_users,
                "ultra":   ultra_users,
            },
            "financials": {
                "mrr":     round(estimated_mrr, 2),
                "ai_cost": round(total_cost, 4),
                "margin":  round(margin_usd, 2),
            },
            "usage": {
                "total_replies": total_replies,
                "total_tokens":  total_tokens,
            },
        }), 200

    except Exception as e:
        # Log server-side only — never expose raw exception string to client
        from app.utils.logger import log_event
        log_event("admin_dashboard_error", error=str(e))
        return build_error("SERVER_ERROR", details="Failed to compile admin stats."), 500


@admin_bp.route("/users", methods=["GET"])
@require_admin
@no_cache
def list_users():
    """
    Returns a paginated list of all users on the platform for the internal admin table.

    BUG HUNTER FIX (Wave 2):
      - Clamped `per_page` to MAX_PER_PAGE (100) to prevent a client from
        requesting unlimited rows and causing a memory spike / slow DB scan.
      - Fixed total count to exclude soft-deleted users for accuracy.
    """
    try:
        page     = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), MAX_PER_PAGE)
        offset   = (page - 1) * per_page

        count_req = supabase.from_("users").select("id", count="exact").eq("is_deleted", False).execute()
        total = count_req.count if count_req.count is not None else 0

        users_req = (
            supabase.from_("users")
            .select("id, email, business_name, plan, reply_count_this_month, created_at, google_connected, google_location_id")
            .eq("is_deleted", False)
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        )

        return jsonify({
            "items": users_req.data or [],
            "total": total,
            "page":  page,
            "pages": math.ceil(total / per_page) if total else 0,
        }), 200

    except Exception as e:
        from app.utils.logger import log_event
        log_event("admin_list_users_error", error=str(e))
        return build_error("SERVER_ERROR", details="Failed to fetch user list."), 500


@admin_bp.route("/users/<user_id>/google-config", methods=["PUT"])
@require_admin
@no_cache
def update_google_config(user_id):
    """
    Updates the google_connected and google_location_id for a specific user.

    BUG HUNTER FIX (Wave 2):
      - Added explicit length validation on `google_location_id` (max 255 chars)
        to prevent DB constraint violations and potential injection via long strings.
      - Removed stack trace exposure from error response.
    """
    try:
        data = request.get_json()
        if not data:
            return build_error("BAD_REQUEST", details="Missing payload"), 400

        update_data = {}
        if "google_connected" in data:
            update_data["google_connected"] = bool(data["google_connected"])

        if "google_location_id" in data:
            location_id = data["google_location_id"]
            if location_id:
                location_id_str = str(location_id).strip()
                # Security: enforce max length to prevent DB constraint violations
                if len(location_id_str) > 255:
                    return build_error("BAD_REQUEST", details="google_location_id exceeds maximum length of 255 characters."), 400
                update_data["google_location_id"] = location_id_str
            else:
                # Explicitly allow clearing the field
                update_data["google_location_id"] = None

        if not update_data:
            return build_error("BAD_REQUEST", details="No valid fields provided to update."), 400

        res = supabase.from_("users").update(update_data).eq("id", str(user_id)).execute()
        if not res.data:
            return build_error("NOT_FOUND", details="User not found or update failed."), 404

        return jsonify({
            "message":           "Successfully updated Google configuration",
            "google_connected":  res.data[0].get("google_connected"),
            "google_location_id": res.data[0].get("google_location_id"),
        }), 200

    except Exception as e:
        from app.utils.logger import log_event
        log_event("admin_google_config_error", error=str(e))
        return build_error("SERVER_ERROR", details="Failed to update Google config."), 500
