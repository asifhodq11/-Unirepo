from dotenv import load_dotenv
load_dotenv()
import os
import stripe
from app.extensions import supabase

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

def update_user_stripe():
    email = "skriyaj112005@gmail.com"
    customers = stripe.Customer.search(
        query=f"email:'{email}'",
        limit=1
    )
    
    if customers.data:
        customer_id = customers.data[0].id
        print(f"Found Stipe Customer: {customer_id}")
        
        # update DB
        res = supabase.table("users").update({"stripe_customer_id": customer_id}).eq("email", email).execute()
        print("DB updated:", res.data)
    else:
        print("No stripe customer found for this email.")

if __name__ == "__main__":
    update_user_stripe()
