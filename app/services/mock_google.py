import random
import uuid
import datetime

# Mock realistic customer data to test the AI engines effectively
NAMES = ["John D.", "Sarah P.", "Mike T.", "Elena K.", "David R.", "Alexandria M.", "Chris W."]
POSITIVE_REVIEWS = [
    "Absolutely incredible experience. The staff was super friendly and the quality was top notch. Will definitely be coming back!",
    "Loved it. Very fast service and exactly what I was looking for.",
    "Best place in town. I was blown away by the attention to detail. 5 stars easily.",
    "Great value for money. Highly recommend to anyone passing through."
]
NEUTRAL_REVIEWS = [
    "It was okay. Nothing special but not terrible either.",
    "Service was a bit slow today, but the product was fine.",
    "Decent experience. A bit overpriced for what you get."
]
NEGATIVE_REVIEWS = [
    "Terrible customer service. Waited 45 minutes and no one helped me.",
    "Very disappointed. The quality has really gone down recently. I won't be returning.",
    "Completely unprofessional. They got my order wrong and refused to fix it."
]

def generate_fake_reviews(business_name: str, max_count: int = 3) -> list:
    """
    Simulates checking the Google Business API for new reviews.
    Randomly generates 0 to `max_count` reviews.
    Weighted towards 4-5 stars, but includes negative reviews to test AI routing. 
    """
    num_new_reviews = random.randint(0, max_count)
    reviews = []
    
    for _ in range(num_new_reviews):
        # 60% chance of 5 star, 20% 4 star, 10% 3 star, 5% 2 star, 5% 1 star
        roll = random.randint(1, 100)
        if roll <= 60:
            stars = 5
            text = random.choice(POSITIVE_REVIEWS)
        elif roll <= 80:
            stars = 4
            text = random.choice(POSITIVE_REVIEWS)
        elif roll <= 90:
            stars = 3
            text = random.choice(NEUTRAL_REVIEWS)
        elif roll <= 95:
            stars = 2
            text = random.choice(NEGATIVE_REVIEWS)
        else:
            stars = 1
            text = random.choice(NEGATIVE_REVIEWS)

        # Mocking the payload structure of the real Google API
        review_data = {
            "name": f"accounts/123/locations/456/reviews/{uuid.uuid4().hex[:12]}",
            "reviewer": {"displayName": random.choice(NAMES)},
            "starRating": _num_to_google_star(stars),
            "numericRating": stars, # Non-standard but helpful
            "comment": text,
            "createTime": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "updateTime": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        reviews.append(review_data)
        
    return reviews

def _num_to_google_star(num: int) -> str:
    mapping = {
        1: "ONE",
        2: "TWO",
        3: "THREE",
        4: "FOUR",
        5: "FIVE"
    }
    return mapping.get(num, "THREE")
