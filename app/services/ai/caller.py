"""
app/services/ai/caller.py

Unified LLM Router.
Handles provider switching (Gemini / OpenAI / OpenRouter) and resilient retries.
"""

import os
import time
from openai import OpenAI
from google import genai
from app.utils.exceptions import AIServiceError

def get_gemini_client():
    """Lazy loader for Gemini client."""
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY missing in environment.")
    return genai.Client(api_key=key)

def get_openai_client() -> OpenAI:
    """Returns an OpenAI-compatible client based on the current AI_PROVIDER."""
    provider = os.environ.get("AI_PROVIDER", "openrouter")
    key_name = "OPENROUTER_API_KEY" if provider == "openrouter" else "OPENAI_API_KEY"
    key = os.environ.get(key_name)
    if not key:
        raise ValueError(f"{key_name} missing in environment for provider {provider}.")
        
    if provider == "openrouter":
        return OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1", timeout=90.0)
    return OpenAI(api_key=key, timeout=90.0)

def call_llm(system_prompt: str, user_prompt: str, model_id: str, temperature: float = 0.75) -> tuple[str, int]:
    """
    Unified abstract caller. Routes execution dynamically and handles transient errors.
    Returns (response_text, total_tokens).
    """
    import openai

    provider = os.environ.get("AI_PROVIDER", "openrouter")

    for attempt in range(1, 4):
        try:
            # 1. Gemini Path (Direct SDK) - Only if NOT using OpenRouter as a proxy
            if "gemini" in model_id.lower() and os.environ.get("GEMINI_API_KEY") and provider != "openrouter":
                clean_model_id = model_id.replace("google/", "").split(":")[0]
                if "preview" in clean_model_id:
                    clean_model_id = "gemini-2.0-flash"

                # Lazy-load only when specifically calling Gemini direct
                response = get_gemini_client().models.generate_content(
                    model=clean_model_id,
                    contents=user_prompt,
                    config={
                        "system_instruction": system_prompt,
                        "temperature": temperature,
                    },
                )
                tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
                return response.text.strip(), tokens

            # 2. OpenAI / OpenRouter Path
            response = get_openai_client().chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
            )
            tokens = response.usage.total_tokens if hasattr(response, "usage") and response.usage else 0
            return response.choices[0].message.content.strip(), tokens

        except (openai.RateLimitError, openai.APITimeoutError):
            if attempt < 3:
                time.sleep(2 ** attempt)
        except Exception as e:
            # Re-raise critical auth/status errors for the exception handler
            if "billing" in str(e).lower() or "authentication" in str(e).lower():
                raise
            if attempt == 3:
                raise AIServiceError(attempt=3, model=model_id, error=str(e))
    
    raise AIServiceError(attempt=3, model=model_id)
