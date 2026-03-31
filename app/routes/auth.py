from flask import Blueprint, g, make_response, current_app
import os

from app.extensions import supabase, limiter
from app.models.user_model import create_user, get_user_by_id
from app.schemas.auth_schema import (
    LoginSchema,
    SignupSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    ResendVerificationSchema,
    VerifyEmailSchema,
)
from app.services.gdpr_service import anonymise_user
from app.utils.decorators import require_auth, validate_request
from app.utils.errors import build_error
from app.utils.logger import log_event

auth_bp = Blueprint("auth", __name__)


def _set_session_cookie(response, access_token: str) -> None:
    """
    Set the session_token httpOnly cookie.
    All three required flags: HttpOnly, Secure (env-dependent), SameSite=Lax.
    Secure is False in development — follows the same pattern as SESSION_COOKIE_SECURE
    already set in DevelopmentConfig (config.py).
    """
    secure = current_app.config.get("SESSION_COOKIE_SECURE", True)
    response.set_cookie(
        "session_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="Lax",
        max_age=60 * 60,  # 1 hour — matches Supabase JWT default expiry
    )


def _clear_session_cookie(response) -> None:
    """Remove the session cookie with the same flags it was set with."""
    secure = current_app.config.get("SESSION_COOKIE_SECURE", True)
    response.delete_cookie(
        "session_token",
        httponly=True,
        secure=secure,
        samesite="Lax",
    )


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/signup
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/signup", methods=["POST"])
@limiter.limit("10 per hour")
@validate_request(SignupSchema)
def signup():
    data = g.validated_data

    # Step 1: Create Supabase Auth user (auth.users table)
    try:
        auth_response = supabase.auth.sign_up(
            {
                "email": data["email"],
                "password": data["password"],
            }
        )
    except Exception as e:
        error_message = str(e).lower()
        log_event("signup_auth_error", error=str(e), email=data["email"])
        
        if "rate limit" in error_message:
            return build_error("RATE_LIMIT_EXCEEDED")
        elif "already registered" in error_message or "already exists" in error_message:
            return build_error("EMAIL_EXISTS")
        elif "password" in error_message:
            return build_error("VALIDATION_ERROR", details={"password": [str(e)]})
        else:
            return build_error("SERVER_ERROR", details={"auth_service_error": str(e)})

    if not auth_response.user:
        return build_error("EMAIL_EXISTS")

    # Supabase returns a fake user with empty identities when email already exists
    # and email confirmation is enabled. Detect this to avoid orphaned inserts.
    user_identities = getattr(auth_response.user, "identities", None)
    if user_identities is not None and len(user_identities) == 0:
        return build_error("EMAIL_EXISTS")

    user_id = auth_response.user.id

    # Step 2: Create public.users profile row
    # Uses admin API to guarantee RLS bypass — the service role key
    # client still evaluates RLS policies when auth.uid() is NULL (server context).
    try:
        user = create_user(
            user_id=user_id,
            email=data["email"],
            business_name=data["business_name"],
            business_type=data["business_type"],
            tone_preference=data.get("tone_preference", "friendly"),
        )
    except Exception as e:
        log_event("signup_profile_error", user_id=user_id, error=str(e))
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as del_err:
            log_event("signup_cleanup_error", user_id=user_id, error=str(del_err))
        return build_error("SERVER_ERROR", details="Profile creation failed. Please try again.")

    log_event("user_signup", user_id=user_id, plan="free")

    # If Supabase has email confirmation enabled, session will be None.
    # Return 202 Accepted so the frontend can show "check your inbox" UI.
    if not auth_response.session:
        return {"status": "verification_required", "message": "Check your inbox to verify your email address."}, 202

    response = make_response({"user": user}, 201)
    _set_session_cookie(response, auth_response.session.access_token)
    return response


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/login
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
@limiter.limit("20 per minute")
@validate_request(LoginSchema)
def login():
    data = g.validated_data

    try:
        auth_response = supabase.auth.sign_in_with_password(
            {
                "email": data["email"],
                "password": data["password"],
            }
        )
    except Exception as e:
        error_msg = str(e).lower()
        # Supabase raises an exception (not just returns null session) when email isn't confirmed.
        if "email not confirmed" in error_msg or "not confirmed" in error_msg:
            return build_error("EMAIL_NOT_VERIFIED")
        return build_error("INVALID_CREDENTIALS")

    if not auth_response.user or not auth_response.session:
        return build_error("INVALID_CREDENTIALS")

    user = get_user_by_id(auth_response.user.id)
    if not user:
        # Auth succeeded but no profile row exists — the account was never fully created.
        # JIT Profile Recovery (Target 3 Zombie Fix)
        # Dynamically recover the missing profile row so the user isn't permanently locked out.
        try:
            email_to_use = auth_response.user.email if auth_response.user.email else data["email"]
            user = create_user(
                user_id=auth_response.user.id,
                email=email_to_use,
                business_name="Recovered Account",
                business_type="unknown",
                tone_preference="friendly",
            )
            log_event("zombie_account_recovered", user_id=auth_response.user.id, email=email_to_use)
        except Exception as e:
            log_event("zombie_recovery_failed", user_id=auth_response.user.id, error=str(e))
            return build_error("SERVER_ERROR", details="Account recovery failed.")

    response = make_response({"user": user}, 200)
    _set_session_cookie(response, auth_response.session.access_token)
    return response


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/logout
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    response = make_response({"status": "ok"}, 200)
    _clear_session_cookie(response)
    return response


