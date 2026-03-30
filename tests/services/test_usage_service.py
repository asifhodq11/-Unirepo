import pytest
from unittest.mock import patch, MagicMock
from app.services.usage_service import (
    check_usage_limit, 
    increment_usage, 
    reserve_bulk_usage, 
    get_plan_limit
)
from app.utils.exceptions import ReplyLimitReached


def test_plan_limits():
    assert get_plan_limit('free') == 10
    assert get_plan_limit('starter') == 100
    assert get_plan_limit('pro') == 100
    assert get_plan_limit('ultra') == 500
    assert get_plan_limit('other') == 5  # Default to free


def _mock_supabase_user(plan, count, billing_start='2026-03-01'):
    """Helper: returns a mock supabase client whose .from_().select()...single().execute()
    returns the given user data."""
    mock_supabase = MagicMock()
    mock_result = MagicMock()
    mock_result.data = {
        'plan': plan,
        'reply_count_this_month': count,
        'billing_cycle_start': billing_start,
    }
    # Chain: .from_().select().eq().single().execute()
    (mock_supabase
        .from_.return_value
        .select.return_value
        .eq.return_value
        .single.return_value
        .execute.return_value) = mock_result
    return mock_supabase


@patch('app.services.usage_service.supabase')
def test_check_usage_limit_under(mock_supabase):
    mock_supabase.from_ = _mock_supabase_user('free', 0).from_
    # Should not raise — user is under the limit
    check_usage_limit('test-user-uuid')


@patch('app.services.usage_service.supabase')
def test_check_usage_limit_at_boundary(mock_supabase):
    mock_supabase.from_ = _mock_supabase_user('free', 10).from_
    with pytest.raises(ReplyLimitReached) as excinfo:
        check_usage_limit('test-user-uuid')

    assert excinfo.value.error_code == 'REPLY_LIMIT_REACHED'
    assert excinfo.value.details['replies_used'] == 10


@patch('app.services.usage_service.supabase')
def test_check_usage_limit_over(mock_supabase):
    # Starter limit is now 100
    mock_supabase.from_ = _mock_supabase_user('starter', 101).from_
    with pytest.raises(ReplyLimitReached) as excinfo:
        check_usage_limit('test-user-uuid')

    assert excinfo.value.http_status == 403
    assert excinfo.value.details['replies_limit'] == 100


@patch('app.services.usage_service.supabase')
def test_increment_usage_atomic_success(mock_supabase):
    # 1. Mock plan fetch
    mock_supabase.from_ = _mock_supabase_user('starter', 10).from_
    
    # 2. Mock rpc call returning True
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value = MagicMock(data=True)
    mock_supabase.rpc.return_value = mock_rpc

    increment_usage("test-user-uuid")

    mock_supabase.rpc.assert_called_once_with(
        'increment_reply_count',
        {'user_id_input': "test-user-uuid", 'max_limit': 100}
    )


@patch('app.services.usage_service.supabase')
def test_increment_usage_atomic_limit_hit(mock_supabase):
    # 1. Mock plan fetch
    mock_supabase.from_ = _mock_supabase_user('free', 4).from_
    
    # 2. Mock rpc call returning False (limit reached by concurrent request)
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value = MagicMock(data=False)
    mock_supabase.rpc.return_value = mock_rpc

    with pytest.raises(ReplyLimitReached):
        increment_usage("test-user-uuid")


@patch('app.services.usage_service.supabase')
def test_reserve_bulk_usage_success(mock_supabase):
    # 1. Mock plan fetch
    mock_supabase.from_ = _mock_supabase_user('pro', 0).from_
    
    # 2. Mock bulk rpc returning True
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value = MagicMock(data=True)
    mock_supabase.rpc.return_value = mock_rpc

    reserve_bulk_usage("test-user-uuid", 5)

    mock_supabase.rpc.assert_called_once_with(
        'check_and_reserve_bulk_credits',
        {'user_id_input': "test-user-uuid", 'required_count': 5, 'max_limit': 100}
    )


@patch('app.services.usage_service.supabase')
def test_reserve_bulk_usage_insufficient(mock_supabase):
    # 1. Mock plan fetch
    mock_supabase.from_ = _mock_supabase_user('free', 4).from_
    
    # 2. Mock bulk rpc returning False
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value = MagicMock(data=False)
    mock_supabase.rpc.return_value = mock_rpc

    with pytest.raises(ReplyLimitReached) as excinfo:
        reserve_bulk_usage("test-user-uuid", 7) # Total 11 > 10 limit
    
    assert "Insufficient credits" in excinfo.value.details['reset_date']
