from flask import Blueprint, jsonify, request
from app.utils.decorators import require_admin
from app.extensions import supabase
from app.utils.errors import build_error
import math

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard", methods=["GET"])
@require_admin
def dashboard_stats():
    """
    Returns high-level business metrics strictly for the Internal Admin UI.
    Requires is_admin=true flag on the authenticated user.
    """
    try:
        # 1. User Metrics
        users_count_req = supabase.from_("users").select("id", count="exact").eq("is_deleted", False).execute()
        total_users = users_count_req.count if users_count_req.count is not None else 0

        # We can approximate MRR safely by counting user plans.
        # Assuming typical plans: "starter", "pro", "free"
        pro_count_req = supabase.from_("users").select("id", count="exact").eq("plan", "pro").eq("is_deleted", False).execute()
        pro_users = pro_count_req.count if pro_count_req.count is not None else 0
        
        starter_count_req = supabase.from_("users").select("id", count="exact").eq("plan", "starter").eq("is_deleted", False).execute()
        starter_users = starter_count_req.count if starter_count_req.count is not None else 0

        # Hardcoded approximations based on typical ReplyIQ tier prices
        # Pro = $49/mo, Starter = $19/mo
        estimated_mrr = (pro_users * 49) + (starter_users * 19)

        # 2. Financial Safety Metrics (AI Cost)
        # Fetching all replies cost for V1 MVP. 
        # For production with millions of replies, move to a Postgres RPC.
        # Supabase defaults to 1000 rows max via API, so we fetch all pages of cost explicitly.
        total_cost = 0.0
        total_tokens = 0
        total_replies = 0

        # Iterate via range pagination to overcome 1000 row limit safely
        page = 0
        page_size = 1000
        while True:
            replies_page = supabase.from_("replies").select("cost_usd, tokens_used").range(page * page_size, (page + 1) * page_size - 1).execute()
            if not replies_page.data:
                break
                
            total_replies += len(replies_page.data)
            for row in replies_page.data:
                total_cost += float(row.get("cost_usd") or 0.0)
                total_tokens += int(row.get("tokens_used") or 0)
                
            if len(replies_page.data) < page_size:
                break
            page += 1

        margin_usd = estimated_mrr - total_cost

        return jsonify({
            "users": {
                "total": total_users,
                "pro": pro_users,
                "starter": starter_users
            },
            "financials": {
                "mrr": round(estimated_mrr, 2),
                "ai_cost": round(total_cost, 4),
                "margin": round(margin_usd, 2)
            },
            "usage": {
                "total_replies": total_replies,
                "total_tokens": total_tokens
            }
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return build_error("SERVER_ERROR", details="Failed to compile admin stats: " + str(e)), 500


@admin_bp.route("/users", methods=["GET"])
@require_admin
def list_users():
    """
    Returns a paginated list of all users on the platform for the internal admin table.
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        offset = (page - 1) * per_page

        count_req = supabase.from_("users").select("id", count="exact").execute()
        total = count_req.count if count_req.count is not None else 0

        users_req = (
            supabase.from_("users")
            .select("id, email, business_name, plan, reply_count_this_month, created_at, google_connected, google_location_id")
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        )

        users_list = users_req.data or []

        return jsonify({
            "items": users_list,
            "total": total,
            "page": page,
            "pages": math.ceil(total / per_page)
        }), 200

    except Exception as e:
        return build_error("SERVER_ERROR", details="Failed to fetch user list."), 500


@admin_bp.route("/users/<user_id>/google-config", methods=["PUT"])
@require_admin
def update_google_config(user_id):
    """
    Updates the google_connected and google_location_id for a specific user.
    """
    try:
        data = request.get_json()
        if not data:
            return build_error("BAD_REQUEST", details="Missing payload"), 400
        
        update_data = {}
        if "google_connected" in data:
            update_data["google_connected"] = bool(data["google_connected"])
        if "google_location_id" in data:
            # allow clearing it out with empty string
            update_data["google_location_id"] = str(data["google_location_id"]) if data["google_location_id"] else None
            
        if not update_data:
             return build_error("BAD_REQUEST", details="No fields to update"), 400
             
        res = supabase.from_("users").update(update_data).eq("id", str(user_id)).execute()
        if not res.data:
            return build_error("NOT_FOUND", details="User not found or update failed"), 404
            
        return jsonify({
            "message": "Successfully updated Google configuration", 
            "google_connected": res.data[0].get("google_connected"),
            "google_location_id": res.data[0].get("google_location_id")
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return build_error("SERVER_ERROR", details="Failed to update Google config: " + str(e)), 500
