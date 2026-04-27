# Christina OKC Pacing — File Index

One-file static web app + three Edge serverless functions (`coach`, `plan`, `results`) + Neon persistence. Keep this file current when anything structural changes.

## Files

| Path                               | What it is                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                       | Entire UI. Inline `<style>` tokens + components, inline `<script>` with data, render, coach wiring, RaceMap module, MapSheet module, Results renderer, Ops sheet                                        |
| `api/coach.ts`                     | Vercel Edge function. POST `{ messages, context }` → Claude Haiku 4.5 with tool use → `{ content, changes }`                                                                                            |
| `api/plan.ts`                      | GET overlay + recent changes. POST `{ action: 'revert', changeId }` to undo.                                                                                                                            |
| `api/results.ts`                   | GET `/api/results?race=okc-2026&runner=christina` (defaults to that pair). Returns the full race archive row from `race_archives`. Public, 60s cache.                                                   |
| `lib/db.ts`                        | Neon HTTP client. `Overlay` type + `getOverlay`, `saveOverlay`, `appendChange`, `listChanges`, `markReverted`, `getChange`.                                                                             |
| `lib/race-archive.ts`              | Read-only access to `race_archives`. `getArchive(raceSlug, runnerSlug)` returns the row or null. Edge-runtime compatible.                                                                               |
| `lib/tools.ts`                     | Tool defs + handlers. 9 tools: `set_mile_pace`, `add_mile_bullet`, `remove_mile_bullet`, `update_forecast`, `add_reminder`, `add_fuel_point`, `remove_fuel_point`, `set_fuel_schedule`, `revert_change` |
| `scripts/migrate.mjs`              | One-shot migration for `plan_edits` + `plan_changes` tables                                                                                                                                             |
| `scripts/migrate-race-archive.mjs` | One-shot migration for `race_archives` table (race_slug + runner_slug primary key, JSONB blob)                                                                                                          |
| `scripts/seed-christina-race.mjs`  | Seeds Christina's full post-race archive (master-data) into `race_archives` as `okc-2026/christina`. Re-runnable; upserts.                                                                              |
| `package.json`                     | Runtime: `@anthropic-ai/sdk`, `@neondatabase/serverless`. Dev: `@types/node` (Edge `process.env` typecheck).                                                                                            |
| `.env.local`                       | `ANTHROPIC_API_KEY`, `DATABASE_URL` — gitignored, local dev only                                                                                                                                        |
| `.gitignore`                       | Standard (node_modules, .env\*, .vercel, .DS_Store)                                                                                                                                                     |
| `README.md`                        | One-paragraph project description                                                                                                                                                                       |
| `CLAUDE.md`                        | Instructions for Claude agents working on this repo                                                                                                                                                     |
| `INDEX.md`                         | This file — canonical structural map                                                                                                                                                                    |
| `designs/brand.md`                 | Project brand brief (Boutique-adapted)                                                                                                                                                                  |
| `docs/coach-writes-plan.md`        | Architecture doc for the coach tool-use + overlay system                                                                                                                                                |

## Feature Map

### Plans (3 variants — pill tabs)

- **Standard** — 8:48 cruise, 8:43 fight, 8:48 finish. Projects to 3:55:00.
- **Weather Adjusted** — +5 sec/mi for 64°F + 100% humidity forecast. Projects to ~4:00.
- **Effort Based** — RPE targets instead of paces. Reference clock from Standard.

### Sections (top → bottom)

1. Header — eyebrow + pulsing countdown + title + two-bar hero pill row (left: Standard / Weather / Effort plan filter; right: Results / Ops sheet launchers). Theme-toggle is the only remaining icon button in the top corner; the briefcase Ops icon was retired when the Ops pill landed.
2. Goal card — target finish (3:55:00), three KPI details, projected-finish row
3. Opportunistic banner (hidden in Effort mode)
4. Race map — interactive multi-view chart (4 tabs: Course / Pace / Water / Fuel)
5. Strategy zones — three zone cards (Cruise / Fight / Finish)
6. Mile-by-mile splits — 27 rows (miles 1–26 + 0.2 finish). Expands to show 3 bullets + pace editor.
7. Reminders — contextual per plan (hydration, fight, fueling, weather, focus)
8. Footer — signature line

### Floating UI

