import pytest
import asyncio
from unittest.mock import patch, MagicMock
from aiobreaker import CircuitBreakerError
from app.services.ai.caller import call_llm
from app.utils.exceptions import AIServiceError

@pytest.mark.asyncio
async def test_circuit_breaker_trips_on_consecutive_failures():
    """
    TDD RED: This test should FAIL because call_llm currently 
    has no Circuit Breaker implemented.
    """
    # 1. Mock the client to always fail with a 500
    with patch("app.services.ai.caller.get_openai_client") as mock_get:
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Down")
        mock_get.return_value = mock_client

        # 2. Call multiple times to hit the threshold (default usually 5)
        # We expect aiobreaker to raise CircuitBreakerError after the threshold
        with pytest.raises((AIServiceError, CircuitBreakerError)):
            for _ in range(10):
                call_llm("system", "user", "model-id")
                
        # 3. If a breaker was present, the mock_client shouldn't have been 
        # called 10*3 times (attempt loop) — it should have been cut off.
        assert mock_client.chat.completions.create.call_count < 30
