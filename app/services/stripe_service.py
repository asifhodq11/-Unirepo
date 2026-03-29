"""
app/services/stripe_service.py

Stripe integration: checkout, portal, webhook handling, cancellation.
Security rules enforced here:
  - Signature verified BEFORE any data is read from event
  - Webhook idempotency via processed_events in-memory set (replace with
    DB-backed check in Phase 9 hardening)
"""

import os
import stripe

from app.extensions import supabase
from app.utils.exceptions import StripeWebhookInvalid, ReplyIQError

# Set Stripe secret key on module import
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

# ── Idempotency guard ─────────────────────────────────────────
# Backed by Supabase processed_webhooks table to survive re-deploys.
# In-memory fallback removed — see migration 007_processed_webhooks.sql


# ── Function 1: create_checkout_session ──────────────────────


def create_checkout_session(user_id: str, user_email: str, plan: str) -> str:
    """
    Creates a Stripe Checkout session for the given plan ('starter' or 'pro').
    Returns the session URL to redirect the user to.
    Raises ReplyIQError(SERVER_ERROR) if the Stripe call fails.
    """
    frontend_url = os.environ["FRONTEND_URL"]

    # Select the correct price ID based on plan
    price_id_map = {
        "starter": os.environ["STRIPE_PRICE_ID_STARTER"],
        "pro":     os.environ.get("STRIPE_PRICE_ID_PRO", os.environ["STRIPE_PRICE_ID_STARTER"]),
        "ultra":   os.environ.get("STRIPE_PRICE_ID_ULTRA", os.environ["STRIPE_PRICE_ID_STARTER"]),
    }
    price_id = price_id_map.get(plan, os.environ["STRIPE_PRICE_ID_STARTER"])

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=user_id,
            customer_email=user_email,
            metadata={"plan": plan},  # Pass plan through for webhook detection
            subscription_data={"trial_period_days": 14} if plan == "pro" else {},
            success_url=f"{frontend_url}/dashboard?payment=success",
            cancel_url=f"{frontend_url}/pricing?payment=cancelled",
        )
        return session.url
    except stripe.error.StripeError as e:
        from app.utils.logger import log_event
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
    SECURITY: Signature is verified BEFORE reading any event data.
    Idempotent: skips events already processed in this process lifetime.
    """
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

    event_id = event["id"]
    event_type = event["type"]

    # 2. Idempotency check — DB-backed so it survives re-deploys
    try:
        existing = supabase.table("processed_webhooks").select("stripe_event_id").eq("stripe_event_id", event_id).execute()
        if existing.data:
            return {"received": True}
    except Exception:
        pass  # If DB check fails, process the event anyway (fail open)

    # 3. Handle supported event types
    if event_type == "checkout.session.completed":
        session_data = event["data"]["object"]
        user_id     = session_data.get("client_reference_id")
        customer_id = session_data.get("customer")
        plan        = session_data.get("metadata", {}).get("plan", "starter")
        if plan not in ("starter", "pro", "ultra"):
            plan = "starter"

        from app.utils.logger import log_event
        log_event("webhook_checkout_received", user_id=user_id, customer_id=customer_id, plan=plan)

        if user_id and customer_id:
            try:
                supabase.table("users").update(
                    {"plan": plan, "stripe_customer_id": customer_id}
                ).eq("id", user_id).execute()
                log_event("webhook_user_updated", user_id=user_id, plan=plan)
            except Exception as e:
                log_event("webhook_update_failed", user_id=user_id, error=str(e))

    elif event_type == "invoice.payment_failed":
        invoice_data = event["data"]["object"]
        customer_id = invoice_data.get("customer")

        if customer_id:
            supabase.table("users").update(
                {"plan": "free"}
            ).eq("stripe_customer_id", customer_id).execute()

    elif event_type == "customer.subscription.deleted":
        sub_data    = event["data"]["object"]
        customer_id = sub_data.get("customer")

        from app.utils.logger import log_event
        log_event("webhook_subscription_cancelled", customer_id=customer_id)

        if customer_id:
            try:
                supabase.table("users").update(
                    {"plan": "free"}
                ).eq("stripe_customer_id", customer_id).execute()
            except Exception as e:
                log_event("webhook_subscription_cancel_failed", customer_id=customer_id, error=str(e))

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
    Updates the users table: plan='free', cancellation_reason=reason.
    Returns True on success.
    """
    # Retrieve the customer's active subscriptions
    subscriptions = stripe.Subscription.list(
        customer=stripe_customer_id,
        status="active",
        limit=1,
    )

    if subscriptions.data:
        subscription = subscriptions.data[0]
        stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True,
        )

    # Update the user record regardless — downgrade plan immediately
    supabase.table("users").update(
        {
            "plan": "free",
            "cancellation_reason": reason,
        }
    ).eq("id", user_id).execute()

    return True
