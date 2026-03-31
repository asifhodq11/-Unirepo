import os
from flask import Flask, request, jsonify
from .config import config_map
from .extensions import limiter, cors, talisman
from .utils.logger import log_event


def create_app(config_name="development"):
    """Assembles the Flask application."""

    # Point Flask to the frontend distribution folder
    # In production, this will be in the same root
    template_dir = os.path.abspath("frontend/dist")
    static_dir = os.path.abspath("frontend/dist/assets")

    app = Flask(
        __name__, 
        template_folder=template_dir,
        static_folder=static_dir,
        static_url_path="/assets"
    )
    app.url_map.strict_slashes = False

    # Load completely isolated environment config
    app.config.from_object(config_map[config_name])

    # 1. Attach Extensions
    limiter.init_app(app)

    # Enable CORS
    # If same-domain, we allow all origins from our own host
    cors.init_app(app, origins=[app.config["FRONTEND_URL"]], supports_credentials=True)

    # Enforce security headers & HTTPS
    talisman.init_app(app, force_https=app.config.get("FORCE_HTTPS", False))

    # 2. Register Blueprints
    from .routes.auth import auth_bp
    from .routes.reviews import reviews_bp
    from .routes.approvals import approvals_bp
    from .routes.settings import settings_bp
    from .routes.payments import payments_bp
    from .routes.health import health_bp
    from .routes.webhooks import webhooks_bp
    from .routes.poller import poller_bp
    from .routes.analytics import analytics_bp
    from .routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(reviews_bp, url_prefix="/api/v1/reviews")
    app.register_blueprint(approvals_bp, url_prefix="/api/v1/approve")
    app.register_blueprint(settings_bp, url_prefix="/api/v1/settings")
    app.register_blueprint(payments_bp, url_prefix="/api/v1/payments")
    app.register_blueprint(webhooks_bp, url_prefix="/api/v1/webhooks")
    app.register_blueprint(poller_bp, url_prefix="/api/v1/poller")
    app.register_blueprint(analytics_bp, url_prefix="/api/v1/analytics")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")

    # Health endpoint sits at /api/v1/health
    app.register_blueprint(health_bp, url_prefix="/api/v1")

    # Disable Caching on All API Responses
    @app.after_request
    def add_cache_control(response):
        if request.path.startswith("/api/v1"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    # 3. Serve Frontend (Catch-all for SPA)
    from flask import send_from_directory

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        full_path = os.path.join(app.template_folder, path)
        if path != "" and os.path.exists(full_path):
            return send_from_directory(app.template_folder, path)
        
        # Default to index.html for SPA routing or root
        index_path = os.path.join(app.template_folder, "index.html")
        if not os.path.exists(index_path):
            log_event("frontend_build_missing", path=index_path)
            return jsonify({"error": "Frontend build files (index.html) not found. Check build logs."}), 500
            
        return send_from_directory(app.template_folder, "index.html")

    # 4. Register Global Error Handlers
    from werkzeug.exceptions import HTTPException
    from .utils.errors import build_error, build_error_from_exception
    from .utils.exceptions import ReplyIQError
    from marshmallow import ValidationError as MarshmallowValidationError

    @app.errorhandler(ReplyIQError)
    def handle_replyiq_error(exc):
        log_event("expected_error", code=exc.error_code, status=exc.http_status)
        return build_error_from_exception(exc)

    @app.errorhandler(429)
    def handle_rate_limit(exc):
        log_event("rate_limit_hit", path=request.path, ip=request.remote_addr)
        return build_error("RATE_LIMIT_EXCEEDED")

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        log_event("http_exception", code=exc.code, path=request.path)
        code_map = {
            404: "REVIEW_NOT_FOUND",
            405: "VALIDATION_ERROR",
            400: "VALIDATION_ERROR",
        }
        error_code = code_map.get(exc.code, "SERVER_ERROR")
        return build_error(error_code, status=exc.code)

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        import traceback

        log_event(
            "unhandled_exception",
            exception_type=type(exc).__name__,
            exception_message=str(exc),
            path=request.path,
            traceback=traceback.format_exc(),
        )
        return build_error("SERVER_ERROR")

    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow_error(exc):
        log_event("validation_error", fields=str(exc.messages))
        return build_error("VALIDATION_ERROR", details={"fields": exc.messages})

    # Log initial startup (Event 1 from JSON Logger Requirements)
    # We delay the import subtly or just pass no params to avoid errors during test setup
    log_event("app_started", environment=config_name, version="1.0.0")

    return app
