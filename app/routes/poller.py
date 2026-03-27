"""
app/routes/poller.py

API endpoint for triggering the simulation poller (Track A) on demand.
Replaces the need to run `python run_poller.py` manually via the CLI.
"""

from flask import Blueprint, g, jsonify

from app.utils.decorators import require_auth
from app.utils.logger import log_event

poller_bp = Blueprint("poller", __name__)


@poller_bp.route("/trigger", methods=["POST"])
@require_auth
def trigger_poller():
    """
    Triggers the simulation poller synchronously.

    Requires an authenticated session. Logs the triggering user for audit
    purposes and returns a JSON status response.
    """
    user = g.current_user
    user_id = user["id"]

    log_event("poller_trigger_requested", user_id=user_id)

    try:
        from run_poller import run_simulation_poller

        run_simulation_poller()
    except Exception as e:
        log_event(
            "poller_trigger_failed",
            user_id=user_id,
            error=str(e),
            level="error",
        )
        return jsonify({"status": "error", "message": str(e)}), 500

    log_event("poller_trigger_completed", user_id=user_id)

    return jsonify({"status": "success", "message": "Poller triggered successfully"}), 200
