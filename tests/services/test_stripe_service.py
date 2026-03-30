"""
tests/services/test_stripe_service.py

5 tests for Phase 6 Stripe payment service.
All Stripe and Supabase calls are fully mocked — no real API calls.
"""

import pytest
import stripe
from unittest.mock import patch, MagicMock, call

from app.services.stripe_service import (
    handle_webhook_event,
    cancel_subscription,
)
from app.utils.exceptions import StripeWebhookInvalid


FAKE_USER_ID = 'aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa'
FAKE_CUSTOMER_ID = 'cus_test_fakecustomer'


def _make_checkout_event(event_id='evt_001'):
    """Builds a fake checkout.session.completed event dict."""
    return {
        'id': event_id,
        'type': 'checkout.session.completed',
        'data': {
            'object': {
                'client_reference_id': FAKE_USER_ID,
                'customer': FAKE_CUSTOMER_ID,
            }
        }
    }


def _make_payment_failed_event(event_id='evt_002'):
    """Builds a fake invoice.payment_failed event dict."""
    return {
        'id': event_id,
        'type': 'invoice.payment_failed',
        'data': {
            'object': {
                'customer': FAKE_CUSTOMER_ID,
            }
        }
    }


# ──────────────────────────────────────────────────────────────
# TEST 1 — Valid webhook signature upgrades plan to starter
# ──────────────────────────────────────────────────────────────

def test_valid_webhook_upgrades_plan():
    event = _make_checkout_event(event_id='evt_test1')
    
    mock_query = MagicMock()
    mock_query.select.return_value = mock_query
    mock_query.update.return_value = mock_query
    mock_query.insert.return_value = mock_query
    mock_query.eq.return_value = mock_query
    
    # 3 calls: 1. SELECT (idempotency), 2. UPDATE (user), 3. INSERT (event)
    mock_res_check = MagicMock(data=[]) # Not processed
    mock_res_update = MagicMock(data=None)
    mock_res_insert = MagicMock(data=None)
    mock_query.execute.side_effect = [mock_res_check, mock_res_update, mock_res_insert]

    with patch('stripe.Webhook.construct_event', return_value=event), \
         patch('stripe.Subscription.retrieve') as mock_sub_retr, \
         patch('app.services.stripe_service.supabase') as mock_sb:

        mock_sb.table.return_value = mock_query
        
        # Mock sub retrieve for current_period_end
        mock_sub = MagicMock()
        mock_sub.current_period_end = 1711814400 # 2024-03-30
        mock_sub_retr.return_value = mock_sub

        result = handle_webhook_event(b'fake-payload', 'fake-sig-header')

    assert result == {'received': True}
    # verify update called with core starter plan data
    called_payload = mock_query.update.call_args[0][0]
    assert called_payload['plan'] == 'starter'
    assert called_payload['stripe_customer_id'] == FAKE_CUSTOMER_ID


# ──────────────────────────────────────────────────────────────
# TEST 2 — Invalid webhook signature raises StripeWebhookInvalid
# ──────────────────────────────────────────────────────────────

def test_invalid_signature_raises():
    with patch(
        'stripe.Webhook.construct_event',
        side_effect=stripe.error.SignatureVerificationError(
            'invalid', 'sig_header'
        )
    ):
        with pytest.raises(StripeWebhookInvalid):
            handle_webhook_event(b'bad-payload', 'bad-sig')


# ──────────────────────────────────────────────────────────────
# TEST 3 — invoice.payment_failed downgrades plan to free
# ──────────────────────────────────────────────────────────────

def test_payment_failed_downgrades_plan():
    event = _make_payment_failed_event(event_id='evt_test3')

    mock_query = MagicMock()
    mock_query.select.return_value = mock_query
    mock_query.update.return_value = mock_query
    mock_query.insert.return_value = mock_query
    mock_query.eq.return_value = mock_query
    
    # 3 calls: SELECT check, UPDATE, INSERT event
    mock_res_check = MagicMock(data=[])
    mock_res_update = MagicMock(data=None)
    mock_res_insert = MagicMock(data=None)
    mock_query.execute.side_effect = [mock_res_check, mock_res_update, mock_res_insert]

    with patch('stripe.Webhook.construct_event', return_value=event), \
         patch('app.services.stripe_service.supabase') as mock_sb:

        mock_sb.table.return_value = mock_query
        result = handle_webhook_event(b'fake-payload', 'fake-sig')

    assert result == {'received': True}
    mock_query.update.assert_called_once_with({'plan': 'free', 'subscription_end': None, 'stripe_subscription_id': None})


# ──────────────────────────────────────────────────────────────
# TEST 4 — Replayed event is idempotent (DB called only once)
# ──────────────────────────────────────────────────────────────

def test_replayed_event_is_idempotent():
    event = _make_checkout_event(event_id='evt_test4')

    mock_query = MagicMock()
    mock_query.select.return_value = mock_query
    mock_query.eq.return_value = mock_query
    
    # Mock finding an existing ID -> Already processed
    mock_res_check = MagicMock(data=[{'stripe_event_id': 'evt_test4'}])
    mock_query.execute.return_value = mock_res_check

    with patch('stripe.Webhook.construct_event', return_value=event), \
         patch('app.services.stripe_service.supabase') as mock_sb:

        mock_sb.table.return_value = mock_query
        handle_webhook_event(b'fake-payload', 'fake-sig')

    # Update should NEVER be called on a replay
    assert mock_query.update.call_count == 0


# ──────────────────────────────────────────────────────────────
# TEST 5 — cancel_subscription cancels at period end
# ──────────────────────────────────────────────────────────────

def test_cancel_subscription_at_period_end():
    mock_subscription = MagicMock()
    mock_subscription.id = 'sub_test_fake123'

    mock_subscriptions_list = MagicMock()
    mock_subscriptions_list.data = [mock_subscription]

    mock_query = MagicMock()
    mock_query.update.return_value = mock_query
    mock_query.eq.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=None)

    with patch('stripe.Subscription.list', return_value=mock_subscriptions_list), \
         patch('stripe.Subscription.modify') as mock_modify, \
         patch('app.services.stripe_service.supabase') as mock_sb:

        # cancel_subscription uses .table()
        mock_sb.table.return_value = mock_query

        result = cancel_subscription(
            user_id=FAKE_USER_ID,
            stripe_customer_id=FAKE_CUSTOMER_ID,
            reason='too_expensive',
        )

    assert result is True
    mock_modify.assert_called_once_with(
        'sub_test_fake123',
        cancel_at_period_end=True,
    )
    # The code only updates cancellation_reason, not plan (delayed downgrade)
    mock_query.update.assert_called_once_with({
        'cancellation_reason': 'too_expensive',
    })
