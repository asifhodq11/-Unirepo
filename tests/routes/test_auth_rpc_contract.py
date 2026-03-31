"""
tests/routes/test_auth_rpc_contract.py

Contract tests for app.models.user_model.create_user()
These verify the exact Supabase RPC interface — parameter names, error
handling on empty data, and dict passthrough — so any refactor that breaks
the contract immediately surfaces here rather than silently in production.

Test IDs:
  E. create_user calls supabase.rpc with the exact expected param names
  F. create_user raises RuntimeError when RPC returns no data
  G. create_user returns the RPC data dict directly (passthrough)
"""

import pytest
from unittest.mock import MagicMock, patch, call


FAKE_USER_ID   = "cccccccc-2222-2222-2222-cccccccccccc"
FAKE_USER_ROW  = {
    "id":            FAKE_USER_ID,
    "email":         "rpc@example.com",
    "business_name": "RPC Cafe",
    "business_type": "restaurant",
    "plan":          "free",
}


# ──────────────────────────────────────────────────────────────
# Test E — RPC is called with the exact parameter dict
# ──────────────────────────────────────────────────────────────

def test_create_user_rpc_called_with_correct_params():
    """
    Guard against accidental param-name renames (p_id → id, etc).
    The Supabase RPC function signature is a hard contract — wrong names
    cause a silent SQL error or incorrect data insertion.
    """
    mock_result       = MagicMock()
    mock_result.data  = FAKE_USER_ROW

    mock_execute      = MagicMock(return_value=mock_result)
    mock_rpc_chain    = MagicMock()
    mock_rpc_chain.execute = mock_execute

    with patch("app.models.user_model.supabase") as mock_sb:
        mock_sb.rpc.return_value = mock_rpc_chain

        from app.models.user_model import create_user
        create_user(
            user_id="cccccccc-2222-2222-2222-cccccccccccc",
            email="rpc@example.com",
            business_name="RPC Cafe",
            business_type="restaurant",
            tone_preference="professional",
        )

    # Verify the RPC function name
    mock_sb.rpc.assert_called_once_with(
        "create_user_profile",
        {
            "p_id":              "cccccccc-2222-2222-2222-cccccccccccc",
            "p_email":           "rpc@example.com",
            "p_business_name":   "RPC Cafe",
            "p_business_type":   "restaurant",
            "p_tone_preference": "professional",
        },
    )


# ──────────────────────────────────────────────────────────────
# Test F — RuntimeError raised when RPC returns no data
# ──────────────────────────────────────────────────────────────

def test_create_user_rpc_raises_on_empty_data():
    """
    If the RPC returns falsy data (None, [], {}) we must raise RuntimeError
    so the caller (auth route) can catch it, log it, and clean up the orphaned
    auth.users row. Silent no-ops here cause invisible signup failures.
    """
    mock_result       = MagicMock()
    mock_result.data  = None  # ← falsy — the failure scenario

    mock_rpc_chain    = MagicMock()
    mock_rpc_chain.execute.return_value = mock_result

    with patch("app.models.user_model.supabase") as mock_sb:
        mock_sb.rpc.return_value = mock_rpc_chain

        from app.models.user_model import create_user
        with pytest.raises(RuntimeError, match="no data"):
            create_user(
                user_id=FAKE_USER_ID,
                email="rpc@example.com",
                business_name="RPC Cafe",
                business_type="restaurant",
            )


# ──────────────────────────────────────────────────────────────
# Test G — create_user returns the RPC data dict directly
# ──────────────────────────────────────────────────────────────

def test_create_user_rpc_returns_data_directly():
    """
    The function must be a transparent passthrough of result.data.
    No transformation or wrapping should occur — the auth route depends on
    the raw dict to build its JSON response.
    """
    expected_data = {"id": FAKE_USER_ID, "email": "rpc@example.com", "plan": "free"}

    mock_result       = MagicMock()
    mock_result.data  = expected_data

    mock_rpc_chain    = MagicMock()
    mock_rpc_chain.execute.return_value = mock_result

    with patch("app.models.user_model.supabase") as mock_sb:
        mock_sb.rpc.return_value = mock_rpc_chain

        from app.models.user_model import create_user
        result = create_user(
            user_id=FAKE_USER_ID,
            email="rpc@example.com",
            business_name="RPC Cafe",
            business_type="restaurant",
        )

    assert result == expected_data
