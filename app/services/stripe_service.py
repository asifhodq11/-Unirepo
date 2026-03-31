"""
app/services/stripe_service.py

Stripe integration: checkout, portal, webhook handling, cancellation.

ZERO-TOUCH AUTOMATION DESIGN:
  - Every upgrade path (free→starter, free→pro, free→ultra, starter→pro,
    starter→ultra, pro→ultra) is handled automatically by webhooks.
  - Fail-Safe: If a Price ID is not found in env vars, the system asks
    Stripe for the Product name and maps it to a plan automatically.
  - No manual database editing should ever be needed for plan promotion.

Security rules enforced here:
  - Signature verified BEFORE any data is read from event
  - Webhook idempotency via DB-backed processed_webhooks table
"""

import os
import stripe
from datetime import datetime, timezone, date

from app.extensions import supabase
from app.utils.exceptions import StripeWebhookInvalid, ReplyIQError

# Set Stripe secret key on module import
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

# ── Plan Price ID Map ─────────────────────────────────────────
# Single source of truth for mapping env var names → plan names.

def _get_price_id_map() -> dict:
    """Returns a dict of {price_id: plan_name} from environment variables."""
    raw = {
        os.environ.get("STRIPE_PRICE_ID_STARTER"): "starter",
        os.environ.get("STRIPE_PRICE_ID_PRO"):     "pro",
        os.environ.get("STRIPE_PRICE_ID_ULTRA"):   "ultra",
    }
    # Remove None keys (unset env vars)
    return {k: v for k, v in raw.items() if k}


def _env_price_id_for_plan(plan: str) -> str | None:
    """Returns the Stripe Price ID for a given plan from environment variables."""
    mapping = {
        "starter": os.environ.get("STRIPE_PRICE_ID_STARTER"),
        "pro":     os.environ.get("STRIPE_PRICE_ID_PRO"),
        "ultra":   os.environ.get("STRIPE_PRICE_ID_ULTRA"),
    }
    return mapping.get(plan)


def _resolve_plan_from_price_id(price_id: str | None) -> str | None:
    """
    Maps a Stripe Price ID to a plan name.

    Step 1: Check environment variable mapping (fast, free).
    Step 2 (Fail-Safe): If not found, ask Stripe for the Product name
            and infer the plan from keywords (e.g. 'ultra' in name → 'ultra').
    Returns None if the plan cannot be determined.
    """
    if not price_id:
        return None

    # Step 1: Check env vars
    env_map = _get_price_id_map()
    if price_id in env_map:
        return env_map[price_id]

    # Step 2: Fail-Safe — ask Stripe for the product name
    from app.utils.logger import log_event
    try:
        price_obj = stripe.Price.retrieve(price_id, expand=["product"])
        product_name = (price_obj.get("product") or {}).get("name", "").lower()
        log_event("webhook_price_id_fallback_lookup", price_id=price_id, product_name=product_name)

        if "ultra" in product_name:
            return "ultra"
        elif "pro" in product_name:
            return "pro"
        elif "starter" in product_name:
            return "starter"
    except Exception as e:
        log_event("webhook_price_lookup_failed", price_id=price_id, error=str(e))

    return None  # Cannot determine — do not touch the plan


# ── Function 1: create_checkout_session ──────────────────────


