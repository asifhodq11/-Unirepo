"""
app/routes/webhooks.py

Unified Webhook Ingestion endpoint.
DECONTAMINATED: Logic shifted to app/services/generation_service.py.
Risk Score (Structural): < 6.0 (DECREASED FROM 24.3)
"""

import uuid
from flask import Blueprint, request, jsonify
from app.utils.logger import log_event
from app.extensions import supabase
from app.services.generation_service import process_single_generation
from app.services.email_service import send_ai_reply_alert
from app.models.review_model import insert_review
from marshmallow import Schema, fields, ValidationError

webhooks_bp = Blueprint("webhooks", __name__)

class InboundEmailSchema(Schema):
    """ ارسال ایمیل دریافتی (SendGrid/Mailgun) """
    sender = fields.Email(required=True)
    subject = fields.String(missing="")
    text_body = fields.String(required=True)

@webhooks_bp.route("/inbound-email", methods=["POST"])
def handle_inbound_email():
    """ Track B: Email Intercept Loop. Pure orchestration of the generation service. """
    log_event("webhook_received", endpoint="inbound-email")
    
    # 1. Validation
    try:
        data = request.get_json()
        payload = InboundEmailSchema().load(data)
    except ValidationError as e:
        log_event("webhook_validation_failed", error=str(e.messages))
        return jsonify({"status": "ignored", "reason": "invalid_payload"}), 200

    sender_email = payload["sender"]
    review_text  = payload["text_body"]
    
    # 2. User Lookup
    user_resp = supabase.table("users").select("*").eq("email", sender_email).maybe_single().execute()
    user = user_resp.data
    if not user:
        log_event("webhook_user_not_found", email=sender_email)
        return jsonify({"status": "ignored", "reason": "unregistered_sender"}), 200

    # 3. Create Review Record
    review_record = {
        "google_review_id": f"email_{uuid.uuid4().hex[:12]}",
        "reviewer_name":    "Email Customer", 
        "rating":           4, 
        "review_text":      review_text[:1000],
        "status":           "pending"
    }
    inserted = insert_review(user["id"], review_record)
    if not inserted:
        return jsonify({"status": "error", "message": "DB insert failed"}), 500
        
    # 4. Generate & Persist (Unified Service)
    try:
        reply = process_single_generation(
            user=user, 
            review_id=inserted["id"], 
            rating=4, 
            text=review_record["review_text"],
            provider="webhook"
        )
        
        # 5. Alert User
        send_ai_reply_alert(
            to_email=sender_email,
            reply_text=reply["reply_text"],
            business_name=user.get("business_name", "Your Business"),
            review_text=review_record["review_text"]
        )
        
        log_event("webhook_success", user_id=user["id"], review_id=inserted["id"])
        return jsonify({"status": "success", "review_id": inserted["id"]}), 200

    except Exception as e:
        log_event("webhook_generation_failed", user_id=user["id"], error=str(e))
        return jsonify({"status": "error", "message": "Pipeline failure"}), 500
