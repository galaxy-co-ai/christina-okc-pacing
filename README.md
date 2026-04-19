# Christina — OKC Marathon Pacing Plan

Race-day pacing plan for Christina at the 2026 Oklahoma City Memorial Marathon (April 26, 2026), with an on-page AI coach powered by Anthropic's Claude.

- `index.html` — the pacing plan UI (cruise / fight / finish zones, hydration stops, overrides)
- `api/coach.ts` — Vercel Edge function wrapping Claude for in-race coaching questions
- Deployed on Vercel; `ANTHROPIC_API_KEY` set as a production env var
