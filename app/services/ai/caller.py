"""
app/services/ai/caller.py

Unified LLM Router.
Handles provider switching (Gemini / OpenAI / OpenRouter) and resilient retries.
"""

import os
import time
from openai import OpenAI
from app.utils.exceptions import AIServiceError


from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import openai

# Circuit Breaker state (Simulated robustly for sync execution)
_FAILURE_COUNT = 0
_LAST_FAILURE_TIME = 0.0
_BREAKER_THRESHOLD = 5
_RECOVERY_TIME = 60.0  # seconds

def get_openai_client() -> OpenAI:
    """Returns an OpenAI-compatible client based on the current AI_PROVIDER."""
    provider = os.environ.get("AI_PROVIDER", "openrouter")
    key_name = "OPENROUTER_API_KEY" if provider == "openrouter" else "OPENAI_API_KEY"
    key = os.environ.get(key_name)
    if not key:
        raise ValueError(f"{key_name} missing in environment for provider {provider}.")
        
    if provider == "openrouter":
        return OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1", timeout=60.0)
    return OpenAI(api_key=key, timeout=60.0)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.InternalServerError)),
    reraise=True
)
def _execute_llm_call(client, model_id, system_prompt, user_prompt, temperature):
    """Internal retriable execution unit."""
    return client.chat.completions.create(
        model=model_id,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )

def call_llm(system_prompt: str, user_prompt: str, model_id: str, temperature: float = 0.75) -> tuple[str, int]:
    """
    Unified abstract caller with Circuit Breaker and Exponential Backoff.
    """
    global _FAILURE_COUNT, _LAST_FAILURE_TIME

    # check Circuit Breaker
    if _FAILURE_COUNT >= _BREAKER_THRESHOLD:
        if time.time() - _LAST_FAILURE_TIME < _RECOVERY_TIME:
            raise AIServiceError(
                attempt=0, 
                model=model_id, 
                error="Circuit Breaker OPEN: AI Service temporarily disabled for safety."
            )
        else:
            # RESET on timeout (Half-Open state)
            _FAILURE_COUNT = 0

    try:
        client = get_openai_client()
        response = _execute_llm_call(client, model_id, system_prompt, user_prompt, temperature)
        
        # Success logic
        _FAILURE_COUNT = 0
        tokens = response.usage.total_tokens if hasattr(response, "usage") and response.usage else 0
        return response.choices[0].message.content.strip(), tokens

    except Exception as e:
        _FAILURE_COUNT += 1
        _LAST_FAILURE_TIME = time.time()
        
        # Handle specific error types
        err_msg = str(e).lower()
        if "billing" in err_msg or "authentication" in err_msg:
            # Fatal/Critical - trip breaker immediately
            _FAILURE_COUNT = _BREAKER_THRESHOLD
            raise
            
        raise AIServiceError(attempt=3, model=model_id, error=str(e))
