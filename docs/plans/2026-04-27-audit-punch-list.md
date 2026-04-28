# Audit Punch-List Implementation Plan

> **STATUS:** ✅ Complete — all 9 tasks shipped 2026-04-27 → 2026-04-28 across 10 commits (`adeb3af..ff77e40`). Live on `christina-okc-pacing.vercel.app`. Per-task commits + review verdicts in the post-run handoff. The unchecked `- [ ]` boxes below are historical record of the per-task TDD steps; do not re-execute.

> **For agentic workers (historical):** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the actionable items from the 2026-04-27 audit punch-list — content polish (em-dash sweep), correctness (coach loop iter-3 truncation, prompt caching), and a focused defensive-guards pass on the race-archive renderers.

**Architecture:** Surgical edits in three surfaces — `index.html` (text sweep + pill-tab parity + renderer guards + a11y), `api/coach.ts` (loop fix + caching + module-scope client + error taxonomy + key validation), and `lib/tools.ts` (bullet/mile range alignment). No new files, no schema changes, no new dependencies.

**Tech Stack:** Vanilla HTML/CSS/JS in `index.html` (no build step), TypeScript Edge functions on Vercel, Anthropic SDK, Neon serverless Postgres.

**Verified-false from the audit:** the P1 race-name claim. Both `scripts/seed-christina-race.mjs:27` and `:43` already read `'2026 Oklahoma City Memorial Marathon'` — no inconsistency exists. Skipped.

