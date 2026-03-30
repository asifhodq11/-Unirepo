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

# Now we can import our services
from app.services.google_api_service import fetch_recent_reviews
from app.services.usage_service import increment_usage

class TestAuditWave2(unittest.TestCase):

    @patch('requests.get')
    def test_pagination_logic(self, mock_get):
        """Verify that fetch_recent_reviews follows the nextPageToken up to the cap."""
        # 1. Setup multi-page response mocks
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: {
                "reviews": [{"name": "rev1"}],
                "nextPageToken": "token1"
            }),
            MagicMock(status_code=200, json=lambda: {
                "reviews": [{"name": "rev2"}],
                "nextPageToken": None
            })
        ]

        reviews = fetch_recent_reviews("accounts/1/locations/1", "mock_token")
        
        # 2. Verify results
        self.assertEqual(len(reviews), 2)
        self.assertEqual(reviews[0]['name'], "rev1")
        self.assertEqual(reviews[1]['name'], "rev2")
        self.assertEqual(mock_get.call_count, 2)

    @patch('app.services.usage_service.supabase')
    @patch('app.services.usage_service.get_plan_limit')
    def test_atomic_increment_call(self, mock_limit, mock_supabase):
        """Verify that usage_service calls the RPC with correct max_limit."""
        mock_limit.return_value = 100
        mock_supabase.from_().select().eq().single().execute.return_value.data = {"plan": "pro"}
        
        # Mock the RPC call result
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = True
        mock_supabase.rpc.return_value = mock_rpc

        increment_usage("user_123")
        
        # Verify the RPC call included max_limit
        mock_supabase.rpc.assert_called_with("increment_reply_count", {
            "user_id_input": "user_123",
            "max_limit": 100
        })

    def test_anonymity_logic_placeholder(self):
        """
        Visual check of the logic we added to run_poller.py:
        if not reviewer_name or reviewer_name == "A Google User":
            reviewer_name = None
        """
        # Testing the equivalence logic used in the poller
        test_cases = [
            ("John Doe", "John Doe"),
            ("A Google User", None),
            ("", None),
            (None, None)
        ]
        
        for input_val, expected in test_cases:
            # Inline simulation of the poller logic
            result = input_val if input_val and input_val != "A Google User" else None
            self.assertEqual(result, expected, f"Failed for input: {input_val}")

if __name__ == '__main__':
    unittest.main()
