# Christina OKC Pacing — Claude Instructions

Single-file static web app hosting Christina's pacing plan for the 2026 Oklahoma City Memorial Marathon (April 26, 2026), with an AI coach powered by Anthropic's Claude. Deployed on Vercel (CB Media team). Public, no auth, no analytics.

## Stack

- **Frontend:** Pure static `index.html` — inline `<style>` + inline `<script>`. Zero build step. No framework. Two self-contained modules inside the script: `RaceMap` (inline chart) and `MapSheet` (course-map FAB + bottom sheet).
- **Backend:** Two Vercel Edge functions. `api/coach.ts` runs the coach with Anthropic tool use (model `claude-haiku-4-5-20251001`). `api/plan.ts` reads the overlay + revert endpoint.
- **Persistence:** Neon Postgres. `plan_edits` (single JSONB row keyed `christina`) + `plan_changes` (append-only audit log).
- **Deploy:** Vercel, team `cbmedia`. Production alias: `christina-okc-pacing.vercel.app`. GitHub: `galaxy-co-ai/christina-okc-pacing`. **Git integration is live** — push to `main` auto-deploys. No CLI token needed day-to-day.
- **Env:** `ANTHROPIC_API_KEY` + `DATABASE_URL` set on Vercel production and `.env.local` (gitignored). Neon-Vercel integration handles DB URL.

## Design System

**Boutique** (Mechanical Sfumato) — see `designs/brand.md` and the workspace `designs/systems/boutique/profile.md`. Warm parchment (`#F5F4F0`) + ink-black (`#18181F`) + interactive blue + informational amber. Switzer display, Geist-Mono-optional data.

Zone colors (`--cruise`, `--fight`, `--finish`) are preserved as domain semantics — do not collapse them into the Boutique accent/data palette. Blue/amber/zone-colors never cross roles.

## Before ANY UI change

1. Read `designs/brand.md` in this project
2. Read the token block at the top of `index.html` (`:root`) — this file IS the stylesheet
3. Never use raw Tailwind-style colors or hardcoded hex — reference tokens only
4. Test at 390px, 768px, 1024px, 1440px — the UI must respond

## Architecture notes