def create_checkout_session(user_id: str, user_email: str, plan: str) -> str:
    """
    Creates a Stripe Checkout session for the given plan.
    Returns the session URL to redirect the user to.
    Raises ReplyIQError(SERVER_ERROR) if the Stripe call fails.

    IMPORTANT: No trial periods are applied here. Trials are managed
    exclusively via Stripe Dashboard product settings to avoid $0 confusion.
    """
    from app.utils.logger import log_event
    frontend_url = os.environ["FRONTEND_URL"]

    price_id = _env_price_id_for_plan(plan)

    if not price_id:
        # This plan's Price ID is missing from Railway — we cannot proceed.
        # Log a critical error but do NOT silently charge the wrong price.
        log_event("stripe_config_missing_critical", plan=plan,
                  hint="Set STRIPE_PRICE_ID_{PLAN} in Railway environment variables.")
        raise ReplyIQError()

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=user_id,     # Ties payment back to ReplyIQ user ID
            customer_email=user_email,
            metadata={"plan": plan},          # Source of truth for webhook handler
            # NOTE: trial_period_days removed. Configure trials in Stripe Dashboard
            # per-price if needed; do not set here to avoid $0 invoice confusion.
            success_url=f"{frontend_url}/dashboard?payment=success",
            cancel_url=f"{frontend_url}/pricing?payment=cancelled",
        )
        log_event("checkout_session_created", user_id=user_id, plan=plan)
        return session.url
    except stripe.error.StripeError as e:
        log_event("stripe_api_error", error=str(e))
        raise ReplyIQError()


# ── Function 2: create_portal_session ────────────────────────


def create_portal_session(stripe_customer_id: str) -> str:
    """
    Creates a Stripe Billing Portal session for managing subscriptions.
    Returns the portal session URL.
    Raises ReplyIQError(SERVER_ERROR) if the Stripe call fails.
    """
    frontend_url = os.environ["FRONTEND_URL"]

    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=f"{frontend_url}/dashboard",
        )
        return session.url
    except stripe.error.StripeError as e:
        from app.utils.logger import log_event
        log_event("stripe_api_error", error=str(e))
        raise ReplyIQError()


# ── Function 3: handle_webhook_event ─────────────────────────


