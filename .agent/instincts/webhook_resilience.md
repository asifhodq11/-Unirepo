---
description: Automatically applied safety patterns when working with webhooks, idempotency, or asynchronous external events.
confidence: 0.95
tags: [webhook, stripe, security, concurrency, reliability, bug-hunter]
scope: project
---

# Webhook Resilience and Concurrency Fixes

## 1. The Idempotency Inversion Pattern (Race Condition Prevention)
**Trigger:** Whenever wiring an idempotency lock backed by a database.
**Anti-Pattern:** Checking existence (`select`), executing business logic, then marking as processed (`insert`). This allows two webhooks hitting simultaneously to bypass the lock and duplicate logic.
**Fix Pattern (Instinct):** Always invert the lock. Attempt to `insert` the ID into the processing table *first*. Rely on the database's Unique Constraint to throw an error on the duplicate. Catch the constraint exception and abort `return 200` *before* executing business logic. 

```python
# GOOD
try:
    db.table("webhooks").insert({"id": event_id})
except UniqueConstraintViolation:
    return {"received": True} # Duplicate dropped instantly

# BAD
if not db.table("webhooks").select("id").eq(event_id):
    run_logic()
    db.table("webhooks").insert({"id": event_id}) # Race condition window open!
```

## 2. The DeLorean Trap (Out-of-Order Events)
**Trigger:** Processing Webhook events that alter crucial user state (e.g. `customer.subscription.updated` or `customer.subscription.deleted`).
**Anti-Pattern:** Trusting the webhook JSON payload `event["data"]["object"]` to be the absolute truth. Since webhooks aren't guaranteed to arrive chronologically, a stale update event can arrive *after* a cancel event.
**Fix Pattern (Instinct):** For any state-altering webhook, only use the ID from the payload. Query the external service (e.g. `stripe.Subscription.retrieve(id)`) synchronously inside the handler to fetch the *LIVE TRUTH*.

## 3. Webhook Monolith Avoidance
**Trigger:** Writing a webhook handler (`if event_type == X`).
**Anti-Pattern:** Putting all logic inline inside a massive `if/elif` block. Over time, cyclomatic complexity exceeds 40+.
**Fix Pattern (Instinct):** The `handle_webhook_event` function must ONLY do verification and routing. Offload the actual logic into atomic private functions (`_handle_subscription_deleted(payload)`).
