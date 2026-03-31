import threading
import time
from flask import Blueprint, jsonify, current_app
from app.utils.logger import log_event
from app.utils.decorators import require_auth
from run_poller import run_google_poller
from app.utils.exceptions import PollerError

poller_bp = Blueprint("poller", __name__)

@poller_bp.route("/trigger", methods=["POST"])
@require_auth
def trigger_poller():
    """
    Manually invokes the background Google Poller Engine in a non-blocking thread.
    Requires authentication to ensure random hits don't spam the DB.
    """
    log_event("poller_manual_trigger_started")
    
    # Define the worker function with app_context if needed (usually safe since it's a separate script)
    # but run_google_poller is designed to be standalone.
    def run_worker(app_instance):
        with app_instance.app_context():
            try:
                start_time = time.time()
                run_google_poller()
                duration = round(time.time() - start_time, 2)
                log_event("poller_manual_trigger_success_async", duration_seconds=duration)
            except Exception as e:
                log_event("poller_manual_trigger_async_failed", error=str(e))

    try:
        # Get the underlying application instance
        app = current_app._get_current_object()
        
        # Start in background thread
        thread = threading.Thread(target=run_worker, args=(app,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "status": "accepted",
            "message": "Poller scan started in background. Results will appear in history soon."
        }), 202
        
    except Exception as e:
        log_event("poller_manual_trigger_init_failed", error=str(e))
        return jsonify({"status": "error", "message": "Could not initiate background scan."}), 500
