#!/bin/bash
# ============================================================
# scripts/run_serious_tests.sh
#
# Runs the ReplyIQ "Serious Testing Suite" — the hardened tests
# that trap silent failures in auth, RPC contracts, and poller
# mutex concurrency.
#
# Usage: bash scripts/run_serious_tests.sh
# Exit:  0 if all pass, 1 if any fail
# ============================================================

set -e  # Exit immediately on first failure

PASS_COUNT=0
FAIL_COUNT=0

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       ReplyIQ Serious Testing Suite                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

run_suite() {
    local name="$1"
    local path="$2"

    echo "── Running: $name ─────────────────────────────────────────"
    if python -m pytest "$path" --tb=short -q; then
        echo "✅ PASSED: $name"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "❌ FAILED: $name"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""
}

# Wave 1a — Auth Route Hardening Tests (A, B, C, D)
run_suite "Auth Route Hardening" "tests/routes/test_auth.py::test_signup_orphan_cleanup_on_profile_error tests/routes/test_auth.py::test_signup_fake_user_detection tests/routes/test_auth.py::test_signup_202_body_does_not_leak_profile tests/routes/test_auth.py::test_login_blocked_when_profile_missing"

# Wave 1b — RPC Contract Tests (E, F, G)
run_suite "Auth RPC Contract" "tests/routes/test_auth_rpc_contract.py"

# Wave 2 — Poller Mutex Concurrency Tests (H, I, J, K, L)
run_suite "Poller Mutex Concurrency" "tests/services/test_poller_mutex.py"

echo "══════════════════════════════════════════════════════════════"
echo "  Suites Passed: $PASS_COUNT"
echo "  Suites Failed: $FAIL_COUNT"
echo "══════════════════════════════════════════════════════════════"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo ""
    echo "❌  One or more suites failed. Investigate above output."
    exit 1
fi

echo ""
echo "✅  All serious tests passed. The hardening layer is intact."
exit 0