**Deferred per audit recommendation:** P3 pill-tab consolidation factory (do it the next time a pill bar gets touched, not standalone), P3 concurrent overlay-write race (single-user app, won't fire).

**Out of scope:** the two `[needs-confirm]` factual claims in the seed narrative — those are gated on Dalton's review against Garmin / archive timing, captured as the final task.

---

## File Structure

| File | Change kind | Responsibility |
| --- | --- | --- |
| `index.html` | Text + ~40 lines of JS | User-visible em-dash/en-dash conversion · hero pill-tab indicator parity · race-archive renderer optional chaining · sheet a11y focus restore |
| `api/coach.ts` | Structural edits | Iter-3 truncation handling · prompt caching via `cache_control` · module-scope SDK client · error taxonomy (429/5xx) · top-of-handler key validation |
| `lib/tools.ts` | Validator + description tweaks | Bullet maxLength alignment to 120 · `add_mile_bullet` mile range to ≤26 (matches set_mile_pace) |

Each task ships its own commit. All changes auto-deploy to production via the Vercel git integration on push to `main` (per `CLAUDE.md`); do **not** run `vercel --prod` manually.

---

## Task 1: Em-dash + en-dash sweep in user-facing strings (`index.html`)

**Why:** The seed copy went through Dalton's no-em-dash sweep before insert, but `index.html`'s inline UI strings missed it. Em-dashes are Dalton's #1 "AI wrote this" tell, and the static UI is the most visible surface in the app.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/index.html`

**Conversion rules (apply consistently):**

| Source | Target | Example |
| --- | --- | --- |
| ` — ` separating clauses for emphasis | `, ` (comma) or `. ` (period) — read the sentence | `aggressive on purpose — aim high` → `aggressive on purpose; aim high` or `aggressive on purpose. Aim high.` |
| ` — ` separating two short ideas | `. ` | `Opportunistic — take what the terrain gives.` → `Opportunistic. Take what the terrain gives.` |
| ` — ` parenthetical | `, ` ... `, ` (commas) or `(` ... `)` | `Same effort as Standard — heat just costs time per mile.` → `Same effort as Standard; heat just costs time per mile.` |
| `–` between numbers | `-` (hyphen) | `30–45 min` → `30-45 min`, `1–10` → `1-10` |
| `–` between mile ranges in zone titles | `-` (hyphen) | `Miles 1–19` → `Miles 1-19` |

**Do NOT change:**
- The middle-dot bullet separator `·` — that's intentional Boutique-system rhythm.
- The em-dash literal in `<span class="projected-value" id="projected-finish">—</span>` (line 3798) — that's a placeholder glyph filled in at render time, not prose.
- Em-dashes inside `<style>` blocks (none expected, but spot-check).
- Em-dashes inside JS comments (treat them as out of scope; they aren't user-visible).

- [ ] **Step 1: Inventory the targets**

Run:

```bash
grep -nE ' — | – | [0-9]+–[0-9]+| \d+–\d+ ' "C:/Users/Owner/workspace/christina-okc-pacing/index.html" | head -200
```

Expected: ~30+ hits across mile notes (lines 4642–4900 range), plan-zone subtitles (4575–4625 range), reminders (4540–4555 range), banner (3802), ops-sheet prose (4043, 4121, 4125, 4204, 4226, 4299, 4364, 4367 range), pace-plan checkpoint meta (4960), changes-empty (6692), coach starter prompts (4479).

- [ ] **Step 2: Convert the high-confidence emphasis em-dashes (` — ` between two complete clauses)**

Walk the inventory in line-number order. For each match in a user-visible string, replace ` — ` with `. ` and capitalize the first letter of the new sentence — UNLESS the second half is a sub-clause / continuation, in which case use `, ` or `; `. Read each sentence before deciding.

Concrete edits (run each as a separate `Edit` call to keep the diff reviewable):

```
3802  "Opportunistic — take what the terrain gives."
   →  "Opportunistic. Take what the terrain gives."

4043  "Track Christina (bib #648) + add Beth. Real-time course position. Download before tomorrow."
   (no em-dash — leave as-is; the audit cited the `+` glyph)

4121  "Extra gel, extra salt — she grabs ONLY if she says she needs it."
   →  "Extra gel, extra salt. She grabs ONLY if she says she needs it."

4125  "Positioning. Course passes through W Wilshire Blvd area around mile 11. Stand on her side of the road near the Rebuilding Together building for a clear landmark. Be set up early — she grabs and goes."
   →  "...landmark. Be set up early; she grabs and goes."

4540  "Handheld covers miles 1–10. 12 planned stops from mile 11 onward add ~10 sec each — already built into the clock. If it's hot or a station is crowded, grab earlier — 20+ are available."
   →  "Handheld covers miles 1-10. 12 planned stops from mile 11 onward add ~10 sec each, already built into the clock. If it's hot or a station is crowded, grab earlier; 20+ are available."

4544  "Miles 20–24 are where legs get loud. The target is aggressive on purpose — aim high, let fatigue pull you toward average. Don't give it all back."
   →  "Miles 20-24 are where legs get loud. The target is aggressive on purpose; aim high, let fatigue pull you toward average. Don't give it all back."

4548  "Gel or equivalent every 30–45 min per your training routine — roughly miles 5, 10, 15, 20, 24 at race pace. Take them running; no need to stop."
   →  "Gel or equivalent every 30-45 min per your training routine, roughly miles 5, 10, 15, 20, 24 at race pace. Take them running; no need to stop."

4552  "Forecast: 64°F, 100% humidity at start, N wind 8 mph with gusts to 22 mph. Warmer than ideal — Jeff's 3:55 assumes ~55°F."
   →  "Forecast: 64°F, 100% humidity at start, N wind 8 mph with gusts to 22 mph. Warmer than ideal; Jeff's 3:55 assumes ~55°F."

4576  "Miles 1–19 · Cruise" / "Hold 8:48 between stations. Handheld through mile 10."
   →  "Miles 1-19 · Cruise" (en-dash → hyphen in title)

4577  "Miles 20–24 · Fight" / "Aim for 8:43. Target is aggressive on purpose — fatigue will pull you toward average."
   →  "Miles 20-24 · Fight" / "Aim for 8:43. Target is aggressive on purpose; fatigue will pull you toward average."

4578  "Miles 25–26.2 · Finish"
   →  "Miles 25-26.2 · Finish"

4582  "Through mile 24. Watch <strong>current pace</strong>, not average. Opportunistic — take what the terrain gives."
   →  "Through mile 24. Watch <strong>current pace</strong>, not average. Opportunistic. Take what the terrain gives."

4597  "Adjusted +5 sec/mi for 64°F, 100% humidity forecast. Target is <strong>8:53 in Cruise, 8:48 in Fight</strong>. Same effort as Standard — heat just costs time per mile. Better to finish honest than blow up at mile 18."
   →  "...Same effort as Standard; heat just costs time per mile. Better to finish honest than blow up at mile 18."

4599  "Miles 1–19 · Cruise" → "Miles 1-19 · Cruise"
4600  "Miles 20–24 · Fight" → "Miles 20-24 · Fight"
4601  "Miles 25–26.2 · Finish" → "Miles 25-26.2 · Finish"

4620  "Ignore the clock — run by feel. Checkpoints below come from the Standard plan as a reference, not a target. Your body knows what sustainable marathon effort is. Trust it."
   →  "Ignore the clock; run by feel. Checkpoints..."

4622  "Miles 1–19 · Cruise" → "Miles 1-19 · Cruise"
4623  "Miles 20–24 · Fight" → "Miles 20-24 · Fight"
4624  "Miles 25–26.2 · Finish" → "Miles 25-26.2 · Finish"

4645  "Let the first mile be 5 sec slow — don't fight the pack"
   →  "Let the first mile be 5 sec slow; don't fight the pack"

4655  "Short climb — hold effort, 1–2 sec drift is fine"
   →  "Short climb. Hold effort, 1-2 sec drift is fine"

4660  "Fresh legs territory — resist the urge to push harder"
   →  "Fresh legs territory. Resist the urge to push harder"

4670  "Hold effort not pace · 3–5 sec drift is expected"
   →  "Hold effort not pace · 3-5 sec drift is expected"

(... continue through mile-detail block, lines 4642–4900, applying the same pattern)

4960  "<strong>${cp.title}</strong> — ${cp.line}"
   →  "<strong>${cp.title}</strong>: ${cp.line}"

6692  "Ask Coach about your plan — adjustments land here with a full audit trail."
   →  "Ask Coach about your plan; adjustments land here with a full audit trail."
```

Use the `Edit` tool one replacement at a time. Each edit's `old_string` should include enough surrounding context to be unique. Do NOT use `replace_all` — every em-dash needs an individual judgment call.

- [ ] **Step 3: Sweep the remaining MILE_DETAILS bullets**

The MILE_DETAILS object spans roughly lines 4642 through ~4900 (26 entries × 3 bullets each). Walk it sequentially. Most em-dashes there are emphasis-separators of the form `"action — qualifier"`. Default conversion is `. ` with capitalization of the qualifier, OR `; ` if the qualifier is a continuation. En-dash mile ranges (`mile 1–10`, `1–2 sec`, etc.) all become hyphens.

Don't convert in batch — read each bullet before editing.

- [ ] **Step 4: Verify zero em-dashes remain in user-visible strings**

Run:

```bash
grep -nE ' — ' "C:/Users/Owner/workspace/christina-okc-pacing/index.html"
```

Expected: zero matches in HTML body content / template-literal strings. If matches remain inside `// JS comments` or `/* CSS comments */`, those are out of scope — leave them.

```bash
grep -nE '[0-9]–[0-9]' "C:/Users/Owner/workspace/christina-okc-pacing/index.html"
```

Expected: zero matches. Every numeric en-dash should now be a hyphen.

- [ ] **Step 5: Visual smoke test on local file**

Open `index.html` directly in a browser (file:// is fine — no API calls needed for a text check). Walk: hero banner → plan tabs → reminders → expand a few mile cards → Pace Plan sub-tab → Changes drawer empty state. No em-dashes visible.

- [ ] **Step 6: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
chore(copy): em-dash + en-dash sweep across user-facing strings

Removes the #1 "AI wrote this" tell across mile notes, plan-zone
subtitles, reminders, ops-sheet prose, banner, pace-plan checkpoints,
and changes-empty state. Em-dashes become periods/commas/semicolons
based on sentence flow; numeric en-dashes become hyphens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

Vercel auto-deploys within ~30–45s. No manual action required.

---

## Task 2: Hero pill-tab indicator → `offsetLeft` parity with analytics

**Why:** Hero plan-bar uses `getBoundingClientRect()` (line 6482); analytics sub-tab bar uses `offsetLeft - 4` (line 7450). Both produce correct results today because the hero bar isn't inside an animated container, but the inconsistency will bite the next time the hero gets reorganized — `getBoundingClientRect` returns mid-transition values when measured during a transform animation, while `offsetLeft` is layout-static. Bring the hero into parity now while it's cheap.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/index.html:6475-6487`

- [ ] **Step 1: Replace the hero pill indicator implementation**

Edit `positionPillIndicator` (lines 6475–6487):

```js
  function positionPillIndicator() {
    const indicator = document.getElementById('pill-indicator');
    // Scoped to the plan-filter bar — the nav bar has no indicator
    // and shouldn't influence active-tab measurement.
    const tabs = document.querySelectorAll('.pill-tabs-plan .pill-tab');
    const activeTab = Array.from(tabs).find(t => t.classList.contains('active')) || tabs[0];
    if (!indicator || !activeTab) return;
    // Match the analytics sub-tab pattern (line ~7440): offsetLeft is
    // layout-static, so it doesn't return mid-transform values if the
    // bar's parent ever animates. Width clears to let CSS calc drive it.
    const offset = activeTab.offsetLeft - 4; // 4 = pill-tabs padding
    indicator.style.width     = `${activeTab.offsetWidth}px`;
    indicator.style.transform = `translateX(${offset}px)`;
  }
```

(The `// Scoped...` comment cleanup turns it into one-line WHY context. Keep it brief.)

- [ ] **Step 2: Open the live page and confirm the indicator still snaps to the active pill**

Open `christina-okc-pacing.vercel.app` (or the local file). Click each plan tab (Standard / Weather / Effort). The white indicator must:
- Snap cleanly to each tab's bounds
- Stay glued on viewport resize (drag the window narrower / wider)
- Not drift sub-pixel

Then open the Analytics sheet (action FAB → Analytics) and confirm the sub-tab indicator (Training / Pace Plan / Results) still works — no regression there since we didn't touch it.

- [ ] **Step 3: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): hero pill-tab indicator → offsetLeft parity with analytics

Both pill bars now use offsetLeft (layout-static) instead of mixing
getBoundingClientRect (measure-on-render). Defends against future
re-parenting that puts the hero bar inside an animated container.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 3: Coach loop — handle iter-3 truncation explicitly

**Why:** `api/coach.ts:139` runs the tool loop up to `MAX_TOOL_ITERATIONS` (3). If the model returns `stop_reason === 'tool_use'` on the final iteration, the loop exits at the for-condition check (`iter < 3` is false on iter 3), the tool_uses from that iteration are NOT executed, the user gets `finalText` from the previous iteration's text content, and there's no signal that anything was dropped. Silent data loss is a P1 bug shape even if it's rare in Christina's actual usage.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/api/coach.ts:139-202`

- [ ] **Step 1: Track the final iteration's stop_reason and surface truncation**

Edit `api/coach.ts`. After the existing loop, before `if (overlayDirty)`, add explicit truncation handling. The full updated section (replacing lines 136–202):

```ts
    let overlayDirty = false;
    let finalText = "";
    let truncated = false;

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        tools: toolDefs as any,
        messages: convo,
      });

      const toolUses = response.content.filter(
        (b: any) => b.type === "tool_use",
      );
      const texts = response.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");

      if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
        finalText = texts;
        break;
      }

      // If we're on the last allowed iteration but the model still wants
      // to call tools, we'll exit the loop without executing them. Surface
      // that to the client instead of dropping silently.
      if (iter === MAX_TOOL_ITERATIONS - 1) {
        truncated = true;
        finalText = texts;
        break;
      }

      convo.push({ role: "assistant", content: response.content as any });

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const tu of toolUses as any[]) {
        const outcome = await executeTool(tu.name, tu.input ?? {}, overlay);
        if (outcome.ok) {
          overlayDirty = true;
          changes.push({
            id: outcome.changeId,
            tool: tu.name,
            args: (tu.input ?? {}) as Record<string, unknown>,
            reason: String((tu.input as any)?.reason ?? ""),
            summary: outcome.summary,
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({
              ok: true,
              summary: outcome.summary,
              changeId: outcome.changeId,
            }),
          });
        } else {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({ ok: false, error: outcome.error }),
            is_error: true,
          });
        }
      }

      convo.push({ role: "user", content: toolResults });
      finalText = texts;
    }

    if (overlayDirty) {
      await saveOverlay(overlay);
    }

    const responseBody: {
      content: string;
      changes: typeof changes;
      truncated?: boolean;
    } = { content: finalText || "", changes };
    if (truncated) {
      responseBody.truncated = true;
      // Append a one-line nudge so the UI shows it without needing a
      // separate "truncated" affordance. Coach voice, not meta.
      responseBody.content = (
        finalText
          ? finalText + "\n\n"
          : ""
      ) + "(I made too many edits at once — ask me again with a narrower scope.)";
    }
    return json(responseBody, 200);
