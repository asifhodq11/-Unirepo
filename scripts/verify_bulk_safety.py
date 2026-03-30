import unittest
from unittest.mock import MagicMock, patch

# Mocking the app and extensions before imports
import sys
from types import ModuleType

mock_app = ModuleType('app')
mock_ext = ModuleType('app.extensions')
mock_ext.supabase = MagicMock()
mock_app.extensions = mock_ext
sys.modules['app'] = mock_app
sys.modules['app.extensions'] = mock_ext

from app.services.usage_service import reserve_bulk_usage
from app.utils.exceptions import ReplyLimitReached

class TestBulkSafety(unittest.TestCase):

    @patch('app.services.usage_service.supabase')
    @patch('app.services.usage_service.get_plan_limit')
    def test_bulk_reservation_rejection(self, mock_limit, mock_supabase):
        """Verify that reserve_bulk_usage raises ReplyLimitReached when RPC returns False."""
        mock_limit.return_value = 100
        mock_supabase.from_().select().eq().single().execute.return_value.data = {"plan": "pro"}
        
        # Mock RPC returning False (Insufficient Credits)
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = False
        mock_supabase.rpc.return_value = mock_rpc

        with self.assertRaises(ReplyLimitReached):
            reserve_bulk_usage("user_123", 10)
        
        # Verify RPC was called with correct count
        mock_supabase.rpc.assert_called_with("check_and_reserve_bulk_credits", {
            "user_id_input": "user_123",
            "required_count": 10,
            "max_limit": 100
        })

    @patch('app.services.usage_service.supabase')
    @patch('app.services.usage_service.get_plan_limit')
    def test_bulk_reservation_success(self, mock_limit, mock_supabase):
        """Verify that reserve_bulk_usage succeeds when RPC returns True."""
        mock_limit.return_value = 100
        mock_supabase.from_().select().eq().single().execute.return_value.data = {"plan": "pro"}
        
        # Mock RPC returning True
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = True
        mock_supabase.rpc.return_value = mock_rpc

        # Should NOT raise exception
        reserve_bulk_usage("user_123", 10)
        
        mock_supabase.rpc.assert_called_once()

if __name__ == '__main__':
    unittest.main()