# ──────────────────────────────────────────────────────────────
# GET /api/v1/auth/me
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    return {"user": g.current_user}, 200


# ──────────────────────────────────────────────────────────────
# DELETE /api/v1/auth/account
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/account", methods=["DELETE"])
@require_auth
def delete_account():
    user_id = g.current_user["id"]
    
    # 1. Anonymise relational data recursively to preserve referential integrity
    anonymise_user(user_id)
    
    # 2. Hard-delete the Supabase Auth Root Identity
    try:
        supabase.auth.admin.delete_user(user_id)
        log_event("auth_identity_purged", user_id=user_id)
    except Exception as e:
        log_event("auth_identity_purge_failed", user_id=user_id, error=str(e))
        
    response = make_response({"status": "deleted"}, 200)
    _clear_session_cookie(response)
    return response


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/forgot-password
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per hour")
@validate_request(ForgotPasswordSchema)
def forgot_password():
    """
    Sends a password reset email via Supabase.
    SECURITY: Always returns HTTP 200 regardless of whether the email exists
    to prevent user enumeration attacks.
    """
    data = g.validated_data
    email = data["email"]
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    try:
        supabase.auth.reset_password_for_email(
            email,
            options={"redirect_to": f"{frontend_url}/reset-password"},
        )
        log_event("password_reset_requested", email=email)
    except Exception as e:
        # Log but do not expose — always return the same message
        log_event("password_reset_error", error=str(e))

    return {"message": "If that email is registered, a reset link has been sent."}, 200


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/reset-password
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per hour")
@validate_request(ResetPasswordSchema)
def reset_password():
    """
    Receives the access_token from the Supabase reset email link and
    updates the user's password.
    """
    data = g.validated_data
    access_token = data["access_token"]
    new_password = data["new_password"]

    try:
        # Set the session using the token from the email link
        supabase.auth.set_session(access_token, "")
        supabase.auth.update_user({"password": new_password})
        log_event("password_reset_success")
    except Exception as e:
        log_event("password_reset_update_failed", error=str(e))
        return build_error("SERVER_ERROR")

    return {"message": "Password updated successfully. Please log in."}, 200


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/resend-verification
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/resend-verification", methods=["POST"])
@limiter.limit("3 per hour")
@validate_request(ResendVerificationSchema)
def resend_verification():
    """
    Resends the email verification link.
    SECURITY: Always returns HTTP 200 to prevent email enumeration.
    """
    data = g.validated_data
    email = data["email"]
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    try:
        supabase.auth.resend({
            "type": "signup",
            "email": email,
            "options": {"email_redirect_to": f"{frontend_url}/auth/callback"},
        })
        log_event("verification_resent", email=email)
    except Exception as e:
        log_event("verification_resend_error", error=str(e))

    return {"message": "If that email is registered and unverified, a new link has been sent."}, 200


# ──────────────────────────────────────────────────────────────
# POST /api/v1/auth/verify-email
# ──────────────────────────────────────────────────────────────
@auth_bp.route("/verify-email", methods=["POST"])
@limiter.limit("10 per hour")
@validate_request(VerifyEmailSchema)
def verify_email():
    """
    Exchanges the access_token from the email confirmation magic link for a
    real session. Sets the httpOnly session cookie and returns the user object.
    Called by AuthCallbackPage.jsx after Supabase redirects the user to /auth/callback.
    """
    data = g.validated_data
    access_token = data["access_token"]

    try:
        # Exchange the OTP / one-time token for a live session
        session_response = supabase.auth.set_session(access_token, "")
        if not session_response or not session_response.user:
            return build_error("TOKEN_INVALID")

        user = get_user_by_id(session_response.user.id)
        if not user:
            return build_error("INVALID_CREDENTIALS")

        log_event("email_verified", user_id=session_response.user.id)
    except Exception as e:
        log_event("email_verify_error", error=str(e))
        return build_error("TOKEN_INVALID")

    response = make_response({"user": user}, 200)
    _set_session_cookie(response, access_token)
    return response