```

The detection moves *before* tool execution — this changes behavior subtly: previously iter-3 tool-uses would have been *attempted but not result-replied-to* (which still ran them and persisted the overlay, but left the conversation in a half-state). Now we don't attempt them at all, surface the situation in `content`, and the user can re-ask. This trades silent partial application for explicit no-op-with-message — preferable for a tool that's writing to user data.

- [ ] **Step 2: Type-check**

```bash
cd "C:/Users/Owner/workspace/christina-okc-pacing" && npx tsc --noEmit
```

Expected: clean (no new errors). If there are pre-existing errors, capture them and confirm none are in `api/coach.ts`.

- [ ] **Step 3: Smoke test against the deployed endpoint**

After push (next step), curl the deployed endpoint with a normal coach prompt to confirm we didn't break the happy path:

```bash
curl -sX POST https://christina-okc-pacing.vercel.app/api/coach \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What pace should I run mile 6?"}],"context":{"plan":"standard","planLabel":"Standard"}}' | jq
```

Expected: `{ "content": "...", "changes": [] }` — no `truncated` field on the happy path.

(Triggering the actual truncation path requires a prompt that provokes 3 tool-use turns in a row, which is hard to engineer reliably. Trust the code change here; verify via the type-check + happy-path response.)

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add api/coach.ts
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
fix(coach): surface iter-3 tool-use truncation instead of dropping silently

If the model still wants to call tools on iteration 3 of MAX_TOOL_ITERATIONS,
break before attempting them and return { truncated: true } with a
coach-voice nudge appended to content. Prevents silent partial
application of an in-progress edit chain.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 4: Coach prompt caching + module-scope SDK client

**Why:** `SYSTEM_PROMPT` (~4.5 KB inline at lines 18–81) is sent uncached on every coach call. Anthropic's `cache_control: { type: 'ephemeral' }` cuts input-token cost ~90% on repeat hits and improves p50 latency materially. Separately, `new Anthropic({...})` at line 92 instantiates per-request inside an Edge function — each cold start pays the construction cost. Lift it to module scope. These two changes pair well in one commit.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/api/coach.ts:88-145`

