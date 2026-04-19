# Christina OKC Pacing — File Index

One-file static web app + one Edge serverless function. Keep this file current when anything structural changes.

## Files

| Path               | What it is                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `index.html`       | The entire UI — inline `<style>` tokens + components, inline `<script>` data + render + coach wiring |
| `api/coach.ts`     | Vercel Edge function. POST `{ messages, context }` → Claude Haiku 4.5 → `{ content }`                |
| `package.json`     | Runtime deps: `@anthropic-ai/sdk`. Dev: `@types/node` (Edge `process.env` typecheck)                 |
| `.env.local`       | `ANTHROPIC_API_KEY` — gitignored, local dev only                                                     |
| `.gitignore`       | Standard (node_modules, .env\*, .vercel, .DS_Store)                                                  |
| `README.md`        | One-paragraph project description                                                                    |
| `CLAUDE.md`        | Instructions for Claude agents working on this repo                                                  |
| `INDEX.md`         | This file — canonical structural map                                                                 |
| `designs/brand.md` | Project brand brief (Boutique-adapted)                                                               |

## Feature Map

### Plans (3 variants — pill tabs)

- **Standard** — 8:48 cruise, 8:43 fight, 8:48 finish. Projects to 3:55:00.
- **Weather Adjusted** — +5 sec/mi for 64°F + 100% humidity forecast. Projects to ~4:00.
- **Effort Based** — RPE targets instead of paces. Reference clock from Standard.

### Sections (top → bottom)

1. Header — eyebrow + pulsing countdown + title + plan pill tabs
2. Goal card — target finish (3:55:00), three KPI details, projected-finish row
3. Opportunistic banner (hidden in Effort mode)
4. Race timeline — SVG elevation profile + zone bands + landmarks + water-stop markers
5. Strategy zones — three zone cards (Cruise / Fight / Finish)
6. Mile-by-mile splits — 27 rows (miles 1–26 + 0.2 finish). Per-row: mile, water, elev arrow, pace-dot + pace, cumulative, chevron. Expands to show 3 bullets + pace editor.
7. Reminders — contextual per plan (hydration, fight, fueling, weather, focus)
8. Footer — signature line

### AI Coach (fixed pill, bottom-right)

- Tapping opens a bottom-sheet drawer with starter prompts + text input
- Posts `{ messages: history, context: { plan, overrides, expandedMiles } }` to `/api/coach`
- Streams are NOT used; single response with typing indicator during fetch

### State

- `paceOverrides: { [mile]: paceSec }` — user edits per mile
- `expandedMiles: Set<number>` — which rows are expanded
- `currentPlanKey: 'standard' | 'weather' | 'effort'`
- `coachHistory: { role, content }[]`

## Responsive Breakpoints

| Width    | Behavior                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| < 640px  | Mobile. Container 100% - 40px padding. Coach FAB is a circular 52px button.                                                           |
| ≥ 640px  | Tablet. Container padding grows; inline mile notes appear next to pace in splits rows; Coach FAB becomes pill with "Ask Coach" label. |
| ≥ 1024px | Desktop. Container max-width 760px, padding 32px. Section rhythm widens.                                                              |
| ≥ 1280px | Wide desktop. Max-width 840px, padding 36px.                                                                                          |

## Known Invariants

- The splits list **always** renders 27 rows — even the 0.2 finish segment has its own row (`.split.finish-row`).
- Plan switch wipes `paceOverrides` and collapses all expanded rows. That's intentional — a new plan = fresh baseline.
- `refreshSplitsAfterEdit()` updates in place without destroying DOM. `renderSplits()` destroys and rebuilds. Only use the latter on plan change or `resetAll()`.

## Endpoints

| Method + Path     | What                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`           | Static HTML page                                                                                                                            |
| `POST /api/coach` | AI coach. Body: `{ messages: [{role, content}], context: { planLabel, overrides } }`. Returns `{ content: string }` or `{ error: string }`. |
