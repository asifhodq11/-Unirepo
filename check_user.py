from dotenv import load_dotenv
load_dotenv()
from app.extensions import supabase

def check():
    res = supabase.table("users").select("*").eq("email", "skriyaj112005@gmail.com").execute()
    if res.data:
        print("User data:")
        print(res.data[0])
    else:
        print("User not found at all")

if __name__ == "__main__":
    check()
