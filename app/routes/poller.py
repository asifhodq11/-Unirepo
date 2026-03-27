import time
from flask import Blueprint, jsonify
from app.utils.logger import log_event
from app.utils.decorators import require_auth
from run_poller import run_simulation_poller

poller_bp = Blueprint("poller", __name__)

@poller_bp.route("/trigger", methods=["POST"])
@require_auth
def trigger_poller():
    """
    Manually invokes the background Simulation Engine.
    Requires authentication to ensure random hits don't spam the DB.
    """
    log_event("poller_manual_trigger_started")
    try:
        start_time = time.time()
        # Since we are already inside a Flask request context, 
        # we can just call the poller function directly.
        run_simulation_poller()
        duration = round(time.time() - start_time, 2)
        
        log_event("poller_manual_trigger_success", duration_seconds=duration)
        return jsonify({"status": "success", "message": f"Simulation ran successfully in {duration}s"}), 200
        
    except Exception as e:
        log_event("poller_manual_trigger_failed", error=str(e))
        return jsonify({"status": "error", "message": "Simulation failed to run."}), 500
