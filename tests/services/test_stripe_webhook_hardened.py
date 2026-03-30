import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_supabase():
    with patch("app.services.stripe_service.supabase") as mock_sb:
        mock_sb.table.return_value = mock_sb
        mock_sb.from_.return_value = mock_sb
        mock_sb.select.return_value = mock_sb
        mock_sb.eq.return_value = mock_sb
        mock_sb.update.return_value = mock_sb
        mock_sb.insert.return_value = mock_sb
        mock_sb.execute.return_value = MagicMock(data=[], count=0)
        yield mock_sb

def test_handle_webhook_subscription_updated(mock_supabase):
    from app.services.stripe_service import handle_webhook_event
    
    event_data = {
        "id": "evt_123",
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "customer": "cus_abc",
                "id": "sub_xyz",
                "status": "active",
                "current_period_end": 1735689600,
                "items": {
                    "data": [
                        {"price": {"id": "price_pro_123"}}
                    ]
                }
            }
        }
    }
    
    with patch("app.services.stripe_service.stripe.Webhook.construct_event", return_value=event_data), \
         patch.dict("os.environ", {"STRIPE_PRICE_ID_PRO": "price_pro_123"}):
        handle_webhook_event(b"raw_payload", "fake_sig")
        
    mock_supabase.update.assert_called()

def test_handle_webhook_payment_failed(mock_supabase):
    from app.services.stripe_service import handle_webhook_event
    event_data = {
        "id": "evt_456", 
        "type": "invoice.payment_failed", 
        "data": {"object": {"customer": "cus_abc"}}
    }
    
    with patch("app.services.stripe_service.stripe.Webhook.construct_event", return_value=event_data):
        handle_webhook_event(b"raw", "fake_sig")
        
    mock_supabase.update.assert_called()

def test_handle_webhook_subscription_deleted(mock_supabase):
    from app.services.stripe_service import handle_webhook_event
    event_data = {
        "id": "evt_789", 
        "type": "customer.subscription.deleted", 
        "data": {"object": {"customer": "cus_abc"}}
    }
    
    with patch("app.services.stripe_service.stripe.Webhook.construct_event", return_value=event_data), \
         patch("app.utils.logger.log_event"):
        handle_webhook_event(b"raw", "fake_sig")
        
    mock_supabase.update.assert_called()

@patch("app.utils.logger.log_event")
def test_handle_webhook_idempotency(mock_log, mock_supabase):
    from app.services.stripe_service import handle_webhook_event
    event_data = {"id": "evt_already_seen", "type": "any.event"}
    
    mock_supabase.execute.return_value = MagicMock(data=[{"id": 1}], count=1)
    
    with patch("app.services.stripe_service.stripe.Webhook.construct_event", return_value=event_data):
        handle_webhook_event(b"raw", "fake_sig")
        
    assert mock_supabase.update.call_count == 0
