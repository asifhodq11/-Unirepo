"""
tests/services/test_poller_mutex.py

Concurrency and fail-safe tests for the distributed poller mutex in run_poller.py.
All Supabase calls are mocked — no live DB required.

These tests guard against the two worst-case concurrent scenarios:
  - Two poller instances racing and BOTH proceeding (double AI billing).
  - A crashed poller that never releases the lock (permanent deadlock).

Test IDs:
  H. _try_acquire_lock() returns True when RPC is successful
  I. _try_acquire_lock() returns False when another instance holds the lock
  J. _try_acquire_lock() returns False (fail-closed) on network exception
  K. run_google_poller() skips body + logs "poller_skipped" when lock not acquired
  L. run_google_poller() ALWAYS releases lock, even when body raises an exception
"""

import pytest
from unittest.mock import MagicMock, patch, call


# ──────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────

@pytest.fixture()
def app():
    """Flask app in testing mode — required for app context in run_poller."""
    from app import create_app
    application = create_app('testing')
    application.config['TESTING'] = True
    application.config['FORCE_HTTPS'] = False
    yield application


# ──────────────────────────────────────────────────────────────
# Test H — Lock acquired when RPC returns truthy data
# ──────────────────────────────────────────────────────────────

def test_acquire_lock_returns_true_when_rpc_succeeds(app):
    """
    The happy path: acquire_poller_lock RPC returns True (lock granted).
    _try_acquire_lock() must propagate this as True so the poller proceeds.
    """
    mock_result      = MagicMock()
    mock_result.data = True  # RPC returned True — lock acquired

    with app.app_context():
        with patch('run_poller.supabase') as mock_sb:
            mock_sb.rpc.return_value.execute.return_value = mock_result

            from run_poller import _try_acquire_lock
            assert _try_acquire_lock() is True


# ──────────────────────────────────────────────────────────────
# Test I — Lock blocked when another instance holds it
# ──────────────────────────────────────────────────────────────

def test_acquire_lock_returns_false_when_rpc_returns_falsy(app):
    """
    When another process holds the lock, acquire_poller_lock returns False/None.
    _try_acquire_lock() must return False so the current process exits cleanly
    without touching the poller body (no AI calls, no double-billing).
    """
    mock_result      = MagicMock()
    mock_result.data = False  # RPC returned False — lock NOT acquired

    with app.app_context():
        with patch('run_poller.supabase') as mock_sb:
            mock_sb.rpc.return_value.execute.return_value = mock_result

            from run_poller import _try_acquire_lock
            assert _try_acquire_lock() is False


# ──────────────────────────────────────────────────────────────
# Test J — Fail-closed on network/DB exception
# ──────────────────────────────────────────────────────────────

def test_acquire_lock_fails_closed_on_exception(app):
    """
    SAFETY GUARANTEE: If the RPC call itself throws (network timeout, DB error,
    misconfigured credentials), _try_acquire_lock() must return False, not raise.

    Allowing an exception to propagate here would crash the poller before the
    finally block, potentially leaving a stale lock in the DB indefinitely.
    Returning False means "unknown state — do not proceed". Fail closed.
    """
    with app.app_context():
        with patch('run_poller.supabase') as mock_sb:
            mock_sb.rpc.side_effect = Exception("Connection refused")

            from run_poller import _try_acquire_lock
            # Must NOT raise — must return False
            result = _try_acquire_lock()
            assert result is False


# ──────────────────────────────────────────────────────────────
# Test K — Poller body skipped when lock not acquired
# ──────────────────────────────────────────────────────────────

def test_poller_skips_body_when_lock_not_acquired(app):
    """
    When _try_acquire_lock() returns False, run_google_poller() must:
    1. NOT call _run_poller_body() (no reviews fetched, no AI triggered).
    2. Log a "poller_skipped" event so monitoring can alert on stuck locks.

    This test is the critical concurrency contract: if this fails, two
    poller instances can race and both call the AI engine simultaneously.
    """
    with app.app_context():
        with patch('run_poller._try_acquire_lock', return_value=False) as mock_lock, \
             patch('run_poller._run_poller_body') as mock_body, \
             patch('run_poller.log_event') as mock_log:

            from run_poller import run_google_poller
            run_google_poller()

    # Body must never execute when lock is not held
    mock_body.assert_not_called()

    # A poller_skipped event must be logged for observability
    logged_events = [call_args[0][0] for call_args in mock_log.call_args_list]
    assert 'poller_skipped' in logged_events, (
        "Expected 'poller_skipped' log event — did not find it.\n"
        f"Logged events: {logged_events}"
    )


# ──────────────────────────────────────────────────────────────
# Test L — Lock is ALWAYS released, even on body exception
# ──────────────────────────────────────────────────────────────

def test_poller_releases_lock_on_exception(app):
    """
    DEADLOCK PREVENTION: Even when _run_poller_body() raises an unhandled
    exception, _release_lock() MUST still execute (via the finally block).

    Without this guarantee, a crashed poller cycle holds the lock for up to
    30 minutes (the stale-lock threshold), blocking all subsequent cycles
    and freezing user review processing.
    """
    with app.app_context():
        with patch('run_poller._try_acquire_lock', return_value=True), \
             patch('run_poller._run_poller_body', side_effect=RuntimeError("AI engine down")), \
             patch('run_poller._release_lock') as mock_release, \
             patch('run_poller.log_event'):

            from run_poller import run_google_poller
            # run_google_poller() should NOT re-raise the body exception
            # It is caught by the outer finally block
            try:
                run_google_poller()
            except RuntimeError:
                pass  # If it re-raises, we still check _release_lock below

    # The lock MUST have been released regardless of the exception
    mock_release.assert_called_once(), (
        "_release_lock() was not called after body exception — "
        "this would cause a 30-minute deadlock on the next poller cycle."
    )
