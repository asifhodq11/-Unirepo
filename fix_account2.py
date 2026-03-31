from dotenv import load_dotenv
load_dotenv()

from app.extensions import supabase

def update_user():
    email = "asifhos30@gmail.com"
    print(f"Checking user: {email}")
    res = supabase.table("users").select("id, plan, stripe_customer_id").eq("email", email).execute()
    if not res.data:
        print("User not found!")
        return
    
    print(f"Current state: {res.data[0]}")
    
    # Update to pro
    update = supabase.table("users").update({"plan": "pro"}).eq("email", email).execute()
    print(f"Updated state: {update.data}")

if __name__ == "__main__":
    update_user()