- [ ] **Step 1: Lift the Anthropic client to module scope**

Replace lines 9–16 (imports + config + MAX_TOOL_ITERATIONS) with:

```ts
import Anthropic from "@anthropic-ai/sdk";

import { getOverlay, saveOverlay } from "../lib/db";
import { executeTool, toolDefs } from "../lib/tools";

export const config = { runtime: "edge" };

const MAX_TOOL_ITERATIONS = 3;

// Module-scope client — Edge runtime caches module init across warm
// invocations, so per-request `new Anthropic(...)` is wasted cold-start work.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

Then delete the existing in-handler `const client = new Anthropic(...)` line (currently line 92).

- [ ] **Step 2: Restructure the system prompt for caching**

The Anthropic SDK accepts `system` as either a string or an array of content blocks. Cache control attaches to a block. The static portion (lines 18–81) goes in a cached block; the dynamic per-request additions (current page state, persisted notes, forecast override, reminders) go in a second uncached block.

Replace the system-prompt construction (currently lines 96–121, the chunk that builds `let systemPrompt = SYSTEM_PROMPT; ... systemPrompt += ...`) with:

```ts
    // Static portion — cached. The 5-min ephemeral cache TTL is plenty
    // for any single coach session; the cost saving compounds across the
    // tool-loop's repeated round-trips.
    const staticSystem: Anthropic.Messages.TextBlockParam = {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    };

    // Dynamic portion — page state, persisted overlay context. Not cached.
    let dynamicText = `CURRENT PAGE STATE:\n- Plan variant selected: ${context?.planLabel || context?.plan || "Standard"}`;
    if (context?.overrides && Object.keys(context.overrides).length > 0) {
      const edits = Object.entries(context.overrides)
        .map(([mile, paceSec]: [string, any]) => {
          const s = Number(paceSec);
          const m = Math.floor(s / 60);
          const r = Math.round(s % 60);
          return `Mile ${mile}: ${m}:${String(r).padStart(2, "0")}`;
        })
        .join(", ");
      dynamicText += `\n- Local pace edits (not yet persisted): ${edits}`;
    }

    const persistedNotes = Object.entries(overlay.mileBullets).flatMap(
      ([mile, bullets]) => bullets.map((b) => `Mile ${mile} · ${b.text}`),
    );
    if (persistedNotes.length > 0) {
      dynamicText += `\n- Previously-added bullets you (or a prior coach session) wrote:\n  · ${persistedNotes.join("\n  · ")}`;
    }
    if (overlay.forecast) {
      dynamicText += `\n- Current forecast override: ${overlay.forecast.body}`;
    }
    if (overlay.reminders.length > 0) {
      dynamicText += `\n- Custom reminders pinned: ${overlay.reminders.map((r) => r.label).join(", ")}`;
    }

    const dynamicSystem: Anthropic.Messages.TextBlockParam = {
      type: "text",
      text: dynamicText,
    };

    const systemBlocks = [staticSystem, dynamicSystem];
