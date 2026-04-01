import os
from app import create_app
from app.extensions import supabase

def check_field_existence(table_name, column_name):
    try:
        # Fetch one row to check for column existence
        result = supabase.table(table_name).select(column_name).limit(1).execute()
        print(f"✅ {table_name}.{column_name} is PRESENT.")
        return True
    except Exception as e:
        if "column" in str(e).lower() and "does not exist" in str(e).lower():
            print(f"❌ {table_name}.{column_name} is MISSING.")
        else:
            print(f"⚠️ {table_name}.{column_name} error: {str(e)}")
        return False

def run_diagnostics():
    print("=== GROUND-TRUTH SCHEMA DIAGNOSIS ===")
    
    # 1. Replies Table
    replies_check = [
        "opener_type",
        "quality_score",
        "tokens_used",
        "generation_ms",
        "cost_usd"
    ]
    
    missing_replies = []
    for col in replies_check:
        if not check_field_existence("replies", col):
            missing_replies.append(col)
            
    # 2. Users Table
    users_check = [
        "business_register",
        "daily_autonomy_limit"
    ]
    
    missing_users = []
    for col in users_check:
        if not check_field_existence("users", col):
            missing_users.append(col)
            
    print("\n=== SYSTEMIC RECONCILIATION SUMMARY ===")
    if not missing_replies and not missing_users:
        print("RESULT: ALL MIGRATIONS UP-TO-DATE. ZERO-BUG STATE ATTAINED.")
    else:
        print("RESULT: SCHEMA DESYNCHRONIZED. RUN THE FOLLOWING SQL IN SUPABASE EDITOR:")
        
        if missing_replies:
            print("\n-- FIX REPLIES TABLE --")
            for col in missing_replies:
                if col == "cost_usd":
                    print("ALTER TABLE public.replies ADD COLUMN cost_usd NUMERIC(15, 6) DEFAULT 0.000000;")
                elif col == "quality_score":
                    print("ALTER TABLE public.replies ADD COLUMN quality_score SMALLINT DEFAULT 0;")
                else:
                    print(f"ALTER TABLE public.replies ADD COLUMN {col} TEXT;")
                    
        if missing_users:
            print("\n-- FIX USERS TABLE --")
            for col in missing_users:
                if col == "daily_autonomy_limit":
                    print("ALTER TABLE public.users ADD COLUMN daily_autonomy_limit INT DEFAULT 20;")
                else:
                    print(f"ALTER TABLE public.users ADD COLUMN {col} TEXT;")

if __name__ == "__main__":
    app = create_app("development")
    with app.app_context():
        run_diagnostics()
