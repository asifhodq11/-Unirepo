"""
app/services/stripe_service.py

Stripe integration: checkout, portal, webhook handling, cancellation.

ZERO-TOUCH AUTOMATION DESIGN & BUG HUNTER HARDENING:
  - Every upgrade path is handled automatically by webhooks.
  - Fail-Safe: Ask Stripe for Product name if Price ID mapping is missing.
  - Concurrency Lock: DB insert runs *before* logic to prevent Race Condition.
  - Live Truth: 'updated' webhooks query Stripe API to prevent Out-Of-Order bugs.
  - Monolith Avoidance: Webhooks are explicitly segregated into atomic handlers.
"""

import os
import stripe
from datetime import datetime, timezone, date

from app.extensions import supabase
from app.utils.exceptions import StripeWebhookInvalid, ReplyIQError

# Set Stripe secret key on module import
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

# ── Plan Price ID Map ─────────────────────────────────────────

def _get_price_id_map() -> dict:
    raw = {
        os.environ.get("STRIPE_PRICE_ID_STARTER"): "starter",
        os.environ.get("STRIPE_PRICE_ID_PRO"):     "pro",
        os.environ.get("STRIPE_PRICE_ID_ULTRA"):   "ultra",
    }
    return {k: v for k, v in raw.items() if k}


def _env_price_id_for_plan(plan: str) -> str | None:
    mapping = {
        "starter": os.environ.get("STRIPE_PRICE_ID_STARTER"),
        "pro":     os.environ.get("STRIPE_PRICE_ID_PRO"),
        "ultra":   os.environ.get("STRIPE_PRICE_ID_ULTRA"),
    }
    return mapping.get(plan)


def _resolve_plan_from_price_id(price_id: str | None) -> str | None:
    if not price_id:
        return None

    env_map = _get_price_id_map()
    if price_id in env_map:
        return env_map[price_id]

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

    return None

# ── Function 1: create_checkout_session ──────────────────────

def create_checkout_session(user_id: str, user_email: str, plan: str) -> str:
    from app.utils.logger import log_event
    frontend_url = os.environ["FRONTEND_URL"]

    price_id = _env_price_id_for_plan(plan)

    if not price_id:
        log_event("stripe_config_missing_critical", plan=plan,
                  hint="Set STRIPE_PRICE_ID_{PLAN} in Railway environment variables.")
        raise ReplyIQError()

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=user_id,
            customer_email=user_email,
            metadata={"plan": plan},
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

# ── Function 3: handle_webhook_event (Main Router) ───────────

def handle_webhook_event(payload_bytes: bytes, sig_header: str) -> dict:
    from app.utils.logger import log_event
    webhook_secret = os.environ["STRIPE_WEBHOOK_SECRET"]

    # 1. Signature Verify Phase
    try:
        event = stripe.Webhook.construct_event(
            payload=payload_bytes, sig_header=sig_header, secret=webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise StripeWebhookInvalid()

    event_id   = event["id"]
    event_type = event["type"]
    log_event("webhook_received", event_id=event_id, event_type=event_type)

    # 2. Concurrency Lock Phase (Insert BEFORE logic to prevent race conditions)
    try:
        supabase.table("processed_webhooks").insert({"stripe_event_id": event_id}).execute()
    except Exception as e:
        # If this fails, it's a unique constraint violation (duplicate webhook) or a transient DB issue.
        # Either way, we drop the payload safely.
        log_event("webhook_duplicate_skipped_or_db_error", event_id=event_id, error=str(e))
        return {"received": True}

    # 3. Router Phase (Atomic Handlers to keep complexity low)
    try:
        if event_type == "checkout.session.completed":
            _handle_checkout_completed(event["data"]["object"])
            
        elif event_type == "customer.subscription.updated":
            _handle_subscription_updated(event["data"]["object"])
            
        elif event_type == "invoice.payment_failed":
            _handle_payment_failed(event["data"]["object"])
            
        elif event_type == "customer.subscription.deleted":
            _handle_subscription_deleted(event["data"]["object"])
            
        elif event_type == "invoice.payment_succeeded":
            _handle_payment_succeeded(event["data"]["object"])
            
    except Exception as e:
        log_event("webhook_handler_exception", event_type=event_type, error=str(e))

    return {"received": True}

# ── Atomic Webhook Handlers ──────────────────────────────────

def _handle_checkout_completed(session_data: dict):
    from app.utils.logger import log_event
    user_id         = session_data.get("client_reference_id")
    customer_id     = session_data.get("customer")
    subscription_id = session_data.get("subscription")

    plan = session_data.get("metadata", {}).get("plan")
    if plan not in ("starter", "pro", "ultra"):
        log_event("webhook_invalid_plan_in_metadata", plan=plan, user_id=user_id)
        return

    subscription_end = None
    if subscription_id:
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            subscription_end = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc).isoformat()
        except Exception as e:
            log_event("webhook_sub_retrieve_failed", subscription_id=subscription_id, error=str(e))

    if plan and customer_id:
        update_payload = {
            "plan": plan,
            "stripe_customer_id": customer_id,
            "billing_cycle_start": date.today().isoformat(),
        }
        if subscription_id: update_payload["stripe_subscription_id"] = subscription_id
        if subscription_end: update_payload["subscription_end"] = subscription_end

        updated = False
        if user_id:
            res = supabase.table("users").update(update_payload).eq("id", user_id).execute()
            if res.data:
                updated = True
                log_event("webhook_user_upgraded", user_id=user_id, plan=plan)

        if not updated:
            customer_email = session_data.get("customer_email") or session_data.get("customer_details", {}).get("email")
            if customer_email:
                res = supabase.table("users").update(update_payload).eq("email", customer_email).execute()
                if res.data:
                    log_event("webhook_user_upgraded_via_email", email=customer_email, plan=plan)
                else:
                    log_event("webhook_update_failed_no_user_found", email=customer_email)