```

Then update the `client.messages.create({...})` call inside the loop (currently `system: systemPrompt`) to use the array:

```ts
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemBlocks,
        tools: toolDefs as any,
        messages: convo,
      });
```

- [ ] **Step 3: Type-check**

```bash
cd "C:/Users/Owner/workspace/christina-okc-pacing" && npx tsc --noEmit
```

Expected: clean. If `cache_control` errors, the SDK may need a version bump; check `package.json`'s `@anthropic-ai/sdk` is reasonably current (>= 0.40 should support ephemeral caching).

- [ ] **Step 4: Smoke test the coach endpoint twice and watch latency**

```bash
time curl -sX POST https://christina-okc-pacing.vercel.app/api/coach \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How should I handle the mile 6 climb?"}],"context":{"plan":"standard","planLabel":"Standard"}}' > /dev/null

# Run a second time within ~1 minute to hit the cache
time curl -sX POST https://christina-okc-pacing.vercel.app/api/coach \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What about the descent at mile 8?"}],"context":{"plan":"standard","planLabel":"Standard"}}' > /dev/null
```

Expected: second call's wall-clock noticeably lower than the first (the static system block is cached). Both return valid JSON.

- [ ] **Step 5: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add api/coach.ts
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
perf(coach): prompt caching + module-scope SDK client

Splits the system prompt into a cached static block (the 4.5KB plan/
hydration/forecast brief) and an uncached dynamic block (per-request
page state). Lifts new Anthropic(...) to module scope so warm Edge
invocations skip the per-request construction cost.

Saves ~90% input cost on cache hits, drops p50 latency for the tool
loop's repeated round-trips.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 5: Coach error taxonomy (429 vs 5xx) + key validation

**Why:** `api/coach.ts:203-206` collapses 429 rate-limit, 5xx upstream errors, and network failures into a single `500 + err.message` response. The UI can't distinguish "Anthropic is rate-limiting us" from "the function crashed." Separately, `process.env.ANTHROPIC_API_KEY` is referenced without a top-of-handler null check; it's currently set on Vercel but a defensive guard prevents a confusing stack trace if it ever gets unset.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/api/coach.ts:83-90, 203-206`

- [ ] **Step 1: Add the key check at handler entry**

Edit the start of `handler`:

```ts
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "Coach not configured" }, 503);
  }

  try {
    // ... existing body
```

- [ ] **Step 2: Replace the catch with a status-aware mapping**

Replace lines 203–206:

```ts
  } catch (err: any) {
    const reqId = (globalThis.crypto?.randomUUID?.() ?? String(Date.now())).slice(0, 8);
    console.error(`Coach API error [${reqId}]:`, err?.message ?? err);

    // Distinguish vendor rate-limit / outage from internal errors so the
    // UI can show "Coach is busy, try again" vs. a hard failure.
    if (err?.status === 429) {
      return json({ error: "Coach is rate-limited; try again in a minute.", reqId }, 429);
    }
    if (err?.status >= 500 && err?.status < 600) {
      return json({ error: "Coach upstream is unavailable; try again shortly.", reqId }, 503);
    }
    return json({ error: err?.message || "Internal error", reqId }, 500);
  }
}
```

The `reqId` makes server logs and client errors matchable without taking on a logging dependency.

- [ ] **Step 3: Type-check**

```bash
cd "C:/Users/Owner/workspace/christina-okc-pacing" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add api/coach.ts
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
fix(coach): distinct 429/503/500 responses + reqId for log correlation

Rate-limit and upstream-5xx errors now return their own status codes
with a coach-voice message, instead of all collapsing to 500. Adds
ANTHROPIC_API_KEY guard at handler entry so a missing key returns
503 with a clear message instead of an SDK stack trace.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 6: `lib/tools.ts` consistency — bullet maxLength and mile range

**Why:** Two small inconsistencies in `add_mile_bullet`: the description (line 39) and `description` field (line 47) say "≤120 chars" but the schema's `maxLength` (line 46) and validator (line 225) enforce 140; and the validator allows `mile <= 26.2` (line 223) while `set_mile_pace` enforces `mile <= 26` (line 196). Pace-overrides explicitly skip the 26.2 finish segment per the schema description; bullets shouldn't be allowed there either, since a finish-segment bullet renders into a row that has no pace, producing an orphan in the splits UI.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/lib/tools.ts:36-52, 219-244`

- [ ] **Step 1: Align the bullet length to 120 in description, schema, and validator**

Edit the `add_mile_bullet` tool def (lines 36–53):

```ts
  {
    name: "add_mile_bullet",
    description:
      "Append a short, specific note bullet to a mile's expandable card. Use for race-day intelligence that only Christina would find useful: crowd intel, a landmark she mentioned, a fueling reminder tied to that mile. Keep it ≤120 chars, imperative voice. Do NOT use for generic encouragement.",
    input_schema: {
      type: "object",
      properties: {
        mile: { type: "integer", minimum: 1, maximum: 26, description: "Mile number 1-26 (the 26.2 finish segment cannot carry a bullet — it has no pace row)" },
        text: {
          type: "string",
          maxLength: 120,
          description: "The bullet text, ≤120 chars. No emoji.",
        },
        reason: { type: "string" },
      },
      required: ["mile", "text", "reason"],
    },
  },
```

