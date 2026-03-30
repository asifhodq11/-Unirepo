import time
from flask import Blueprint, jsonify
from app.utils.logger import log_event
from app.utils.decorators import require_auth
from run_poller import run_google_poller
from app.utils.exceptions import PollerError

poller_bp = Blueprint("poller", __name__)

@poller_bp.route("/trigger", methods=["POST"])
@require_auth
def trigger_poller():
    """
    Manually invokes the background Google Poller Engine.
    Requires authentication to ensure random hits don't spam the DB.
    """
    log_event("poller_manual_trigger_started")
    try:
        start_time = time.time()
        # Since we are already inside a Flask request context, 
        # we can just call the poller function directly.
        run_google_poller()
        duration = round(time.time() - start_time, 2)
        
        log_event("poller_manual_trigger_success", duration_seconds=duration)
        return jsonify({"status": "success", "message": f"Poller ran successfully in {duration}s"}), 200
        
    except PollerError as e:
        log_event("poller_manual_trigger_failed", stage=e.details.get("stage"), error=e.details.get("message"))
        return jsonify({
            "status": "error", 
            "message": e.details.get("message") or "Poller failed critically."
        }), 500
        
    except Exception as e:
        log_event("poller_manual_trigger_unexpected_failed", error=str(e))
        return jsonify({"status": "error", "message": "An unexpected error occurred during polling."}), 500
