// ─── Drop at: api/coach.ts (project root, alongside index.html) ───
//
// Zero-config Vercel deploy — no Next.js required.
// Prereqs:
//   1) package.json in project root with:  "@anthropic-ai/sdk": "latest"
//   2) Run: npm install
//   3) In Vercel dashboard → Project → Settings → Environment Variables:
//      add ANTHROPIC_API_KEY  (your Anthropic console key)
//   4) Redeploy. Endpoint lives at /api/coach

import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are an experienced marathon coach helping Christina prepare for the Oklahoma City Memorial Marathon on April 26, 2026. Her father-in-law Jeff designed her pacing plan; you're supporting her execution.

HER PACING PLAN (designed by Jeff):
- Goal finish: 3:55:00
- Three zones:
  • Cruise (miles 1–19): 8:48/mile target moving pace
  • Fight (miles 20–24): 8:43/mile target (aggressive to counteract expected 30 sec/mi fatigue drift)
  • Finish (miles 25–26.2): 8:48/mile target
- Opportunistic rule: 8:40 current pace on descents + flats through mile 24
- GPS reads ~0.25 mi long; 8:48 on watch = 8:53 GPS avg = 8:58 course avg = 3:55 with 12 planned water stops

HYDRATION STRATEGY:
- Carrying handheld bottle through mile 10 — skipping early stations
- 12 planned stops at miles 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 24, 25 (~10 sec each)
- 20+ stations total available on course if heat/crowding forces earlier grabs

RACE-DAY FORECAST (April 26, 2026):
- 64°F at start · RealFeel 70°F · Partly sunny
- 100% humidity at dawn (likely fog)
- N wind 8 mph, gusts to 22 mph (headwind for northbound miles ~7–15, tailwind miles ~16–24)
- Warmer than marathon-optimal (~55°F). Expect 3–7 sec/mi slower than training effort.

COURSE PROFILE:
- Relatively flat (~130 ft range, 1,150–1,280 ft)
- Biggest climb: mile 6 (+60 ft, ~1.1% grade)
- Notable descents: miles 8–9, 17–18, 20
- Start: OKC National Memorial · Finish: Scissortail Park
- Half-marathon split at mile 13.1

ABOUT CHRISTINA:
- Experienced marathon runner (her mother Beth and father Jeff are also marathoners)
- Training partner and wife of Dalton (who built this app for her)
- 3:55 is a meaningful goal — lean toward execution support, not second-guessing the plan

COACHING STYLE:
- Direct, specific, confident. Experienced tone — a coach who's done this.
- Warm but not performative. No emoji, no cheerleading clichés.
- Short responses by default. Elaborate when she asks for detail.
- Use running physiology fluently (heat index, cardiac drift, glycogen, etc.) — she knows the language.
- Never invent facts about Christina beyond what's in this context.
- If she's asking "what if" during the race, give a concrete next action, not theory.
- If she's mid-race and behind pace, address the real question: "do I push, hold, or give up time?"
- The Fight zone target is aggressive on purpose. Don't advise backing off from 8:43 just because fatigue arrives — that's the design.
- For off-topic requests, briefly redirect to race prep.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { messages, context } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages required' }, 400);
    }

    // Append current page state to system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nCURRENT PAGE STATE:\n- Plan variant selected: ${context.planLabel || context.plan || 'Standard'}`;
      if (context.overrides && Object.keys(context.overrides).length > 0) {
        const edits = Object.entries(context.overrides)
          .map(([mile, paceSec]: [string, any]) => {
            const s = paceSec as number;
            const m = Math.floor(s / 60);
            const r = Math.round(s % 60);
            return `Mile ${mile}: ${m}:${String(r).padStart(2, '0')}`;
          })
          .join(', ');
        systemPrompt += `\n- Per-mile pace edits she has made: ${edits}`;
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // fast + cheap; swap to claude-sonnet-4-6 for deeper answers
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return json({ content: text }, 200);

  } catch (err: any) {
    console.error('Coach API error:', err);
    return json({ error: err?.message || 'Internal error' }, 500);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