- [ ] **Step 2: Update the validator to match**

Edit the `case "add_mile_bullet":` block (lines 219–245):

```ts
      case "add_mile_bullet": {
        const mile = Number(rawArgs.mile);
        const text = String(rawArgs.text ?? "").trim();
        const reason = String(rawArgs.reason ?? "").trim();
        if (!Number.isInteger(mile) || mile < 1 || mile > 26)
          return { ok: false, error: "mile must be an integer 1-26" };
        if (!text || text.length > 120)
          return { ok: false, error: "text must be 1-120 chars" };
        if (!reason) return { ok: false, error: "reason is required" };
        const bullet = { id: rid("b"), text };
        const key = String(mile);
        overlay.mileBullets[key] = [
          ...(overlay.mileBullets[key] ?? []),
          bullet,
        ];
        const changeId = await appendChange(
          "add_mile_bullet",
          { mile, bullet },
          reason,
        );
        return {
          ok: true,
          changeId,
          summary: `Added note to Mile ${mile}`,
          applied: { mile, bullet },
        };
      }
```

Also update `case "remove_mile_bullet":` (lines 247–272) to match the new range:

```ts
      case "remove_mile_bullet": {
        const mile = Number(rawArgs.mile);
        const bulletId = String(rawArgs.bulletId ?? "");
        const reason = String(rawArgs.reason ?? "").trim();
        if (!Number.isInteger(mile) || mile < 1 || mile > 26)
          return { ok: false, error: "mile must be an integer 1-26" };
        if (!bulletId) return { ok: false, error: "bulletId is required" };
        // ...rest unchanged
```

- [ ] **Step 3: Type-check**

```bash
cd "C:/Users/Owner/workspace/christina-okc-pacing" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add lib/tools.ts
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
fix(tools): align bullet maxLength + mile range across description/schema/validator

Bullet length is 120 everywhere (was 120 in description, 140 in
schema/validator). Mile range for add/remove_mile_bullet is now 1-26
to match set_mile_pace and avoid orphan bullets on the 26.2 finish
segment row.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 7: Race-archive renderer guards — optional chaining for nested fields

**Why:** `renderPlacement` (`index.html:7138-7140`), `renderHalves` (`:7149-7155`), `renderPhases` (`:7223-7226`), and `renderPredictions`'s bet section (`:7252-7254`) read deeply-nested fields without guards. Christina's seed populates every path so nothing breaks today, but the moment a future race archive omits e.g. `placement.gender`, we get a TypeError that breaks the whole Results panel. Cheap defense, ships now while we're touching the file.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/index.html:7137-7264`

- [ ] **Step 1: Guard `renderPlacement` (lines 7137-7142)**

Replace:

```js
      return `<div class="results-placement">
        ${card('Overall',  p.overall.place,  p.overall.field,  p.overall.percentile,  fill(p.overall.place,  p.overall.field))}
        ${card(p.gender.label || 'Gender',     p.gender.place,   p.gender.field,   p.gender.percentile,   fill(p.gender.place,   p.gender.field))}
        ${card(p.ageGroup.label || 'Age group', p.ageGroup.place, p.ageGroup.field, p.ageGroup.percentile, fill(p.ageGroup.place, p.ageGroup.field))}
      </div>`;
```

With:

```js
      const cards = [];
      if (p.overall)  cards.push(card('Overall',                       p.overall.place,  p.overall.field,  p.overall.percentile,  fill(p.overall.place,  p.overall.field)));
      if (p.gender)   cards.push(card(p.gender.label   || 'Gender',    p.gender.place,   p.gender.field,   p.gender.percentile,   fill(p.gender.place,   p.gender.field)));
      if (p.ageGroup) cards.push(card(p.ageGroup.label || 'Age group', p.ageGroup.place, p.ageGroup.field, p.ageGroup.percentile, fill(p.ageGroup.place, p.ageGroup.field)));
      return cards.length ? `<div class="results-placement">${cards.join('')}</div>` : '';
```

- [ ] **Step 2: Guard `renderHalves` (lines 7144-7159)**

Replace the function body. Add `?.` on every nested read:

```js
    function renderHalves(h, note) {
      if (!h || (!h.first && !h.second)) return '';
      const firstCard = h.first ? `
        <div class="results-half-card">
          <div class="results-half-eyebrow">First half · 13.1 mi</div>
          <div class="results-half-time">${escapeHtml(h.first.time || '')}</div>
          <div class="results-half-pace">${escapeHtml(h.first.pace || '')} /mi</div>
        </div>` : '';
      const secondCard = h.second ? `
        <div class="results-half-card">
          <div class="results-half-eyebrow">Second half · 13.1 mi</div>
          <div class="results-half-time">${escapeHtml(h.second.time || '')}</div>
          <div class="results-half-pace">${escapeHtml(h.second.pace || '')} /mi</div>
        </div>` : '';
      return `<div class="results-halves">${firstCard}${secondCard}</div>
      ${h.netSplit ? `<p class="results-section-note"><strong>Net split:</strong> ${escapeHtml(h.netSplit)}.${note ? ' ' + escapeHtml(note) : ''}</p>` : ''}`;
    }
```

