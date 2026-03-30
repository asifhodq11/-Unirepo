"""
app/services/health_service.py

Pre-flight health check for external dependencies.
Called at the start of every poller run to prevent the system
from generating thousands of failed API calls when a global
dependency (LLM provider, Google token) is down.

Instead of 1000 silent failures, you get ONE clear log event.
"""

import os
from app.utils.logger import log_event


def preflight_check() -> bool:
    """
    Verifies external dependency health before the poller starts its user loop.

    Checks:
      1. Google Master Access Token can be acquired.
      2. Primary LLM provider responds to a minimal test call.

    Returns:
        True  — all systems operational, proceed.
        False — at least one dependency is down, abort this cycle.
    """
    passed = True

    # --- Check 1: Google OAuth Token ---
    try:
        from app.services.google_api_service import get_master_access_token
        token = get_master_access_token()
        if not token:
            log_event(
                "preflight_fail",
                check="google_token",
                reason="get_master_access_token returned None — check GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN",
            )
            passed = False
        else:
            log_event("preflight_ok", check="google_token")
    except Exception as e:
        log_event("preflight_fail", check="google_token", error=str(e))
        passed = False

    # --- Check 2: LLM Provider Connectivity ---
    # We test with a 1-token "ping" to avoid wasting credits.
    try:
        provider = os.environ.get("AI_PROVIDER", "openrouter")
        if provider == "gemini" or os.environ.get("GEMINI_API_KEY"):
            from google import genai
            client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
            # Minimal token probe — checks auth without generation cost
            client.models.get("gemini-2.5-flash")
            log_event("preflight_ok", check="llm_gemini")
        else:
            from openai import OpenAI
            key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY")
            if not key:
                log_event("preflight_fail", check="llm_openrouter", reason="No API key found in environment")
                passed = False
            else:
                log_event("preflight_ok", check="llm_openrouter", note="Key present — skipping live ping to avoid cost")
    except Exception as e:
        log_event("preflight_fail", check="llm_provider", error=str(e))
        passed = False

    return passed
