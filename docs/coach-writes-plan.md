# Plan: Coach-writable plan overlay

**Status:** shipped · last updated 2026-04-19 (fuel tools + course map sheet)
**Scope:** turn the coach from read-only advisor into a co-pilot that can adjust Christina's plan via tool use. Cross-device sync via Neon Postgres.

---

## Goals

1. Christina can chat with Coach and watch her plan update in real time (mile paces, per-mile bullets, forecast line, reminders).
2. Every change is attributable — logged with a reason and the message that triggered it.
3. Every change is reversible with a single tap within an 8-second toast window, or from the Changes drawer any time.
4. Changes sync across her devices (phone, iPad, laptop).
5. Coach never silently overhauls the plan — structural changes (finish target, zone bounds) are out of scope for V1.

## Non-goals (V1)

- Multi-user accounts. One row, hardcoded `id = 'christina'`.
- Fine-grained permissions. Coach is the only writer; no client-callable mutate endpoint.
- Historical plan snapshots beyond the append-only `plan_changes` audit log.
- Real-time multi-device push. Plan is re-fetched on page focus / after coach response.

---

## Architecture

### Data model (Neon Postgres)

```sql
create table if not exists plan_edits (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists plan_changes (
  id          bigserial primary key,
  edit_id     text not null,
  tool        text not null,
  args        jsonb not null,
  reason      text,
  reverted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists plan_changes_edit_id_created_at_idx
  on plan_changes (edit_id, created_at desc);
```

`plan_edits.data` shape:

```json
{
  "paceOverrides":  { "10": 523 },
  "mileBullets":    { "15": [{ "id": "ch_...", "text": "Fog at start" }] },
  "forecast":       { "body": "...", "updatedAt": "2026-04-19T..." } | null,
  "reminders":      [{ "id": "r_...", "label": "...", "body": "..." }],
  "fuelSchedule":   [5, 10, 15, 20, 24]
}
```

### Endpoints

| Method · Path     | Auth               | Purpose                                                                                     |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `GET /api/plan`   | none (public read) | Return the current `plan_edits.data` + last 20 changes                                      |
| `POST /api/coach` | none               | Runs the coach. On tool calls, executes server-side mutations + returns them in `changes[]` |

### Coach tool-use loop

1. Client sends `{ messages, context }` to `/api/coach`
2. Server calls Anthropic with `tools: [...]` + system prompt
3. If response has `stop_reason: 'tool_use'`:
   a. Execute each `tool_use` against the DB in a single transaction
   b. Call Anthropic again with `tool_result` blocks included
   c. Stop condition: `stop_reason !== 'tool_use'` OR max 3 iterations (guard rail)
4. Return `{ content, changes: [...applied] }` to client

### Tool whitelist

| Tool                 | Args                                                           | Effect                                                                                        |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `set_mile_pace`      | `mile: int`, `paceMMSS: string`, `reason: string`              | Sets `paceOverrides[mile]` to parsed seconds. Validates 3:00–20:00 range.                     |
| `add_mile_bullet`    | `mile: number`, `text: string` (≤140), `reason: string`        | Appends a bullet to `mileBullets[mile]` with a fresh id.                                      |
| `remove_mile_bullet` | `mile: number`, `bulletId: string`, `reason: string`           | Removes the matching bullet.                                                                  |
| `update_forecast`    | `body: string` (≤320), `reason: string`                        | Replaces `forecast.body`.                                                                     |
| `add_reminder`       | `label: string` (≤48), `body: string` (≤320), `reason: string` | Appends a reminder with a fresh id.                                                           |
| `add_fuel_point`     | `mile: number`, `reason: string`                               | Adds a mile to `fuelSchedule`. Rejects duplicates within 0.05 mi.                             |
| `remove_fuel_point`  | `mile: number`, `reason: string`                               | Removes a mile from `fuelSchedule`.                                                           |
| `set_fuel_schedule`  | `miles: number[]` (max 10), `reason: string`                   | Replaces `fuelSchedule`. Stores `prior` in args so revert restores it.                        |
| `revert_change`      | `changeId: int`, `reason: string`                              | Marks a change `reverted_at = now()` and reverses it in `data` when the tool supports revert. |

All tools return `{ ok: true, applied: {...} }` or `{ ok: false, error: "..." }`.

**Revertable:** `set_mile_pace`, `add_mile_bullet`, `add_reminder`, `add_fuel_point`, `set_fuel_schedule` (via stored `prior`).
**Not revertable:** `remove_mile_bullet` (no snapshot), `update_forecast` (replace-only), `remove_fuel_point` (no snapshot — use `add_fuel_point` to restore).

### Client changes

- On load: `fetch('/api/plan')` → merge overlay into render
- After `/api/coach` response: apply returned `changes[]`, show toast per change with 8s undo, refresh projected finish
- **Changes drawer:** button in the splits section header opens a bottom-sheet listing all changes with timestamps, reasons, and a per-row "Undo" button
- Re-fetch `/api/plan` on `visibilitychange` (returning to tab) to catch cross-device edits

### Guardrails (system prompt addendum)

> You now have tools to modify Christina's plan. Use them sparingly and only when the conversation has earned a change — not reflexively. Never edit the finish target, the zone bounds, or the water-stop schedule (out of scope). Before setting a pace override, confirm the mile and pace with her in the same message. `add_mile_bullet` is the most common tool — prefer appending a note over editing existing ones. Every tool call requires a `reason` that restates why in Christina's context (not "user requested X"). If unsure, ask a clarifying question instead of calling a tool.

### Security

- No auth on `/api/plan` read — acceptable because the URL isn't published
- No client-callable write endpoint — only the coach can mutate, and coach is rate-limited by Anthropic quota
- In the extremely unlikely case of griefing, add a shared-secret header or switch to per-device localStorage fallback

---

## Implementation order

1. **Migration** — run the `plan_edits` + `plan_changes` schema via a one-shot script
2. **DB helpers** — small `lib/db.ts` with get/set overlay + append change
3. **`/api/plan` GET endpoint**
4. **Tool handlers** — one function per tool in `lib/tools.ts` with Zod-ish validation
5. **`/api/coach` refactor** — add tools, tool-use loop, return changes
6. **Client** — fetch + apply overlay on load, toast system, changes drawer, re-fetch on focus
7. **Deploy + verify** — run a real mutating conversation, confirm persistence across refresh

---

## Risks + mitigations

| Risk                                               | Mitigation                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Coach over-eagerly mutates                         | System prompt discipline + whitelist-only tools + confirmation expectation in prompt            |
| Tool-use latency stacks (2+ Anthropic round trips) | Model stays Haiku 4.5 for speed; max 3 iterations cap                                           |
| Invalid data corrupts the overlay                  | Zod-style validators in each tool handler; reject on fail                                       |
| Neon cold start on race day                        | Keep the DB warm with a scheduled ping? Or accept 1s first-req latency                          |
| Two devices edit simultaneously                    | Last-write-wins on `plan_edits.data`; `plan_changes` log is append-only so history is preserved |
