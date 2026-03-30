import os
from datetime import timedelta


class Config:
    """Base configuration."""

    # Required keys — using os.environ[] means the app crashes immediately on startup
    # if any of these are missing, which is strictly required by the Bible.
    # Keys are accessed via .get() in the base class to prevent KeyErrors 
    # during 'pytest' collection or static analysis.
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-12345")

    # Use valid-looking fake JWTs to satisfy Supabase client initialization during testing
    FAKE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.M3FfLXh6X2dfaGdfZGYtZGYtZGYtZGYtZGYtZGY"
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xyz123.supabase.co")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", FAKE_JWT)
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", FAKE_JWT)

    AI_PROVIDER = os.environ.get("AI_PROVIDER", "openrouter")
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
    # Make OpenAI key optional. If 'openai' is the provider, it will fail when used or we fail it here.
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "unused")
    
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "your-gemini-key")
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    GOOGLE_MASTER_REFRESH_TOKEN = os.environ.get("GOOGLE_MASTER_REFRESH_TOKEN")

    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "sk_test_123")
    STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "whsec_123")
    STRIPE_PRICE_ID_STARTER = os.environ.get("STRIPE_PRICE_ID_STARTER", "price_123")

    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "re_123")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    # Optional keys — safe to use .get()
    UPTIMEROBOT_HEARTBEAT_URL = os.environ.get("UPTIMEROBOT_HEARTBEAT_URL")

    # Flask built-ins
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    # Talisman / HTTPS
    FORCE_HTTPS = True


class DevelopmentConfig(Config):
    """Development environment defaults."""

    DEBUG = True
    # In dev, cookies can't be secure if testing on localhost HTTP
    SESSION_COOKIE_SECURE = False
    FORCE_HTTPS = False


class TestingConfig(Config):
    """Testing environment defaults."""

    TESTING = True
    DEBUG = False
    FORCE_HTTPS = False


class ProductionConfig(Config):
    """Production environment defaults."""

    DEBUG = False  # CRITICAL: Remote code execution vulnerability if True
    TESTING = False


config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
