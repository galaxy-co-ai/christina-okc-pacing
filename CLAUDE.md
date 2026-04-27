# Christina OKC Pacing — Claude Instructions

Single-file static web app hosting Christina's pacing plan for the 2026 Oklahoma City Memorial Marathon (April 26, 2026), with an AI coach powered by Anthropic's Claude. Deployed on Vercel (CB Media team). Public, no auth, no analytics.

## Stack

- **Frontend:** Pure static `index.html` — inline `<style>` + inline `<script>`. Zero build step. No framework. Self-contained modules inside the script: `RaceMap` (inline chart), `MapSheet` (course-map sheet), `RaceArchive` (archive fetch + Training/Results renderers), plus `initOps`, `initAnalytics`, `initActionMenu` IIFEs. All four bottom-anchored sheets register on a shared `Sheets` registry so the action FAB can route clicks via `data-target`.
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
- `MapSheet` (course-map sheet, opened via the action FAB menu): 5 toggleable layers (zones / miles / water / fuel / landmarks). `ROUTE` is **real OKC Memorial Marathon 2026 course geometry** — 80 waypoints derived from the official Garmin GPX (587 trackpoints downsampled, equirectangular projection with cos(35.5°) x-correction, fitted into the 400×640 viewBox with 30px margin). Mile values are real cumulative-distance fractions, so `pointAtMile()` interpolates HALF (13.1), LAST 5K (23.2), and finish (26.2) at geographically correct positions. Catmull-Rom smoothing on render. Race-day "now" pulse at current mile.
- **Pill-tab indicator** uses measured DOM rects (`positionPillIndicator()`), not an `idx * 100%` transform. The transform-by-self-width approach drifted ~1px per index step on certain pill widths, leaving the white indicator visibly off-center. Resize listener re-measures.
- **Gotcha 1:** When editing the splits render, target the pace text span with `querySelector('.split-pace-group > .split-pace')`. Broad `.split-pace-group span` selectors match the colored `.split-dot` first and will visually duplicate pace text into the dot. This bug shipped once (2026-04-18) — do not reintroduce.
- **Gotcha 2:** The template literal in `renderSplits` that builds `.split-details` references `allBullets.length`, not `bullets.length`. Getting this wrong throws a ReferenceError that blocks `applyPlan()` from ever reaching `renderReminders()` — so BOTH splits and reminders vanish. Shipped once (2026-04-19) — do not reintroduce.
- **Gotcha 3:** When a fixed-position sheet has a visual offset (`bottom: Xvh` or `bottom: Xpx`), the close-state transform MUST clear that offset explicitly: `transform: translateY(calc(100% + Xpx))` (or vh equivalent). A bare `translate(..., 100%)` only moves the sheet down by its own height, leaving an X-sized strip of the sheet's top header peeking above the viewport bottom edge. Shipped once on `.map-sheet` desktop variant (2026-04-25, 4vh offset peek) — do not reintroduce. `.ops-sheet` and `.map-sheet` desktop both correct now; reference them when adding new sheets.
- **Gotcha 4:** `ROUTE` mile values are real GPS cumulative-distance fractions (e.g., `mile: 0.38` between waypoint 1 and 2), not assumed integers. `pointAtMile(13.1)` linearly interpolates between the two waypoints whose mile values bracket 13.1. Don't replace ROUTE with integer-mile waypoints — that breaks all sub-mile landmark positions (HALF, LAST 5K, finish). Source GPX + projection script live at `workspace/audit/okc-marathon-2026.gpx` + `workspace/audit/gpx-to-route.mjs` for repeatability.
- **Gotcha 5:** Multiple pill bars share the `.pill-tab` class. Plan-tab JS (`positionPillIndicator`, plan-switch click listener, active-state class toggle) MUST be scoped to `.pill-tabs-plan .pill-tab` — NOT a global `.pill-tab` selector. The Analytics sub-tab bar (`.analytics-tabs .pill-tab`, Training / Pace Plan / Results) reuses the same markup but has its own scoped indicator measured inside `initAnalytics`. The earlier `.pill-tabs-nav` (Results / Ops) was retired in the 2026-04-27 rebuild — a global `.pill-tab` selector would still cross-contaminate the analytics bar today. Each pill bar gets its own scoped query.

- **Gotcha 6:** The action FAB `+` button at bottom-right is the canonical launcher for Operations / Course Map / Analytics. The MapSheet, OpsSheet, and AnalyticsSheet modules each register `{ open, close }` on a top-level `Sheets` registry; the action menu routes clicks via `data-target` into `Sheets[target].open()`. Don't add new buttons that bypass the registry — and if you add a new sheet, register it on `Sheets` and add a labeled menu item rather than placing a separate FAB.

- **Print:** Pace Plan sub-tab has a print button that mirrors the rendered markup into a body-level `#print-paceplan-host`, toggles `body.printing-paceplan`, fires `window.print()`, and clears the class on `afterprint`. The print rule hides every body child except the host so the output is the plan with no chrome. Don't add new print buttons that fight this rule — re-use the host pattern.

## Race archive

- Post-race data lives in the `race_archives` table with composite PK `(race_slug, runner_slug)`. Christina's row is `okc-2026 / christina`. Fast-list columns (`race_name`, `race_date`, `runner_name`, `headline_time`) plus a JSONB `data` blob that holds everything the Analytics sheet renders (runner profile, race meta, result + placement + halves, pre-race plan, official splits, segments, segment observations, phases, course intel, conditions, training summary + translation, crew log, predictions, communications, provenance).
- Read path: `lib/race-archive.ts` → `api/results.ts` (Edge, public, 60s cache + stale-while-revalidate) → `RaceArchive` module in `index.html` (`fetchOnce` caches the promise, `renderTrainingPanel` + `renderResultsPanel` write into the Analytics sheet's Training and Results sub-tabs respectively). One network round-trip serves both sub-tabs.
- Schema migration: `node scripts/migrate-race-archive.mjs` (idempotent, `create table if not exists`). Re-seed Christina via `node scripts/seed-christina-race.mjs` (upserts).
- Future races become **new rows**, not new tables — the JSONB shape carries everything. When the race-builder UI gets built, specific concepts (plans, checkpoints) will be normalized out of the blob into proper tables; JSONB makes that one-way migration trivial. Don't pre-normalize without the UI demand.
- All seed copy goes through the no-em-dash sweep before insert (Dalton's #1 "AI wrote this" tell). En-dash ranges convert to `to` / hyphen; em-dash appositives become commas / colons.

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