- [ ] **Step 3: Guard `renderPhases` per-phase fields (lines 7206-7229)**

Replace:

```js
    function renderPhases(phases) {
      if (!Array.isArray(phases)) return '';
      return phases.map(p => {
        if (!p) return '';
        const meta = [];
        if (p.miles)        meta.push({ label: 'Miles',     value: p.miles });
        if (p.elapsed)      meta.push({ label: 'Elapsed',   value: p.elapsed });
        if (p.segmentTime)  meta.push({ label: 'Time',      value: p.segmentTime });
        if (p.paceAvg)      meta.push({ label: 'Avg pace',  value: p.paceAvg });
        if (p.vsPlan)       meta.push({ label: 'vs plan',   value: p.vsPlan });
        if (p.halfwaySplit) meta.push({ label: 'Halfway',   value: p.halfwaySplit });
        if (p.pattern)      meta.push({ label: 'Pattern',   value: p.pattern });
        const metaHtml = meta.map(m => `
          <div class="results-phase-meta-item">
            <span class="results-phase-meta-label">${escapeHtml(m.label)}</span>
            <span class="results-phase-meta-value">${escapeHtml(m.value)}</span>
          </div>`).join('');
        return `<div class="results-phase">
          <div class="results-phase-eyebrow">Phase ${escapeHtml(String(p.number ?? ''))}</div>
          <div class="results-phase-title">${escapeHtml(p.label || '')}</div>
          <div class="results-phase-meta">${metaHtml}</div>
          <div class="results-phase-read">${escapeHtml(p.read || '')}</div>
        </div>`;
      }).join('');
    }
```

(The change is the `if (!p) return '';` guard at the top of the map callback, plus `?? ''` / `|| ''` on `number`, `label`, `read`.)

- [ ] **Step 4: Guard `renderPredictions` bet section (lines 7242-7261)**

Replace the `if (bet) { ... }` block:

```js
      let betHtml = '';
      if (bet) {
        const winner = bet.winner;
        const row = (key, name, time, delta) => `
          <div class="results-bet-row ${winner === key ? 'is-winner' : ''}">
            <span class="results-bet-name">${escapeHtml(name)}</span>
            <span class="results-bet-time">${escapeHtml(time || '')}</span>
            <span class="results-bet-delta">${escapeHtml(delta || '')}</span>
          </div>`;
        const daltonRow = bet.dalton ? row('dalton', 'Dalton', bet.dalton.time, bet.dalton.delta) : '';
        const claudeRow = bet.claude ? row('claude', 'Claude', bet.claude.time, bet.claude.delta) : '';
        betHtml = `<div class="results-bet">
          <div class="results-bet-title">Bet at ${escapeHtml(bet.at || '')} · Claude won by ${escapeHtml(bet.winMargin || '')}</div>
          ${daltonRow}
          ${claudeRow}
          ${bet.actual ? `<div class="results-bet-row is-actual">
            <span class="results-bet-name">Actual</span>
            <span class="results-bet-time">${escapeHtml(bet.actual)}</span>
            <span class="results-bet-delta"></span>
          </div>` : ''}
          ${bet.note ? `<div class="results-bet-note">${escapeHtml(bet.note)}</div>` : ''}
        </div>`;
      }
```

- [ ] **Step 5: Visual smoke test — Christina's archive still renders**

After push, open the live site, action FAB → Analytics → Results sub-tab. Confirm placement cards render (3 cards: Overall, Gender (F), F 30-34), halves panel renders (1:54:14 / 1:56:18), phase blocks render (3 phases), bet block renders (Dalton vs Claude). No regression — we only added guards, didn't change rendering for present data.

- [ ] **Step 6: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
fix(archive): optional-chain nested reads in race-archive renderers

renderPlacement / renderHalves / renderPhases / renderPredictions
no longer TypeError when an optional nested field is missing.
Christina's seed populates every path; defensive against future races
that omit e.g. placement.gender, halves.second, or bet.dalton.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 8: Sheet a11y — restore focus to launcher on close

**Why:** Action FAB opens Operations / Course Map / Analytics sheets. Closing each sheet (Escape, backdrop click, or close button) just removes the `.open` class — focus lands at `<body>`, which strands keyboard users. Capture `document.activeElement` on open, restore on close.

**Files:**
- Modify: `C:/Users/Owner/workspace/christina-okc-pacing/index.html` — three `closeSheet` (or equivalent) functions across the Analytics sheet (~7476-7494), Map sheet (~6446-6456 area), Ops sheet (similar pattern).

- [ ] **Step 1: Locate the three sheet close functions**

Run:

```bash
grep -n "function closeSheet\|function closeMap\|function closeOps\|Sheets\.\(analytics\|map\|ops\)" "C:/Users/Owner/workspace/christina-okc-pacing/index.html"
```

Expected: roughly three `closeSheet` (or named-equivalent) functions, one per sheet's IIFE. Confirm line numbers before editing.

- [ ] **Step 2: For each sheet IIFE, capture and restore focus**

Pattern — apply once per sheet (Analytics shown, replicate for Map and Ops):

```js
    let lastFocus = null;

    function openSheet() {
      lastFocus = document.activeElement;
      backdrop.classList.add('open');
      sheet.classList.add('open');
      document.body.classList.add('sheet-open');
      // ... existing rest of openSheet body
    }
    function closeSheet() {
      backdrop.classList.remove('open');
      sheet.classList.remove('open');
      document.body.classList.remove('sheet-open');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus({ preventScroll: true });
      }
    }
```