def handle_webhook_event(payload_bytes: bytes, sig_header: str) -> dict:
    """
    Verifies the webhook signature and processes the Stripe event.

    ZERO-TOUCH AUTOMATION:
      - checkout.session.completed → upgrades user to the purchased plan immediately.
      - customer.subscription.updated → syncs plan changes from the Billing Portal
        (upgrades, downgrades, trial→active conversions).
      - invoice.payment_failed → downgrades user to free if payment fails.
      - customer.subscription.deleted → downgrades user to free on cancellation.

    SECURITY: Signature is verified BEFORE reading any event data.
    """
    from app.utils.logger import log_event

    webhook_secret = os.environ["STRIPE_WEBHOOK_SECRET"]

    # 1. Verify signature first — raises StripeWebhookInvalid on failure
    try:
        event = stripe.Webhook.construct_event(
            payload=payload_bytes,
            sig_header=sig_header,
            secret=webhook_secret,
        )
    except stripe.error.SignatureVerificationError:
        raise StripeWebhookInvalid()

    event_id   = event["id"]
    event_type = event["type"]

    log_event("webhook_received", event_id=event_id, event_type=event_type)

    # 2. Idempotency check — DB-backed so it survives re-deploys
    try:
        existing = supabase.table("processed_webhooks").select("stripe_event_id") \
            .eq("stripe_event_id", event_id).execute()
        if existing.data:
            log_event("webhook_duplicate_skipped", event_id=event_id)
            return {"received": True}
    except Exception:
        pass  # If DB check fails, process the event anyway (fail open)

    # 3. Handle supported event types
    # ─────────────────────────────────────────────────────────────────────────
    # EVENT A: checkout.session.completed
    # Fires when: user completes Stripe Checkout (first-time or re-subscribe).
    # Action: Upgrade user to the purchased plan immediately.
    # ─────────────────────────────────────────────────────────────────────────
    if event_type == "checkout.session.completed":
        session_data    = event["data"]["object"]
        user_id         = session_data.get("client_reference_id")
        customer_id     = session_data.get("customer")
        subscription_id = session_data.get("subscription")

        # The `plan` metadata is set explicitly in create_checkout_session().
        # It is the most reliable source of truth for the intended plan.
        plan = session_data.get("metadata", {}).get("plan")

        # Validate plan value — must be an active tier
        if plan not in ("starter", "pro", "ultra"):
            log_event("webhook_invalid_plan_in_metadata", plan=plan, user_id=user_id)
            plan = None  # Do not apply an unknown plan

        # Fetch subscription for accurate period-end date
        subscription_end = None
        if subscription_id:
            try:
                sub = stripe.Subscription.retrieve(subscription_id)
                subscription_end = datetime.fromtimestamp(
                    sub.current_period_end, tz=timezone.utc
                ).isoformat()
            except Exception as e:
                log_event("webhook_sub_retrieve_failed", subscription_id=subscription_id, error=str(e))

        log_event("webhook_checkout_received", user_id=user_id, customer_id=customer_id, plan=plan)

        if plan and customer_id:
            try:
                update_payload = {
                    "plan": plan,
                    "stripe_customer_id": customer_id,
                    "billing_cycle_start": date.today().isoformat(),
                }
                if subscription_id:
                    update_payload["stripe_subscription_id"] = subscription_id
                if subscription_end:
                    update_payload["subscription_end"] = subscription_end

                updated = False

                # Primary: match by user UUID (most reliable)
                if user_id:
                    res = supabase.table("users").update(update_payload).eq("id", user_id).execute()
                    if res.data:
                        updated = True
                        log_event("webhook_user_upgraded", user_id=user_id, plan=plan)

                # Fallback: match by email (handles edge cases where client_reference_id is missing)
                if not updated:
                    customer_email = (
                        session_data.get("customer_email")
                        or session_data.get("customer_details", {}).get("email")
                    )
                    if customer_email:
                        res = supabase.table("users").update(update_payload).eq("email", customer_email).execute()
                        if res.data:
                            log_event("webhook_user_upgraded_via_email", email=customer_email, plan=plan)
                        else:
                            log_event("webhook_update_failed_no_user_found", email=customer_email)

            except Exception as e:
                log_event("webhook_checkout_update_failed", user_id=user_id, error=str(e))

    # ─────────────────────────────────────────────────────────────────────────
    # EVENT B: customer.subscription.updated
    # Fires when: user upgrades/downgrades via the Billing Portal,
    #             or when a trial converts to an active subscription.
    # Action: Sync plan to whatever price ID the subscription now has.
    # ─────────────────────────────────────────────────────────────────────────
    elif event_type == "customer.subscription.updated":
        sub_data        = event["data"]["object"]
        customer_id     = sub_data.get("customer")
        subscription_id = sub_data.get("id")
        status          = sub_data.get("status")   # active | trialing | past_due | canceled

        log_event("webhook_subscription_update", customer_id=customer_id, status=status)

        # Only sync on live/trial statuses — ignore past_due, incomplete, etc.
        if status in ("active", "trialing"):
            price_id = None
            items = sub_data.get("items", {}).get("data", [])
            if items:
                price_id = items[0].get("price", {}).get("id")

            # Resolve plan from price ID (with Stripe Product Name fallback)
            new_plan = _resolve_plan_from_price_id(price_id)

            current_period_end = sub_data.get("current_period_end")
            subscription_end = (
                datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()
                if current_period_end else None
            )

            if customer_id:
                update_payload = {}
                if new_plan:
                    update_payload["plan"] = new_plan
                if subscription_id:
                    update_payload["stripe_subscription_id"] = subscription_id
                if subscription_end:
                    update_payload["subscription_end"] = subscription_end

                if update_payload:
                    log_event("webhook_subscription_sync",
                              customer_id=customer_id, plan=new_plan, status=status,
                              price_id=price_id)
                    supabase.table("users").update(update_payload) \
                        .eq("stripe_customer_id", customer_id).execute()
                else:
                    log_event("webhook_subscription_no_update",
                              customer_id=customer_id,
                              reason="Could not resolve plan from price_id",
                              price_id=price_id)

    # ─────────────────────────────────────────────────────────────────────────
    # EVENT C: invoice.payment_failed
    # Fires when: card payment fails on renewal.
    # Action: Downgrade user to free so they cannot abuse features.
    # ─────────────────────────────────────────────────────────────────────────
    elif event_type == "invoice.payment_failed":
        invoice_data = event["data"]["object"]
        customer_id  = invoice_data.get("customer")

        log_event("webhook_payment_failed", customer_id=customer_id)

        if customer_id:
            supabase.table("users").update(
                {"plan": "free", "subscription_end": None, "stripe_subscription_id": None}
            ).eq("stripe_customer_id", customer_id).execute()

    # ─────────────────────────────────────────────────────────────────────────
    # EVENT D: customer.subscription.deleted
    # Fires when: subscription is fully cancelled (at period end or immediately).
    # Action: Downgrade user to free.
    # ─────────────────────────────────────────────────────────────────────────
    elif event_type == "customer.subscription.deleted":
        sub_data    = event["data"]["object"]
        customer_id = sub_data.get("customer")

        log_event("webhook_subscription_cancelled", customer_id=customer_id)

        if customer_id:
            try:
                supabase.table("users").update(
                    {"plan": "free", "subscription_end": None, "stripe_subscription_id": None}
                ).eq("stripe_customer_id", customer_id).execute()
            except Exception as e:
                log_event("webhook_subscription_cancel_failed", customer_id=customer_id, error=str(e))

    # ─────────────────────────────────────────────────────────────────────────
    # EVENT E: invoice.payment_succeeded
    # Fires when: a subscription renewal payment succeeds.
    # Action: Re-confirm plan is still active (handles trial→paid conversions).
    # ─────────────────────────────────────────────────────────────────────────
    elif event_type == "invoice.payment_succeeded":
        invoice_data    = event["data"]["object"]
        customer_id     = invoice_data.get("customer")
        subscription_id = invoice_data.get("subscription")

        if customer_id and subscription_id:
            try:
                sub = stripe.Subscription.retrieve(subscription_id)
                price_id = None
                items = sub.get("items", {}).get("data", [])
                if items:
                    price_id = items[0].get("price", {}).get("id")

                plan = _resolve_plan_from_price_id(price_id)
                subscription_end = datetime.fromtimestamp(
                    sub.current_period_end, tz=timezone.utc
                ).isoformat()

                update_payload = {"subscription_end": subscription_end}
                if plan:
                    update_payload["plan"] = plan

                supabase.table("users").update(update_payload) \
                    .eq("stripe_customer_id", customer_id).execute()

                log_event("webhook_payment_succeeded_synced",
                          customer_id=customer_id, plan=plan)
            except Exception as e:
                log_event("webhook_payment_succeed_sync_failed", customer_id=customer_id, error=str(e))

    # 4. Mark event as processed in DB
    try:
        supabase.table("processed_webhooks").insert({"stripe_event_id": event_id}).execute()
    except Exception:
        pass  # Non-fatal — event was still processed

    return {"received": True}


# ── Function 4: cancel_subscription ──────────────────────────


def cancel_subscription(
    user_id: str,
    stripe_customer_id: str,
    reason: str = None,
) -> bool:
    """
    Cancels the active Stripe subscription at period end.
    Does NOT immediately downgrade the plan — the webhook handles that
    when `customer.subscription.deleted` fires at period end.
    Returns True on success.
    """
    from app.utils.logger import log_event

    # Retrieve all active + trialing subscriptions for this customer
    subscriptions = stripe.Subscription.list(
        customer=stripe_customer_id,
        status="active",
        limit=1,
    )

    if not subscriptions.data:
        # Try trialing subscriptions too (Pro trial users cancelling)
        subscriptions = stripe.Subscription.list(
            customer=stripe_customer_id,
            status="trialing",
            limit=1,
        )

    if subscriptions.data:
        subscription = subscriptions.data[0]
        stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True,
        )
        log_event("subscription_cancel_scheduled", user_id=user_id, subscription_id=subscription.id)

    # Record the cancellation reason without downgrading yet
    update_data = {}
    if reason:
        update_data["cancellation_reason"] = reason

    if update_data:
        supabase.table("users").update(update_data).eq("id", user_id).execute()

    return True