def _handle_subscription_updated(payload_data: dict):
    from app.utils.logger import log_event
    customer_id = payload_data.get("customer")
    subscription_id = payload_data.get("id")

    # LIVE TRUTH CHECK: Webhooks arrive out-of-order. 
    # Do not trust the payload status. Query Stripe immediately for the truth.
    if not subscription_id: return

    try:
        live_sub = stripe.Subscription.retrieve(subscription_id)
        status = live_sub.status
    except Exception as e:
        log_event("webhook_live_sub_retrieve_failed", error=str(e))
        return

    log_event("webhook_subscription_update", customer_id=customer_id, status=status)

    if status in ("active", "trialing"):
        price_id = None
        items = live_sub.get("items", {}).get("data", [])
        if items: price_id = items[0].get("price", {}).get("id")
        
        new_plan = _resolve_plan_from_price_id(price_id)
        current_period_end = live_sub.current_period_end
        subscription_end = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat() if current_period_end else None

        if customer_id and new_plan:
            update_payload = {
                "plan": new_plan,
                "stripe_subscription_id": subscription_id,
                "subscription_end": subscription_end
            }
            log_event("webhook_subscription_sync", customer_id=customer_id, plan=new_plan, status=status)
            supabase.table("users").update(update_payload).eq("stripe_customer_id", customer_id).execute()
            
    elif status == "canceled":
        # If it's canceled, downgrade them to free immediately (DeLorean bug fix)
        _downgrade_to_free(customer_id)

def _handle_payment_failed(invoice_data: dict):
    from app.utils.logger import log_event
    customer_id  = invoice_data.get("customer")
    log_event("webhook_payment_failed", customer_id=customer_id)
    if customer_id:
        _downgrade_to_free(customer_id)

def _handle_subscription_deleted(sub_data: dict):
    from app.utils.logger import log_event
    customer_id = sub_data.get("customer")
    log_event("webhook_subscription_cancelled", customer_id=customer_id)
    if customer_id:
        _downgrade_to_free(customer_id)

def _downgrade_to_free(customer_id: str):
    from app.utils.logger import log_event
    try:
        supabase.table("users").update({
            "plan": "free", 
            "subscription_end": None, 
            "stripe_subscription_id": None
        }).eq("stripe_customer_id", customer_id).execute()
    except Exception as e:
        log_event("webhook_subscription_cancel_failed", customer_id=customer_id, error=str(e))

def _handle_payment_succeeded(invoice_data: dict):
    from app.utils.logger import log_event
    customer_id     = invoice_data.get("customer")
    subscription_id = invoice_data.get("subscription")

    if customer_id and subscription_id:
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            price_id = None
            items = sub.get("items", {}).get("data", [])
            if items: price_id = items[0].get("price", {}).get("id")

            plan = _resolve_plan_from_price_id(price_id)
            subscription_end = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc).isoformat()

            update_payload = {"subscription_end": subscription_end}
            if plan: update_payload["plan"] = plan

            supabase.table("users").update(update_payload).eq("stripe_customer_id", customer_id).execute()
            log_event("webhook_payment_succeeded_synced", customer_id=customer_id, plan=plan)
        except Exception as e:
            log_event("webhook_payment_succeed_sync_failed", customer_id=customer_id, error=str(e))

# ── Function 4: cancel_subscription ──────────────────────────

def cancel_subscription(user_id: str, stripe_customer_id: str, reason: str = None) -> bool:
    from app.utils.logger import log_event

    subscriptions = stripe.Subscription.list(customer=stripe_customer_id, status="active", limit=1)
    if not subscriptions.data:
        subscriptions = stripe.Subscription.list(customer=stripe_customer_id, status="trialing", limit=1)

    if subscriptions.data:
        subscription = subscriptions.data[0]
        stripe.Subscription.modify(subscription.id, cancel_at_period_end=True)
        log_event("subscription_cancel_scheduled", user_id=user_id, subscription_id=subscription.id)

    if reason:
        supabase.table("users").update({"cancellation_reason": reason}).eq("id", user_id).execute()

    return True
