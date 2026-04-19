# Christina OKC Pacing — Claude Instructions

Single-file static web app hosting Christina's pacing plan for the 2026 Oklahoma City Memorial Marathon (April 26, 2026), with an AI coach powered by Anthropic's Claude. Deployed on Vercel (CB Media team). Public, no auth, no analytics.

## Stack

- **Frontend:** Pure static `index.html` — inline `<style>` + inline `<script>`. Zero build step. No framework.
- **Backend:** One Vercel Edge function at `api/coach.ts` using `@anthropic-ai/sdk`, model `claude-haiku-4-5-20251001`.
- **Deploy:** Vercel, team `cbmedia`. Production alias: `christina-okc-pacing.vercel.app`. GitHub: `galaxy-co-ai/christina-okc-pacing`.
- **Env:** `ANTHROPIC_API_KEY` set on Vercel production + `.env.local` (gitignored).

## Design System

**Boutique** (Mechanical Sfumato) — see `designs/brand.md` and the workspace `designs/systems/boutique/profile.md`. Warm parchment (`#F5F4F0`) + ink-black (`#18181F`) + interactive blue + informational amber. Switzer display, Geist-Mono-optional data.

Zone colors (`--cruise`, `--fight`, `--finish`) are preserved as domain semantics — do not collapse them into the Boutique accent/data palette. Blue/amber/zone-colors never cross roles.

## Before ANY UI change

1. Read `designs/brand.md` in this project
2. Read the token block at the top of `index.html` (`:root`) — this file IS the stylesheet
3. Never use raw Tailwind-style colors or hardcoded hex — reference tokens only
4. Test at 390px, 768px, 1024px, 1440px — the UI must respond

## Architecture notes

- `MILES` (26 entries + 0.2 finish segment), `MILE_DETAILS` (bullets per mile), `PLANS` (Standard / Weather-Adjusted / Effort-Based), `ELEV` (per-mile ft deltas) — all inline constants in the `<script>` block
- `paceOverrides` is the only mutable state. Keyed by mile. Reset on plan switch.
- `renderSplits()` rebuilds the full list on first render and plan switch. `refreshSplitsAfterEdit()` updates in place without destroying DOM (preserves focus + expanded state).
- **Gotcha:** When editing the splits render, target the pace text span with `querySelector('.split-pace-group > .split-pace')`. Broad `.split-pace-group span` selectors match the colored `.split-dot` first and will visually duplicate pace text into the dot. This bug shipped once (2026-04-18) — do not reintroduce.

## Coach function

- `api/coach.ts` is an Edge-runtime function. `@types/node` required as devDep for the `process.env` reference to typecheck.
- System prompt lives inline in the function — encodes Christina's plan, hydration, forecast, course profile. Update here if the plan changes.
- Keep model as Haiku 4.5 — latency matters for race-day use. If quality degrades, escalate to Sonnet 4.6, not Opus.

## Deploy

```bash
# From project root
vercel --prod --yes --scope=cbmedia

# Env var changes (production)
printf '%s' "$KEY" | vercel env add ANTHROPIC_API_KEY production --scope=cbmedia
vercel --prod --yes --scope=cbmedia  # redeploy to pick up
```

Vercel team `cbmedia` has SAML, but this project is **intentionally public** (no deployment protection). Do not enable SSO on this project — it's a gift, Christina needs to open it on race day without any friction.

## What NOT to do

- Don't add analytics, tracking, or third-party scripts — this is personal
- Don't add auth — public URL is the point
- Don't mutate the JS render algorithm without re-reading the selector gotcha above
- Don't port to React/Next — it's a single HTML file on purpose, under ~80KB
- Don't broaden the Boutique palette with purple — banned in the system
