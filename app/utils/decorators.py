from functools import lru_cache, wraps

from flask import g, request
from marshmallow import ValidationError

from app.extensions import supabase
from app.models.user_model import get_user_by_id
from app.utils.errors import build_error
from app.utils.exceptions import AuthRequired


@lru_cache(maxsize=1000)
def _verify_token_with_supabase(token: str):
    """
    Caches the Supabase network verification for the token to prevent rapid 
    concurrent API requests from rate-limiting the user into a 401 redirect loop.
    Token itself naturally rotates so this cache is self-cleaning.
    """
    return supabase.auth.get_user(token)

def require_auth(f):
    """
    Reads the JWT from the session_token httpOnly cookie.
    Verifies it with Supabase, then fetches the public.users profile row.
    Injects g.current_user on success.
    Returns 401 AUTH_REQUIRED on any failure — never 403.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("session_token")
        if not token:
            raise AuthRequired()

        try:
            # Use local memory cache for this specific raw JWT string
            user_response = _verify_token_with_supabase(token)
            # Supabase auth user object
            auth_user = user_response.user
            
            # Phase 13 Hardening: Enforce email verification
            if not getattr(auth_user, 'email_confirmed_at', None):
                from app.utils.errors import build_error
                return build_error(
                    "EMAIL_UNVERIFIED", 
                    details="Please verify your email address to access this resource."
                ), 403

            user_id = auth_user.id
        except Exception:
            raise AuthRequired()

        user = get_user_by_id(user_id)
        if not user or user.get("is_deleted"):
            raise AuthRequired()

        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def require_admin(f):
    """
    Extends require_auth to ensure the user has the is_admin boolean set to TRUE.
    Returns 403 FORBIDDEN if the user is authenticated but not an admin.
    """
    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        if not g.current_user.get("is_admin", False):
            from app.utils.errors import build_error
            return build_error("FORBIDDEN", details="You do not have permission to access the admin panel."), 403
        return f(*args, **kwargs)

    return decorated


def validate_request(schema_class):
    """
    Validates request.json against the given Marshmallow schema.
    Injects g.validated_data on success.
    Returns 400 VALIDATION_ERROR with field-level error details on failure.
    """

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            schema = schema_class()
            try:
                g.validated_data = schema.load(request.json or {})
            except ValidationError as e:
                return build_error("VALIDATION_ERROR", details=e.messages)
            return f(*args, **kwargs)

        return decorated

    return decorator
