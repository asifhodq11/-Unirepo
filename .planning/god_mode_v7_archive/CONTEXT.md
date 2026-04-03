# ReplyIQ Context

## Vision
To build an elite, reliable, and premium SaaS for intelligent review replies. The system must prevent context decay, route requests efficiently based on emotional energy, handle AI provider instability gracefully, and monetize seamlessly through Stripe.

## Tech Stack
- **Backend:** Python, Flask, Supabase, OpenAI SDK, Google GenAI SDK
- **Frontend:** React, Vite, TailwindCSS (TBD - currently plain CSS/custom UI)
- **Database:** Supabase PostgreSQL
- **Payments:** Stripe Checkout & Webhooks
- **AI Providers:** OpenRouter (OpenAI, Anthropic, Gemma, etc.), Google Direct API

## Codebase Map
- `/app/`: Flask Backend
  - `routes/`: API controllers (reviews, auth, payments, sync)
  - `services/`: Core logic (`ai_engine.py`, `model_router.py`, `stripe_service.py`)
  - `models/`: DB interaction layer (`review_model.py`, `reply_model.py`)
  - `utils/`: `exceptions.py`
  - `__init__.py`: App setup & global error handling
- `/frontend/`: React Vite SPA
  - `src/pages/`: Dashboard, History, Authenticated routing
  - `src/components/`: Reusable UI
- `/supabase/`: DB migrations and types
