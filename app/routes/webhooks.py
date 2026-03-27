import json
from flask import Blueprint, request, jsonify, current_app
from app.utils.logger import log_event
from app.extensions import supabase
from app.services.ai_engine import generate_reply
from app.services.email_service import send_ai_reply_alert
from app.models.review_model import insert_review
from app.models.reply_model import insert_reply
from marshmallow import Schema, fields, ValidationError
import uuid

webhooks_bp = Blueprint("webhooks", __name__)

class InboundEmailSchema(Schema):
    """
    Simulates a generic inbound parse payload (e.g. from SendGrid or Mailgun).
    In production, this needs to map exactly to your chosen transactional mail provider.
    """
    sender = fields.Email(required=True)      # e.g. "mybusiness@gmail.com"
    subject = fields.String(required=False, missing="")
    text_body = fields.String(required=True)  # The actual review text

@webhooks_bp.route("/inbound-email", methods=["POST"])
def handle_inbound_email():
    """
    Track B: The Email Intercept Loop.
    Users forward Google Review notification emails to this endpoint.
    Retrieves the user by their sending email, extracts the review, 
    generates the reply, and emails it back.
    """
    log_event("webhook_received", endpoint="inbound-email")
    
    # Optional: Webhook signature verification should go here for production.
    # We omit it here so the user can test easily with curl during development.
    
    try:
        data = request.get_json()
        payload = InboundEmailSchema().load(data)
    except ValidationError as e:
        log_event("webhook_validation_failed", error=str(e.messages))
        # Always return 200 to webhooks so they don't infinitely retry bad requests
        return jsonify({"status": "ignored", "reason": "invalid_payload"}), 200

    sender_email = payload["sender"]
    review_text = payload["text_body"]
    
    # 1. Look up the user by email
    user_resp = supabase.table("users").select("*").eq("email", sender_email).maybe_single().execute()
    user = user_resp.data
    
    if not user:
        log_event("webhook_user_not_found", email=sender_email)
        return jsonify({"status": "ignored", "reason": "unregistered_sender"}), 200

    user_id = user["id"]
    biz_name = user.get("business_name", "Your Business")
    biz_type = user.get("business_type", "Business")
    tone = user.get("tone_preference", "professional")
    
    # 2. Insert the Review to DB
    # We must generate a fake google_review_id since we don't have the API payload
    google_review_id_mock = f"email_{uuid.uuid4().hex[:12]}"
    
    review_record = {
        "google_review_id": google_review_id_mock,
        "reviewer_name": "Email Customer", 
        "star_rating": 4, # Assume 4 stars for email forwards if we can't parse it
        "review_text": review_text[:1000], # Cap length to prevent absurd payload attacks
        "status": "pending"
    }
    
    inserted = insert_review(user_id, review_record)
    if not inserted:
        log_event("webhook_insert_failed", user_id=user_id)
        return jsonify({"status": "error", "message": "DB insert failed"}), 500
        
    review_id = inserted["id"]
    
    # 3. Trigger AI Pipeline
    try:
        import time
        start_time = time.time()
        
        ai_reply = generate_reply(
            business_name=biz_name,
            business_type=biz_type,
            tone_preference=tone,
            star_rating=review_record["star_rating"],
            review_text=review_record["review_text"]
        )
        
        gen_ms = int((time.time() - start_time) * 1000)
        
        # Save Draft
        reply_record = {
            "review_id": review_id,
            "reply_text": ai_reply,
            "status": "draft",
            "model_used": "email_webhook_auto",
            "generation_ms": gen_ms
        }
        insert_reply(user_id, reply_record)
        
        # Update Review state
        supabase.table("reviews").update({"status": "replied"}).eq("id", review_id).execute()
        
        log_event("webhook_ai_generated", user_id=user_id, review_id=review_id)
        
        # 4. Email the reply back to the user via Resend!
        try:
            send_ai_reply_alert(
                to_email=sender_email,
                reply_text=ai_reply,
                business_name=biz_name,
                review_text=review_record["review_text"]
            )
        except Exception as email_err:
            log_event("webhook_email_dispatch_failed", user_id=user_id, error=str(email_err))
            # Even if email fails, we save the draft, so we don't return 500 to the webhook
            
    except Exception as ai_err:
        log_event("webhook_ai_failed", user_id=user_id, review_id=review_id, error=str(ai_err))
        supabase.table("reviews").update({"status": "failed"}).eq("id", review_id).execute()
        return jsonify({"status": "error", "message": "AI Engine failed"}), 500

    return jsonify({"status": "success", "review_id": review_id}), 200