- **Map FAB** (icon-only, bottom-right, above coach FAB) — opens the Course Map sheet. The route is real OKC 2026 course geometry (80 waypoints from the official Garmin GPX, cos-lat-corrected equirectangular projection into a 400×640 viewBox). Layer toggles (Zones · Miles · Water · Fuel · Landmarks) all interpolate against real cumulative-distance fractions via `pointAtMile()`. Race-day pulse marker on current mile. Header includes an "Open official tracker ↗" link to `track.rtrt.me/map/OKC-MARATHON-2026` as a one-tap escape hatch to ground truth.
- **Coach FAB** (pill, bottom-right) — opens the AI coach bottom sheet with starter prompts + chat input.
- **Ops sheet** (right hero pill, "Ops") — Crew Punch List. Floating card with side gutters + all-corners rounded (matches goal-card shape vocabulary), top edge halfway over the hero so a long swath of the punch list is visible at once.
- **Results sheet** (right hero pill, "Results") — Post-race archive. Lazy-fetches `/api/results` on first open, then renders 10 sections: headline time + badges, placement triptych, halves comparison, 5K-segment bar chart (peak + fade-onset called out via `is-peak` / `is-fade-onset` classes), official splits list with cumulative-elapsed bars, three-phase narrative, real-time predictions log with the 30K bet card, crew checkpoints with success / missed / partial outcome badges, 12-week training summary with signal → manifestation translation, provenance footer. Same floating-card shape as the Ops sheet (frame CSS is shared via stacked selectors `.ops-sheet, .results-sheet { ... }`).
- **Toast stack** (bottom-right, above FABs) — coach change confirmations with 8-second Undo.
- **Changes drawer** (section-tool button in splits header, visible only when changes exist) — full audit log.

### Race map chart (inline, 4 views)

- **Course** — Elevation curve (Fritsch-Carlson monotone cubic) with zone bands, Y-axis ft labels, gridlines, water-drop station markers below the plot.
- **Pace** — Zone-colored target-pace segments (cruise blue / fight red / finish green), Y-axis M:SS labels, tooltip shows cumulative clock.
- **Water** — Handheld band (miles 1–10) + all stations as water-drops, sized planned > emergency.
- **Fuel** — Amber gel markers (dashed = default schedule, solid filled = coach-adjusted, hollow outlined = coach-custom points), with mile labels above.

All views share: cursor-tracking tooltip with arrow (smart edge-flip), zone bands, mile axis, landmark labels, optional race-day "now" marker (amber vertical + dot).

### Coach tools (via Anthropic tool use)

| Tool                 | Effect                                                          |
| -------------------- | --------------------------------------------------------------- |
| `set_mile_pace`      | Override pace for one mile (3:00–20:00). Validates M:SS format. |
| `add_mile_bullet`    | Append a ≤140-char note to a mile's expandable card.            |
| `remove_mile_bullet` | Remove a coach bullet by id.                                    |
| `update_forecast`    | Replace the weather reminder body (≤320 chars).                 |
| `add_reminder`       | Pin a new card to the bottom Reminders stack.                   |
| `add_fuel_point`     | Add a fuel mile to the schedule. Rejects duplicates.            |
| `remove_fuel_point`  | Remove a fuel mile.                                             |
| `set_fuel_schedule`  | Replace the entire fuel schedule (max 10 miles).                |
| `revert_change`      | Undo a previously applied change by id.                         |

All tools require a `reason` explaining WHY in Christina's context. Revertable tools: `set_mile_pace`, `add_mile_bullet`, `add_reminder`, `add_fuel_point`, `set_fuel_schedule`. Non-revertable: `remove_*` (no snapshot), `update_forecast` (replace-only).

### Persistent state (Neon)

`plan_edits` (single row keyed `christina`) holds the merged overlay:

```json
{
  "paceOverrides":  { "10": 523 },
  "mileBullets":    { "15": [{ "id": "b_...", "text": "..." }] },
  "forecast":       { "body": "...", "updatedAt": "..." } | null,
  "reminders":      [{ "id": "r_...", "label": "...", "body": "..." }],
  "fuelSchedule":   [5, 10, 15, 20, 24]
}
```

`plan_changes` is append-only audit log with `tool`, `args`, `reason`, `reverted_at`.

`race_archives` (PK `(race_slug, runner_slug)`) holds the full post-race archive as a JSONB blob plus a few flat columns for fast listing (`race_name`, `race_date`, `runner_name`, `headline_time`). Christina's row is `okc-2026 / christina`. New races become new rows; the eventual race-builder UI will normalize specific concepts (plans, checkpoints) out of the JSONB blob into proper tables when we build it. Re-seed via `node scripts/seed-christina-race.mjs`.

### Local UI state

- `paceOverrides: { [mile]: paceSec }` — user edits per mile (merges with coach overrides on plan switch)
- `expandedMiles: Set<number>` — which split rows are currently expanded
- `currentPlanKey: 'standard' | 'weather' | 'effort'`
- `coachHistory: { role, content }[]`
- `persistedOverlay` — latest snapshot from `/api/plan`
- `changeLog` — last 30 changes for drawer
- `splitsCompact: boolean` — localStorage `christina_splits_compact_v1`

## Responsive Breakpoints

