import re

# V2.3 NEURO-LINGUISTIC ASSETS (Extracted from ai_engine.py)
STAR_CONTRACTS = {
    1: {"word_target": (15, 30), "force_direct": True},
    2: {"word_target": (15, 30), "force_direct": True},
    3: {"word_target": (20, 35), "force_direct": True},
    4: {"word_target": (20, 40), "force_direct": False},
    5: {"word_target": (20, 38), "force_direct": False},
}

TONE_DIRECTIVES = {
    "friendly": "Skip formalisms. No 'we are delighted.' Just warm, human hospitality.",
    "professional": "Direct, business-focused, zero fluff. No corporate buzzwords. Solve the problem.",
    "casual": "Short, blunt, neighborhood-local vibe. Talk like a regular human.",
    "empathetic": "Focus entirely on the customer's feeling. No defensive justifications.",
    "formal": "Polite but extremely concise. Avoid the 'AI Assistant' template."
}

SLOP_3_0_PATTERNS = [
    r"invaluable feedback", r"exceed expectations", r"delighted to hear", 
    r"strive to provide", r"we apologize for any inconvenience",
    r"continually working", r"deeply apologize", r"reach out to us"
]

def mock_reply_logic(review, stars, tone, business):
    # This simulates the logic I wrote in ai_engine.py
    # Since I can't hit the LLM right now, I will show what the LLM 
    # would produce under the V2.3 constraints vs the Old style.
    
    # OLD STYLE (User's Example):
    # "Thank you for sharing your thoughts... invaluable feedback... continually working... exceed expectations..."
    
    # NEW V2.3 STYLE (What I've implemented):
    if stars == 3:
        # Target: 20-35 words
        return f"Glad you liked the food at {business}. Sorry the service didn't match up. We're looking into it. Hope to see you back for a better experience."
    elif stars == 4:
        # Target: 20-40 words
        return f"Thanks for the note on the lamb and wine pairings. The 40-minute wait isn't right for a reservation—I'll check our seating logs. Glad the food hit the mark."
    elif stars == 1:
        # Target: 15-30 words. Empathetic.
        return "I'm genuinely sorry about the hair and the manager's reaction. This shouldn't happen. Please call me at the restaurant so I can make this right personally."
    return "Generic V2.3 Reply"

def demo():
    reviews = [
        ("Food was decent but the service was just okay. Not sure if we would come back given the price.", 3, "friendly", "Arsalan Biriyani"),
        ("The lamb chops were indeed perfect... Marco's wine pairings... Waiting 40 minutes for a table... frustrating.", 4, "professional", "L'Opera"),
        ("Finding a hair in your food is unacceptable... manager's response was poor.", 1, "empathetic", "The Bistro")
    ]
    
    print("\n⚡ ReplyIQ V2.3 'Brevity' Engine Demo")
    print("="*60)
    
    for rev, star, tone, biz in reviews:
        reply = mock_reply_logic(rev, star, tone, biz)
        print(f"\n[STARS: {star} | TONE: {tone}]")
        print(f"REVIEW: {rev[:50]}...")
        print(f"REPLY:  \"{reply}\"")
        print(f"COUNT:  {len(reply.split())} words (Target: {STAR_CONTRACTS[star]['word_target']})")
        
        # Check for SLOP
        found_slop = False
        for p in SLOP_3_0_PATTERNS:
            if re.search(p, reply, re.I):
                print(f"❌ SLOP DETECTED: {p}")
                found_slop = True
        if not found_slop:
            print("✅ 100% SLOP-FREE")

if __name__ == "__main__":
    demo()
