"""
app/utils/pricing.py

Calculates the estimated USD cost of an AI API call based on the model used.
Pricing is derived from official provider documentation (per 1M input/output tokens).
Since we log 'total_tokens' uniformly to prevent schema bloat, we use a 
'blended' rate leaning slightly towards output prices, as our generations 
are typically 150-250 words after a 100-word context.
"""

# Prices in USD per 1 Million Tokens (Blended Average)
PRICE_PER_MILLION_TOKENS = {
    # OpenRouter Models
    "openai/gpt-4o-mini": 0.45,   # Input: $0.15 | Output: $0.60
    "openai/gpt-4o": 3.75,        # Input: $2.50 | Output: $10.00
    "anthropic/claude-3.5-sonnet": 10.50, # Input: $3.00 | Output: $15.00
    "meta-llama/llama-3-8b-instruct:free": 0.00,
    "qwen/qwen-2.5-72b-instruct": 0.40,
    
    # Native OpenAI Models
    "gpt-4o-mini": 0.45,
    "gpt-4o": 3.75,
    
    # Native Google Gemini Models
    "gemini-2.5-flash": 0.20,     # Input: $0.075 | Output: $0.30
    "gemini-2.5-pro": 3.50,       # Input: $1.25  | Output: $5.00
}

# Fallback cost for unknown models to prevent calculation errors
DEFAULT_PRICE_PER_MILLION = 1.00

def calculate_cost_usd(model_id: str, total_tokens: int) -> float:
    """
    Calculates the exact fractional USD cost for a given token count.
    Returns: A float rounded to 6 decimal places.
    """
    if not total_tokens or total_tokens <= 0:
        return 0.000000
        
    # Clean model id of prepends or tags if necessary
    clean_model_id = model_id.strip()
    
    rate_per_million = PRICE_PER_MILLION_TOKENS.get(clean_model_id, DEFAULT_PRICE_PER_MILLION)
    
    cost = (total_tokens / 1_000_000) * rate_per_million
    
    return round(cost, 6)
