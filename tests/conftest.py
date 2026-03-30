import os

# We must set these environment variables before the app factory runs
# because config.py uses os.environ['KEY'] to ensure aggressive failure.
os.environ['SECRET_KEY'] = 'test-secret-key-for-unit-tests'

# Use valid-looking fake JWTs to satisfy Supabase client initialization
FAKE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.M3FfLXh6X2dfaGdfZGYtZGYtZGYtZGYtZGYtZGY"
os.environ['SUPABASE_URL'] = 'https://xyz123.supabase.co'
os.environ['SUPABASE_ANON_KEY'] = FAKE_JWT
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = FAKE_JWT

os.environ['OPENAI_API_KEY'] = 'test-openai-key'
os.environ['GEMINI_API_KEY'] = 'test-gemini-key'
os.environ['GOOGLE_API_KEY'] = 'test-google-key'
os.environ['STRIPE_SECRET_KEY'] = 'test-stripe-key'
os.environ['STRIPE_WEBHOOK_SECRET'] = 'test-webhook-secret'
os.environ['STRIPE_PRICE_ID_STARTER'] = 'test-price-id'
os.environ['FRONTEND_URL'] = 'http://test.localhost'
os.environ['RESEND_API_KEY'] = 'test-resend-key'

import pytest
from unittest.mock import MagicMock, patch

@pytest.fixture
def mock_auth():
    """Patches auth decorator and user retrieval globally for a test."""
    from datetime import datetime
    user_id = "bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb"
    fake_user = {
        "id": user_id,
        "email": "test@example.com",
        "business_name": "Test Biz",
        "plan": "free",
        "is_admin": False,
        "is_deleted": False,
        "email_confirmed_at": datetime.now().isoformat()
    }
    
    with patch("app.utils.decorators.supabase") as mock_sb, \
         patch("app.utils.decorators.get_user_by_id", return_value=fake_user):
        
        # Configure auth_user mock for require_auth
        auth_user = MagicMock()
        auth_user.id = user_id
        auth_user.email_confirmed_at = datetime.now()
        
        mock_user_resp = MagicMock()
        mock_user_resp.user = auth_user
        mock_sb.auth.get_user.return_value = mock_user_resp
        
        yield fake_user
