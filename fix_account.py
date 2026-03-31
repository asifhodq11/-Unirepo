from dotenv import load_dotenv
load_dotenv()

from app.extensions import supabase

def update_user():
    email = "skriyaj112005@gmail.com"
    print(f"Checking user: {email}")
    res = supabase.table("users").select("id, plan, stripe_customer_id").eq("email", email).execute()
    if not res.data:
        print("User not found in the database!")
        return
    
    print(f"Current state: {res.data[0]}")
    
    # Update to starter
    update = supabase.table("users").update({"plan": "starter"}).eq("email", email).execute()
    print(f"Updated state: {update.data}")

if __name__ == "__main__":
    update_user()