- `MILES` (26 entries + 0.2 finish segment), `MILE_DETAILS` (bullets per mile), `PLANS` (Standard / Weather-Adjusted / Effort-Based), `ELEV` (per-mile ft deltas) — all inline constants in the `<script>` block.
- `paceOverrides` (local) is merged with `persistedOverlay.paceOverrides` (coach) on plan switch. Coach edits persist across plan changes; local slider tweaks don't.
- `persistedOverlay` also holds `mileBullets`, `forecast`, `reminders`, `fuelSchedule`. Loaded from `/api/plan` on boot + on `visibilitychange`.
- `renderSplits()` rebuilds the full list on first render and plan switch. `refreshSplitsAfterEdit()` updates in place without destroying DOM (preserves focus + expanded state). Collapsed state filters to **key miles only** (`KEY_MILES = {1, 5, 10, 15, 20, 24, 26.2}`) via a `.split-key` class + `.splits:not(.expanded) .split:not(.split-key) { display: none }` rule. Race day auto-expands so the current-mile row is never hidden.
- `RaceMap` (inline chart): 4 views (course / pace / water / fuel). `updateDims()` re-measures container each render; `viewBox` matches container pixel size so text never distorts. Debounced resize handler re-renders.
- `MapSheet` (course-map FAB): 5 toggleable layers (zones / miles / water / fuel / landmarks). `ROUTE` is **real OKC Memorial Marathon 2026 course geometry** — 80 waypoints derived from the official Garmin GPX (587 trackpoints downsampled, equirectangular projection with cos(35.5°) x-correction, fitted into the 400×640 viewBox with 30px margin). Mile values are real cumulative-distance fractions, so `pointAtMile()` interpolates HALF (13.1), LAST 5K (23.2), and finish (26.2) at geographically correct positions. Catmull-Rom smoothing on render. Race-day "now" pulse at current mile.
- **Pill-tab indicator** uses measured DOM rects (`positionPillIndicator()`), not an `idx * 100%` transform. The transform-by-self-width approach drifted ~1px per index step on certain pill widths, leaving the white indicator visibly off-center. Resize listener re-measures.
- **Gotcha 1:** When editing the splits render, target the pace text span with `querySelector('.split-pace-group > .split-pace')`. Broad `.split-pace-group span` selectors match the colored `.split-dot` first and will visually duplicate pace text into the dot. This bug shipped once (2026-04-18) — do not reintroduce.
- **Gotcha 2:** The template literal in `renderSplits` that builds `.split-details` references `allBullets.length`, not `bullets.length`. Getting this wrong throws a ReferenceError that blocks `applyPlan()` from ever reaching `renderReminders()` — so BOTH splits and reminders vanish. Shipped once (2026-04-19) — do not reintroduce.
- **Gotcha 3:** When a fixed-position sheet has a visual offset (`bottom: Xvh` or `bottom: Xpx`), the close-state transform MUST clear that offset explicitly: `transform: translateY(calc(100% + Xpx))` (or vh equivalent). A bare `translate(..., 100%)` only moves the sheet down by its own height, leaving an X-sized strip of the sheet's top header peeking above the viewport bottom edge. Shipped once on `.map-sheet` desktop variant (2026-04-25, 4vh offset peek) — do not reintroduce. `.ops-sheet` and `.map-sheet` desktop both correct now; reference them when adding new sheets.
- **Gotcha 4:** `ROUTE` mile values are real GPS cumulative-distance fractions (e.g., `mile: 0.38` between waypoint 1 and 2), not assumed integers. `pointAtMile(13.1)` linearly interpolates between the two waypoints whose mile values bracket 13.1. Don't replace ROUTE with integer-mile waypoints — that breaks all sub-mile landmark positions (HALF, LAST 5K, finish). Source GPX + projection script live at `workspace/audit/okc-marathon-2026.gpx` + `workspace/audit/gpx-to-route.mjs` for repeatability.

## Coach function

- `api/coach.ts` is an Edge-runtime function. `@types/node` required as devDep for the `process.env` reference to typecheck.
- System prompt lives inline. Encodes Christina's plan, hydration, **fueling defaults** (miles 5, 10, 15, 20, 24), forecast, course profile. Update here if the plan changes.
- Tool loop: max 3 iterations, stops on `stop_reason !== 'tool_use'`. Executes tools against the in-memory overlay, saves once at end.
- Tools live in `lib/tools.ts`. 9 total; see INDEX.md feature map. Every tool requires a `reason` string in Christina's voice. Revertable: `set_mile_pace`, `add_mile_bullet`, `add_reminder`, `add_fuel_point`, `set_fuel_schedule`.
- Keep model as Haiku 4.5 — latency matters for race-day use. If quality degrades, escalate to Sonnet 4.6, not Opus.

## Deploy

Git integration is live — pushing to `main` auto-deploys to production.

```bash
# Normal workflow
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add -A
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "..."
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
# Vercel picks up within ~15s, ready in ~30–45s

# Manual CLI (only if auth is set — tokens are 1-day, often expired)
vercel --prod --yes --scope=cbmedia

# Env var changes (production, requires CLI auth)
printf '%s' "$KEY" | vercel env add ANTHROPIC_API_KEY production --scope=cbmedia
```

Use the Vercel MCP (`mcp__vercel__list_deployments`, `mcp__vercel__get_deployment`) to poll build state instead of trying to re-auth the CLI each session.

Vercel team `cbmedia` has SAML, but this project is **intentionally public** (no deployment protection). Do not enable SSO on this project — it's a gift, Christina needs to open it on race day without any friction.

## What NOT to do

- Don't add analytics, tracking, or third-party scripts — this is personal
- Don't add auth — public URL is the point
- Don't mutate the JS render algorithm without re-reading the selector gotcha above
- Don't port to React/Next — it's a single HTML file on purpose, under ~80KB
- Don't broaden the Boutique palette with purple — banned in the system