| Width    | Behavior                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| < 480px  | Mobile small. `.goal-details` stacks as label-left/value-right flex rows (3-column grid below this width truncates "AVG COURSE" / "WATCH TARGET" labels).                                        |
| ≥ 480px  | `.goal-details` promotes back to 3-column grid (Avg course / Avg GPS / Watch target).                                                                                                            |
| < 640px  | Mobile. Container max-width 580px. Hero ~45vh. Coach FAB circular 52px. Map FAB 44px.                                                                                                            |
| ≥ 640px  | Tablet small. Inline mile notes appear next to pace in splits rows. Coach FAB becomes pill with "Ask Coach" label. Map FAB 48px.                                                                 |
| ≥ 720px  | Ops sheet + map sheet center at max-width 680/760px with rounded corners on all sides (floating panel). Map-sheet close-transform must include `+ 4vh` to clear the `bottom: 4vh` visual offset. |
| ≥ 768px  | Tablet portrait — added in the structural rewrite. Container max-width 680px, padding 32px. Race-map canvas 300px tall. Hero ~60vh.                                                              |
| ≥ 1024px | Desktop. Container max-width 760px, padding 32px. Section rhythm widens. Chart canvas 270px tall. Hero ~70vh.                                                                                    |
| ≥ 1280px | Wide desktop. Max-width 840px, padding 36px.                                                                                                                                                     |

## Known Invariants

- The splits list renders all 27 rows (miles 1–26 + 0.2 finish, `.split.finish-row`), but the **collapsed state** filters via CSS to only the 7 key checkpoints (miles 1, 5, 10, 15, 20, 24, 26.2 — `.split-key` class). Race day (`currentMile !== null`) auto-expands so the current row is never hidden by the filter.
- Plan switch wipes local `paceOverrides` (keeps persisted coach overrides) and collapses all expanded rows.
- `refreshSplitsAfterEdit()` updates in place without destroying DOM. `renderSplits()` destroys and rebuilds. Only use the latter on plan change or `resetAll()`.
- RaceMap `updateDims()` re-measures container per render; `viewBox` always matches container pixel size so text never distorts.
- MapSheet uses fixed `viewBox 0 0 400 640` with `preserveAspectRatio="xMidYMid meet"`. ROUTE waypoints are real GPS coordinates projected into that viewBox — see `gpx-to-route.mjs` in `workspace/audit/` for the source projection.
- Toast auto-dismisses after 8000ms. Only revertable tools show an Undo button.
- The plan-tab JS (`positionPillIndicator`, plan-switch listener) is scoped to `.pill-tabs-plan .pill-tab`, NOT global `.pill-tab`. The right hero bar (`.pill-tabs-nav`, Results / Ops) shares the `.pill-tab` class for shared styling but is functionally a sheet launcher (active state via `aria-expanded`, no sliding indicator). A global `.pill-tab` selector would re-attach plan-switch handlers to the launcher and break both surfaces.

## Z-index scale (firm — see CSS comment block at top of `index.html` for the canonical reference)

| Tier | Selector                             | Notes                                              |
| ---: | ------------------------------------ | -------------------------------------------------- |
|    1 | `.container`                         | Page content baseline                              |
|   40 | `.map-fab`                           | Bottom-right course-map FAB                        |
|   41 | `.coach-fab`                         | Above map FAB; coach wins coplanar tap conflicts   |
|   50 | `.map-backdrop`, `.coach-backdrop`   | Dim layer behind respective sheets                 |
|   60 | `.map-sheet`, `.coach-sheet`         | Bottom sheets                                      |
|   70 | `.ops-backdrop`, `.results-backdrop` | Privileged: ops + results can layer over coach/map |
|   80 | `.ops-sheet`, `.results-sheet`       | Privileged: hero-launched sheets always on top     |
|   90 | `.ops-toast`                         | Confirmations (top of everything)                  |

## Endpoints

| Method + Path      | What                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`            | Static HTML page                                                                                                                                                                                                                        |
| `GET /api/plan`    | Public read. Returns `{ overlay, changes }` (last 30 changes, newest first).                                                                                                                                                            |
| `POST /api/plan`   | Body `{ action: "revert", changeId }` — reverts a change. Only revertable tools. Updates overlay + appends `revert_change` audit row. Returns `{ ok, overlay, changes }`.                                                               |
| `POST /api/coach`  | AI coach with tool use. Body `{ messages, context }`. Returns `{ content, changes }` where `changes` contains each successfully applied tool call.                                                                                      |
| `GET /api/results` | Public read of `race_archives`. Query: `race=okc-2026&runner=christina` (defaults to that pair). Returns `{ raceSlug, runnerSlug, raceName, raceDate, runnerName, headlineTime, data, updatedAt }`. 60s cache + stale-while-revalidate. |
