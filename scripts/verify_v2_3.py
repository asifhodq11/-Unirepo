import sys
import os
from unittest.mock import MagicMock

# 1. SLAM SHUT THE ENVIRONMENT DOORS
# Mock every single key required by app/config.py BEFORE any imports
mock_env = {
    "SECRET_KEY": "test-secret",
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_ANON_KEY": "test-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-key",
    "GEMINI_API_KEY": "test-gemini-key",
    "GOOGLE_API_KEY": "test-google-key",
    "STRIPE_SECRET_KEY": "test-stripe-key",
    "STRIPE_WEBHOOK_SECRET": "test-webhook-key",
    "STRIPE_PRICE_ID_STARTER": "price_123",
    "RESEND_API_KEY": "test-resend-key",
    "FRONTEND_URL": "http://localhost:3000",
    "AI_PROVIDER": "openrouter",
    "OPENROUTER_API_KEY": "test-openrouter-key"
}
os.environ.update(mock_env)

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 2. MOCK THE CLIENTS TO PREVENT API CALLS DURING LOGIC TEST
import app.services.ai_engine as ai_module
# Mock the openai and genai clients
ai_module.OpenAI = MagicMock()
ai_module.genai = MagicMock()
ai_module.gemini_client = MagicMock()

from app.services.ai_engine import ReplyEngine

def test_vitals():
    engine = ReplyEngine()
    
    # We will mock the _call_llm to return a sample response that reflects the logic
    # instead of hitting a real API (since we are testing the ENGINE logic and word targets)
    
    test_cases = [
        {
            "review": "Food was decent but the service was just okay. Not sure if we would come back given the price.",
            "stars": 3,
            "tone": "friendly",
            "business": "Arsalan Biriyani",
            "mock_response": "Glad you liked the food. Sorry about the service though—we're working on that. Hopefully we see you again."
        },
        {
            "review": "The lamb chops were indeed perfect, and Marco's wine pairings truly complemented the meal. Waiting 40 minutes for a table was frustrating.",
            "stars": 4,
            "tone": "professional",
            "business": "L'Opera",
            "mock_response": "Glad the lamb and wine paired well. The 40-minute wait isn't right—I'll look into our booking flow for Saturday."
        },
        {
            "review": "Finding a hair in your food is unacceptable, and I'm sorry to hear about your experience with the manager's response.",
            "stars": 1,
            "tone": "empathetic",
            "business": "The Bistro",
            "mock_response": "I'm genuinely sorry about the hair and the manager's reaction. This shouldn't have happened. Please reach out to me directly."
        }
    ]
    
    print("\n🚀 ReplyIQ V2.3 'Brevity & Authenticity' Logic Verification")
    print("="*60)
    
    for i, case in enumerate(test_cases, 1):
        # Mock the LLM call to return the case's expected flavor
        engine._call_llm = MagicMock(return_value=case['mock_response'])
        
        print(f"\n[Test Case {i}] {case['business']} ({case['stars']}★ - {case['tone']})")
        print(f"Review: \"{case['review']}\"")
        
        reply = engine.generate_reply(
            review_text=case['review'],
            rating=case['stars'],
            tone_preference=case['tone'],
            business_name=case['business']
        )
        
        word_count = len(reply.split())
        print(f"Reply: \"{reply}\"")
        print(f"📏 Word Count: {word_count} words")
        
        # Validation checks
        slop_list = ["invaluable feedback", "exceed expectations", "continually working", "deeply apologize", "strive to provide"]
        forbidden_found = [slop for slop in slop_list if slop.lower() in reply.lower()]
        
        if forbidden_found:
            print(f"❌ SLOP DETECTED: {', '.join(forbidden_found)}")
        else:
            print("✅ SLOP-FREE (V2.3 Clean)")
            
        # Target check (3-star target is 35-55)
        target = ai_module.STAR_CONTRACTS[case['stars']]['word_target']
        print(f"🎯 Target Range: {target[0]}-{target[1]} words")
        
        if word_count > target[1]:
            print(f"⚠️ BREVITY WARNING: Over {target[1]} words.")
        else:
            print("✅ BREVITY PASSED")

if __name__ == "__main__":
    test_vitals()
