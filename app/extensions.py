# ============================================================
# ReplyIQ Backend — Extensions
# Initialized once, imported everywhere
# ============================================================

import os
from supabase import create_client, Client
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_talisman import Talisman

# 1. Database client — ONE instance, shared across the entire application
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or "xyz123" in supabase_url:
    raise ValueError("CRITICAL: SUPABASE_URL is missing or invalid in environment.")
if not supabase_key or len(supabase_key) < 50:
    raise ValueError("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing or invalid.")

supabase: Client = create_client(supabase_url, supabase_key)

# 2. Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"], storage_uri="memory://")

# 3. CORS — configured in create_app to FRONTEND_URL
cors = CORS()

# 4. HTTPS enforcement + security headers
talisman = Talisman()