The `lastFocus` variable lives inside each sheet's IIFE closure — no cross-contamination with the other sheets.

- [ ] **Step 3: Smoke test**

Open the live site. Tab to the action FAB. Press Enter to open the menu. Tab/click into "Analytics". Press Escape. Focus should return to the FAB (visible focus ring). Repeat for Operations and Course Map.

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
fix(a11y): restore focus to launcher when closing sheets

Each sheet IIFE now captures document.activeElement on open and
restores it on close. Keyboard users land back on the FAB / link
that opened the sheet instead of <body>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

---

## Task 9: `[needs-confirm]` — race archive narrative facts

**Why:** Two factual claims in `scripts/seed-christina-race.mjs` need Dalton's review against Garmin / archive timing before the polish pass closes. This task is a **gate, not code** — do not edit the seed without confirmation.

**Files:**
- Reference: `C:/Users/Owner/workspace/christina-okc-pacing/scripts/seed-christina-race.mjs:150, 160, 185`

- [ ] **Step 1: Surface both claims to Dalton**

Print the two passages verbatim:

> **Claim 1 (line 150, Phase 1 narrative):** "...Notably, she sped up through the Shartel climb (mile 7), which was scheduled as one of her hardest miles."
>
> Plan M7 split (line 87) is 9:16 — the second-slowest planned mile. The official splits granularity is 5K, so M7 actual pace is not directly observable in the archive. **Question for Dalton:** does Garmin show M7 actual ≤ 9:16?

> **Claim 2 (line 160, Phase 2 narrative):** "Mid-race acceleration through the Britton neighborhood loop, leveraging course descent."
>
> The fastest 5K segment is 15K → 20K @ 8:25 (line 129), which maps to course miles 9.32–12.43. The Britton neighborhood loop is documented at miles 13–17 (line 185). The peak-pace segment is therefore *before* Britton, not through it. **Question for Dalton:** was the peak in Britton, before Britton, or are the two segments adjacent and the narrative is mapping them generously?

- [ ] **Step 2: Wait for Dalton's verdict, then either**

(a) **Confirm both as-written** — close the task, no edits.

(b) **Revise the seed copy** — edit `scripts/seed-christina-race.mjs` lines 150 and/or 160 with the corrected narrative, re-run the seed:

```bash
cd "C:/Users/Owner/workspace/christina-okc-pacing" && node scripts/seed-christina-race.mjs
```

Expected: upsert succeeds. The /api/results edge cache (60s) means the live site picks up the new copy within ~1 minute.

Then:

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add scripts/seed-christina-race.mjs
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
fix(seed): correct phase-1/2 narrative claims against Garmin + segment data

Per Dalton's review of Christina's M7 split and the 15K→20K peak
segment vs. the Britton neighborhood loop range.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

(No code change pushes a new build, but committing the seed edit keeps the source-of-truth in version control. The `git push` is for repo cleanliness, not deploy.)

---

## Self-Review

**Spec coverage** (against the audit's punch list):
- P0 — none (audit confirmed). ✓
- P1 #1 em-dash sweep → **Task 1**. ✓
- P1 #2 hero pill-tab → **Task 2**. ✓
- P1 #3 coach iter-3 truncation → **Task 3**. ✓
- P1 #4 prompt caching + module client → **Task 4**. ✓
- P1 #5 race name → **verified false, dropped** (audit was wrong; both seed lines have the year prefix). ✓
- P2 coach error handling 429/5xx → **Task 5**. ✓
- P2 ANTHROPIC_API_KEY validation → **Task 5**. ✓
- P2 SDK client per-request → **Task 4 (combined)**. ✓
- P2 bullet length 120/140 → **Task 6**. ✓
- P2 mile range 26 vs 26.2 → **Task 6**. ✓
- P2 race-archive renderer guards → **Task 7**. ✓
- P2 sheet focus restore → **Task 8**. ✓
- P2 needs-confirm narrative claims → **Task 9 (gate)**. ✓
- P2 anthropic logging verbose → **Task 5 partially** (reqId added; full sanitization not strictly needed since logs are server-side). ✓ partial — acceptable for a personal app.
- P2 pace-plan checkpoint em-dash (line 4960) → **Task 1 (line 4960 explicit)**. ✓
- P2 changes-empty em-dash (line 6692) → **Task 1 (line 6692 explicit)**. ✓
- P2 bullet text length mismatch (description/schema) → **Task 6**. ✓
- P3 — deferred per audit recommendation, not in scope.

**Placeholder scan:** no TBDs, no "implement appropriately", no "similar to Task N". Each step has the actual code or command. ✓

**Type consistency:** `MAX_TOOL_ITERATIONS`, `client`, `staticSystem`/`dynamicSystem`/`systemBlocks`, `truncated` flag, `lastFocus` — all match across the tasks that reference them. ✓

**Skipped intentionally:**
- P2 add_fuel_point 0.05mi tolerance — audit notes the description claims strict dedup but the tolerance is documented in CLAUDE.md and `lib/db.ts:121-123` reverts mirror it. Changing tolerance breaks revert symmetry; doc-only fix would be churn.
- P2 bullet 26.2 vs pace 26 — covered by Task 6.
- P2 ops sheet print textarea note — single-user gift app, Beth's note path not on critical path.
- P2 process.env.ANTHROPIC_API_KEY at module load — covered at handler entry in Task 5 (cleaner than module load, since module-load throw breaks the whole function).

---

## Execution

Plan complete. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
