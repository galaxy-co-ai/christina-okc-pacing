# Christina OKC Pacing — Structural Rewrite Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a single static HTML file; verification is screenshot-based, not test-based.

**Goal:** Replace the tactical 33-line patch shipped at commit `8277736` with a real structural pass that addresses the user's actual complaints (spacing, overlaps, edge cutoff/runoff, padding strategy, scroll behaviors) by applying the engineering constitution (`C:/Users/Owner/Downloads/engineering-constitution-extracted/`) as binding law.

**Architecture:** Single-file static HTML (`christina-okc-pacing/index.html`, 5,763 lines) with inline `<style>` and inline `<script>`. Two Vercel Edge functions for AI coach + plan persistence (untouched by this plan). Zero build step. Vercel git-integration auto-deploys on push to `main`.

**Tech Stack:** HTML5, CSS3 (custom properties + responsive `clamp()` + media queries), vanilla JS, Vercel Edge runtime, Anthropic SDK, Neon Postgres.

**Binding ruleset (engineering constitution — quote, don't summarize):**
- `ui-foundations`: REMOVE_BEFORE_ADD, NO_VISUAL_NOISE, HIERARCHY_THROUGH_SPACE, BALANCE_SCAN, CARD_STANDARD
- `typography`: FLUID_HEADINGS (clamp), TABULAR_NUMBERS, HEADING_LETTER_SPACING, ORPHAN_PREVENTION (text-wrap: balance)
- `layout-spacing`: 4px grid, RESPONSIVE_BREAKPOINTS (sm 640 / md 768 / lg 1024 / xl 1280), CONTAINER_PADDING (16/24/32-48 or `clamp(16px, 4vw, 48px)`), SPACING_PROXIMITY, CONSISTENT_GAP, STICKY_PATTERNS (z-index scale: content 1, sticky 10, dropdowns 20, modals 30, toasts 40 — adapted here for FAB stack)
- `motion`: NO_LAYOUT_ANIMATION (transform + opacity only), RESPECT_REDUCED_MOTION (every animation needs `@media (prefers-reduced-motion: no-preference)` guard or a `@media (prefers-reduced-motion: reduce)` reset)
- `color-system`: SEMANTIC_NOT_RAW, CONTRAST_MINIMUMS (WCAG AA 4.5:1 normal / 3:1 large)
- `interactive-elements`: 5 required states (default / hover (`@media (hover: hover)`) / active 0.96–0.98 scale / focus-visible 2px ring / disabled 0.5 opacity)

**Scope boundary — what this plan does NOT touch:**
- `api/coach.ts` (Anthropic tool-use loop)
- `api/plan.ts` (plan overlay endpoints)
- `lib/tools.ts` (coach tool definitions)
- The data model (`MILES`, `MILE_DETAILS`, `PLANS`, `ELEV` constants)
- `RaceMap` chart algorithm (only its container CSS may change)
- `MapSheet` route polyline (only its container CSS may change)
- The ops sheet's content (only its layout CSS may change)
- The Edge Postgres / Neon schema

**Race-day risk mitigation:**
The page works correctly today. Coach + plan + race map + ops sheet must keep working at every commit. Every phase ends in a commit; if a regression appears, `git revert` brings the page back to working before continuing.

---

## File Structure

Single file: `C:/Users/Owner/workspace/christina-okc-pacing/index.html`

CSS lives in lines 19–2769 (one giant inline `<style>` block).
HTML body lives in lines 2770–3490 (approx).
JS lives in lines 3500–5763 (inline `<script>` block).

Plan touches CSS only, with two HTML adjustments (banner already moved to inside goal-card by previous commit).

Audit artefacts go in `C:/Users/Owner/workspace/audit/` (gitignored — not part of project).

---

## Phase 0 — Baseline + branch + audit folder

Captures the current visual state across the matrix BEFORE any change so every later phase can compare against it. Establishes a feature branch so a single revert restores `main` if anything goes sideways.

### Task 0.1: Create audit folder + work branch

**Files:**
- Create: `C:/Users/Owner/workspace/audit/` (already created during research)
- Modify: git branch state

- [ ] **Step 1: Create the work branch off `main`**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" checkout -b structural-rewrite-2026-04-25
```

Expected: `Switched to a new branch 'structural-rewrite-2026-04-25'`

- [ ] **Step 2: Confirm clean working tree**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" status --short
```

Expected: empty output (clean tree).

- [ ] **Step 3: Verify audit folder exists**

```bash
ls "C:/Users/Owner/workspace/audit/"
```

Expected: directory exists (may be empty).

### Task 0.2: Capture baseline screenshots — light theme × 6 widths

Captures current visual state. Each capture goes through Firecrawl and is downloaded locally for direct visual reading.

**Files:**
- Create: `C:/Users/Owner/workspace/audit/baseline-light-360.png`
- Create: `C:/Users/Owner/workspace/audit/baseline-light-390.png`
- Create: `C:/Users/Owner/workspace/audit/baseline-light-414.png`
- Create: `C:/Users/Owner/workspace/audit/baseline-light-768.png`
- Create: `C:/Users/Owner/workspace/audit/baseline-light-1024.png`
- Create: `C:/Users/Owner/workspace/audit/baseline-light-1440.png`

- [ ] **Step 1: Capture all 6 widths in parallel**

For each width in [360, 390, 414, 768, 1024, 1440], call `mcp__firecrawl__firecrawl_scrape` with:
```json
{
  "url": "https://christina-okc-pacing.vercel.app",
  "formats": ["screenshot"],
  "screenshotOptions": { "fullPage": true, "viewport": { "width": <W>, "height": 800 } },
  "waitFor": 3500,
  "mobile": <W <= 414>
}
```

Issue all 6 in a single assistant message (parallel tool calls).

- [ ] **Step 2: Download each screenshot locally**

For each returned screenshot URL, run:

```bash
curl -s -o "C:/Users/Owner/workspace/audit/baseline-light-<W>.png" "<url>"
```

- [ ] **Step 3: Read each screenshot via the Read tool**

For each of the 6 PNGs, use the `Read` tool on `C:/Users/Owner/workspace/audit/baseline-light-<W>.png` to actually see it. Note one-line observations of any defect already visible (truncation, overlap, runoff). These observations seed the success criteria for later phases.

### Task 0.3: Capture baseline screenshots — dark theme × 6 widths

Dark mode is set via localStorage `theme=dark`. Use Firecrawl's `actions` parameter to set localStorage and the `data-theme` attribute, then take the screenshot.

**Files:**
- Create: `C:/Users/Owner/workspace/audit/baseline-dark-360.png` through `baseline-dark-1440.png`

- [ ] **Step 1: Capture all 6 widths in parallel with theme switch**

For each width in [360, 390, 414, 768, 1024, 1440], call `mcp__firecrawl__firecrawl_scrape` with:
```json
{
  "url": "https://christina-okc-pacing.vercel.app",
  "formats": ["screenshot"],
  "screenshotOptions": { "fullPage": true, "viewport": { "width": <W>, "height": 800 } },
  "waitFor": 2500,
  "mobile": <W <= 414>,
  "actions": [
    { "type": "executeJavascript", "script": "localStorage.setItem('theme','dark'); document.documentElement.setAttribute('data-theme','dark');" },
    { "type": "wait", "milliseconds": 1500 },
    { "type": "screenshot", "fullPage": true }
  ]
}
```

The dark screenshot is in `actions.screenshots[0]` of the response (NOT the top-level `screenshot`).

- [ ] **Step 2: Download each dark screenshot**

For each `actions.screenshots[0]` URL, `curl -s -o "C:/Users/Owner/workspace/audit/baseline-dark-<W>.png" "<url>"`.

- [ ] **Step 3: Read each dark screenshot**

Use `Read` on each. Note dark-specific defects (low-contrast surfaces, invisible elements like the goal-banner which is suspected to fail contrast at 14% alpha).

### Task 0.4: Commit baseline manifest

**Files:**
- Create: `C:/Users/Owner/workspace/audit/BASELINE-OBSERVATIONS-2026-04-25.md`

- [ ] **Step 1: Write a one-page observations doc**

Write `C:/Users/Owner/workspace/audit/BASELINE-OBSERVATIONS-2026-04-25.md` with:
- Date + commit SHA captured (`git -C "C:/Users/Owner/workspace/christina-okc-pacing" rev-parse HEAD`)
- For each (width × theme) pair, one bullet listing the most obvious defect

Example:
```markdown
# Baseline observations 2026-04-25 (commit 8277736)
- 360 light: AVG COURSE label truncates to "AVG COUR…", WATCH TARGET to "WATCH TA…"
- 390 light: same truncation; coach FAB sits ~140px below the fold
- 768 light: container max-width 580px wastes ~190px horizontal whitespace each side
- 360 dark: goal-banner background invisible (~14% alpha on dark surface)
- (etc.)
```

- [ ] **Step 2: This file is gitignored**

Confirm `audit/` is in `.gitignore` (or add it). The audit folder is local only.

```bash
grep -q "^audit/" "C:/Users/Owner/workspace/christina-okc-pacing/.gitignore" || echo "audit/" >> "C:/Users/Owner/workspace/christina-okc-pacing/.gitignore"
```

- [ ] **Step 3: Commit the gitignore change if any**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add .gitignore
git -C "C:/Users/Owner/workspace/christina-okc-pacing" diff --cached --quiet || git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "chore: ignore audit/ folder for local screenshots"
```

---

## Phase 1 — Breakpoint consolidation

The page currently uses 9 different breakpoints (520, 600, 620, 640, 720, 768, 1024, 1280px). The constitution mandates four canonical tiers: `sm 640 / md 768 / lg 1024 / xl 1280`. Mobile is implicit base (≥320px). This phase rationalises the breakpoint set — most of the off-canonical breakpoints (520, 600, 620, 720) belong inside the ops sheet and exist because the sheet has its own width context.

The strategy: **document the inventory, pick the canonical tier for each off-canonical query, only migrate where the migration improves correctness.** The ops sheet's 520/600/620/720 queries inside its own bottom-sheet context are *defensible* — they're internal layout breakpoints for sheet width, not page width. Document them as intentional and leave alone unless they cause defects.

### Task 1.1: Inventory all media queries

**Files:**
- Modify: `C:/Users/Owner/workspace/audit/BREAKPOINT-INVENTORY-2026-04-25.md` (create)

- [ ] **Step 1: Grep every media query**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" grep -n "@media" -- index.html > "C:/Users/Owner/workspace/audit/BREAKPOINT-INVENTORY-2026-04-25.md"
```

- [ ] **Step 2: Annotate each line in the inventory file**

For each `@media` line in the inventory, add a note in the file: `(page-level)` or `(ops-sheet-internal)` or `(coach-sheet-internal)` or `(map-sheet-internal)` based on which surface the rule controls. Page-level breakpoints must follow the constitution's canonical scale; sheet-internal breakpoints can keep their custom values because they govern sheet content width, not page width.

- [ ] **Step 3: Identify migrations**

In the same file, append a `Migrations:` section listing each page-level breakpoint that needs to move to the canonical scale. Expected migrations:
- None for the four canonical tiers already in use (640, 768 in places, 1024, 1280)
- Verify: ops/coach/map sheets keep their internal breakpoints

### Task 1.2: Add `768` page-level tier where missing

The container, hero, race-map canvas, and section-header rhythm currently jump from 640 → 1024. Adding a 768 tier gives tablets a dedicated step.

**Files:**
- Modify: `index.html` (CSS — `.container`, `.race-map-canvas`, `.section-header`)

- [ ] **Step 1: Read the current `.container` block**

Read lines 206–232 of `index.html` to confirm the current rules. The current flow is:
```css
.container { max-width: 580px; margin: -40px auto 0; padding: 0 20px max(140px, calc(140px + env(safe-area-inset-bottom))); ... }
@media (min-width: 640px)  { .container { padding: 0 28px ...; margin-top: -48px; } }
@media (min-width: 1024px) { .container { max-width: 760px; padding: 0 32px ...; margin-top: -56px; } }
@media (min-width: 1280px) { .container { max-width: 840px; padding: 0 36px ...; } }
```

- [ ] **Step 2: Insert a `768` tier into `.container`**

Find this block and replace:

OLD:
```css
  @media (min-width: 640px) {
    .container {
      padding: 0 28px max(156px, calc(156px + env(safe-area-inset-bottom)));
      margin-top: -48px;
    }
  }
  @media (min-width: 1024px) {
```

NEW:
```css
  @media (min-width: 640px) {
    .container {
      padding: 0 28px max(156px, calc(156px + env(safe-area-inset-bottom)));
      margin-top: -48px;
    }
  }
  @media (min-width: 768px) {
    .container {
      max-width: 680px;
      padding: 0 32px max(156px, calc(156px + env(safe-area-inset-bottom)));
    }
  }
  @media (min-width: 1024px) {
```

- [ ] **Step 3: Insert a `768` tier into `.race-map-canvas`**

Find this block:
```css
  @media (min-width: 640px) { .race-map-canvas { height: 280px; } }
  @media (min-width: 1024px) { .race-map-canvas { height: 320px; } }
```

Replace with:
```css
  @media (min-width: 640px) { .race-map-canvas { height: 280px; } }
  @media (min-width: 768px) { .race-map-canvas { height: 300px; } }
  @media (min-width: 1024px) { .race-map-canvas { height: 320px; } }
```

- [ ] **Step 4: Verify visually at 768px**

Capture a fresh screenshot at 768px light theme via Firecrawl (use the Phase 0 capture pattern) and `Read` it. Confirm the container now uses 680px max-width with 32px side padding and the race map canvas is 300px tall. Save as `C:/Users/Owner/workspace/audit/phase1-768-light.png`.

### Task 1.3: Commit Phase 1

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): add 768px tablet breakpoint to container + race map

Engineering constitution RESPONSIVE_BREAKPOINTS canonical scale is
sm 640 / md 768 / lg 1024 / xl 1280. The container previously jumped
from 640 to 1024, leaving iPad portrait (768px) using the 580px mobile
max-width with ~190px wasted whitespace per side. Race map canvas had
the same gap (280px → 320px with no 768 step).

- .container: add @media 768 — max-width 680px, padding 32px
- .race-map-canvas: add @media 768 — height 300px

Sheet-internal breakpoints (520/600/620/720 inside ops/coach/map
sheets) remain unchanged — they govern sheet content width, not page
width, and the constitution's canonical scale applies to page-level
queries only.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Goal card structural fix

The goal-card is the page's hero data surface. The 3-column grid at narrow widths is the source of the "AVG COUR…" / "WATCH TA…" truncation that the user noticed. Padding scales unevenly. The `white-space: nowrap` on labels is the bug. The folded banner inherits dark-mode contrast issues from the previous commit.

This phase: collapse the 3-col grid to a stacked label/value layout below 480px, drop `nowrap` from labels, switch padding to `clamp()` for proportional scaling, bump the dark-mode banner alpha so it's visible.

### Task 2.1: Stack goal-details on narrow widths

**Files:**
- Modify: `index.html` lines 535–550 (`.goal-details`, `.goal-detail`, `.goal-detail-label`, `.goal-detail-value`)

- [ ] **Step 1: Replace the `.goal-details` + children CSS**

Find lines 535–551 (the `.goal-details`, `.goal-detail`, `.goal-detail-label`, `.goal-detail-value`, `.goal-detail-value .unit` blocks) and replace.

OLD:
```css
  .goal-details {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
    background: transparent;
    border-radius: 0;
    overflow: visible;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--subtle);
  }
  .goal-detail { background: transparent; padding: 0; min-width: 0; }
  .goal-detail-label {
    font-size: 10px; color: var(--muted); margin-bottom: 6px;
    letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .goal-detail-value {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.025em;
    color: var(--fg);
  }
  .goal-detail-value .unit {
    color: var(--muted); font-weight: 400; font-size: 14px;
    font-family: var(--font-body);
    margin-left: 2px;
  }
```

NEW:
```css
  /* Mobile-first: stack as label-left / value-right rows.
     Switch to 3-column grid at >=480px where each column has
     enough room for a 0.10em-tracked uppercase label. */
  .goal-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--subtle);
  }
  .goal-detail {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
  }
  .goal-detail-label {
    font-size: 10.5px;
    color: var(--muted);
    letter-spacing: 0.10em;
    text-transform: uppercase;
    font-weight: 600;
    /* No nowrap — labels wrap if absolutely necessary, but at the
       stacked layout they have full row width. */
  }
  .goal-detail-value {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.022em;
    color: var(--fg);
    text-align: right;
  }
  .goal-detail-value .unit {
    color: var(--muted); font-weight: 400; font-size: 13px;
    font-family: var(--font-body);
    margin-left: 2px;
  }
  @media (min-width: 480px) {
    .goal-details {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
      padding-top: 24px;
    }
    .goal-detail { display: block; }
    .goal-detail-label { margin-bottom: 6px; letter-spacing: 0.12em; }
    .goal-detail-value { font-size: 22px; text-align: left; }
    .goal-detail-value .unit { font-size: 14px; }
  }
```

- [ ] **Step 2: Verify at 360 + 390 + 414 + 768 + 1024 light**

Capture five fresh screenshots (use the Phase 0 pattern, light only). `Read` each. Confirm:
- 360 / 390 / 414: goal-details renders as three full-width rows with label left, value right. No truncation. No ellipsis.
- 768 / 1024: 3-column grid as before, with all three labels readable in full ("AVG COURSE", "AVG GPS", "WATCH TARGET").

Save the five screenshots as `audit/phase2-1-<W>-light.png`.

### Task 2.2: Switch goal-card padding to clamp()

The current padding scales 32→36→44 horizontal and 28→32→40 vertical. The constitution prefers proportional `clamp()` formulas where the scaling is monotonic.

**Files:**
- Modify: `index.html` lines 491–510

- [ ] **Step 1: Replace the `.goal-card` block**

Find lines 491–510:

OLD:
```css
  .goal-card {
    background: var(--card);
    border: none;
    border-radius: var(--radius-xl);
    padding: 32px 28px;
    box-shadow: var(--shadow-md);
    margin-top: 0;
    position: relative;
    overflow: hidden;
    animation: card-rise 600ms var(--ease-emphasized-enter) 350ms backwards;
  }
  @keyframes card-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (min-width: 640px) {
    .goal-card { padding: 36px 32px; }
  }
  @media (min-width: 1024px) {
    .goal-card { padding: 44px 40px; }
  }
```

NEW:
```css
  .goal-card {
    background: var(--card);
    border: none;
    border-radius: var(--radius-xl);
    /* Proportional padding: 28px at 320px viewport scaling to 44px at 1024px+ */
    padding: clamp(28px, 4vw + 16px, 44px) clamp(20px, 4vw + 12px, 40px);
    box-shadow: var(--shadow-md);
    margin-top: 0;
    position: relative;
    overflow: hidden;
  }
  @media (prefers-reduced-motion: no-preference) {
    .goal-card { animation: card-rise 600ms var(--ease-emphasized-enter) 350ms backwards; }
    @keyframes card-rise {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }
```

(Note: this also wraps the entrance animation in a `prefers-reduced-motion` guard — work originally scheduled for Phase 6 but easier to do at the same edit since it's the same block.)

- [ ] **Step 2: Verify at 360 + 768 + 1440 light**

Capture three screenshots and `Read`. Confirm:
- 360: goal-card padding looks ~28px vertical, 20px horizontal. Time is breathing.
- 768: smooth scale, ~36px / 28px feel.
- 1440: at upper bound, padding feels generous.

Save as `audit/phase2-2-<W>-light.png`.

### Task 2.3: Fix folded-banner dark contrast

The folded banner inside the goal-card uses `--accent-subtle` which is `rgba(227,107,75,0.14)` in dark mode. On the dark card surface (`#161B22`), 14% alpha is too low — it reads as nearly no surface change. WCAG isn't strictly about backgrounds, but the user's perceptual complaint is real: the banner section vanishes.

**Files:**
- Modify: `index.html` line 122 (the `--accent-subtle` definition inside `:root[data-theme="dark"]`)

- [ ] **Step 1: Bump dark `--accent-subtle` from 0.14 to 0.20**

Find this line (around line 122):

OLD:
```css
      --accent-subtle: rgba(227,107,75,0.14);
```

NEW:
```css
      --accent-subtle: rgba(227,107,75,0.20);
```

- [ ] **Step 2: Verify the banner is visible in dark**

Capture a 390 dark-theme screenshot of the folded banner area (use the Phase 0 dark capture pattern). `Read` it. Confirm the banner's terracotta tint is clearly distinguishable from the card surface.

Save as `audit/phase2-3-390-dark.png`.

- [ ] **Step 3: Verify the bump didn't blow out other accent-subtle uses in dark**

Grep `--accent-subtle` to find every consumer:

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" grep -n "accent-subtle" -- index.html
```

For each consumer, confirm via screenshot or visual inspection that 20% alpha is acceptable. Likely consumers: hover tints on links/buttons, tab active states. If any feels too strong, leave the global value at 0.20 and use a per-consumer override at 0.14.

### Task 2.4: Commit Phase 2

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): structural fix for goal-card — stacked layout below 480px

The 3-column grid at narrow widths was the source of the "AVG COUR…"
/ "WATCH TA…" label truncation. Each column had ~95px of room and the
0.14em-tracked uppercase 10px labels needed ~110px+. Switched to a
mobile-first stacked layout (label left, value right, full row width)
that switches to the 3-column grid at >=480px where there's room.

- .goal-details: flex column on mobile, grid 1fr/1fr/1fr at >=480px
- .goal-detail-label: dropped white-space: nowrap + ellipsis (the bug)
- .goal-card padding: 32/36/44 step → clamp(28px, 4vw+16px, 44px)
- .goal-card animation: wrapped in prefers-reduced-motion guard
- --accent-subtle dark: 0.14 → 0.20 so the folded banner is visible
  on dark card surfaces

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Hero rebalance

Current hero `min-height: clamp(440px, 70vh, 620px)` eats 60–70% of the viewport on every load. On a 390×844 phone that's ~590px before any data is visible. The constitution's HIERARCHY_THROUGH_SPACE rule says "increase spacing between groups, decrease within groups" — the hero photo is one group, the data is the next, and the photo is dominating. The brand-v2 spec calls for full-bleed photo as a brand element, not a 70vh blocker.

Strategy: reduce hero min-height to ~45vh on mobile (still a strong photo presence, but data above the fold). Keep the larger size on desktop where vertical real estate is plentiful.

### Task 3.1: Reduce hero min-height on mobile

**Files:**
- Modify: `index.html` lines 224–235 (the `.hero` selector)

- [ ] **Step 1: Read the current `.hero` block**

Read lines 223–270 of `index.html`. Identify the `.hero { min-height: clamp(440px, 70vh, 620px); }` line and any responsive overrides.

- [ ] **Step 2: Adjust the clamp values**

Replace the existing `min-height` rule on `.hero` with:

OLD:
```css
    min-height: clamp(440px, 70vh, 620px);
```

NEW:
```css
    /* Hero takes ~45vh on small phones so the goal-card lands
       above the fold; scales up to 60vh on tablet and 70vh
       on desktop where vertical room is plentiful. */
    min-height: clamp(320px, 45vh, 460px);
```

Then add (or update if already present) a 768 + 1024 step:

```css
  @media (min-width: 768px) {
    .hero { min-height: clamp(420px, 60vh, 560px); }
  }
  @media (min-width: 1024px) {
    .hero { min-height: clamp(480px, 70vh, 640px); }
  }
```

If those blocks already exist within the `.hero` family, fold the `min-height` line into them. Otherwise add new blocks beneath the base `.hero` rule.

- [ ] **Step 3: Verify at 360 + 390 + 414 + 768 + 1024 light**

Capture five screenshots, `Read` each. Confirm:
- 360 / 390 / 414: photo is roughly 45% of viewport, "TARGET FINISH" + "3:55:00" visible without scroll.
- 768: photo larger but still gives data room above the fold.
- 1024: photo dominates as it does today (this is fine on desktop).

Save as `audit/phase3-1-<W>-light.png`.

### Task 3.2: Ensure overlap kissing distance still feels right

The `.container` has `margin-top: -40px` (mobile) so the goal-card kisses up under the hero by 40px. If the hero shrunk, the negative-margin overlap may feel off.

**Files:**
- Modify: `index.html` lines 207–222 (overlap values)

- [ ] **Step 1: Verify visually first**

After Task 3.1, look at the 360 screenshot specifically at the hero/goal-card boundary. If the goal-card looks awkward — too much overlap, too little, etc. — adjust. If it looks correct, no change needed.

- [ ] **Step 2: Adjust if necessary**

If the overlap is wrong, modify the relevant `.container { margin-top: -Xpx }` value. Default expected change: keep `-40px` mobile (it should still feel right with the smaller hero), keep `-48px` 640+, keep `-56px` 1024+.

### Task 3.3: Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): rebalance hero so data lands above the fold on mobile

Engineering constitution HIERARCHY_THROUGH_SPACE: data is the product,
the photo is the wrapper. 70vh hero on a 390x844 phone meant ~590px
of editorial photography before any pace number was visible. Christina
opens this race-morning to look at her splits, not the photo.

Reduced hero min-height clamp on mobile (45vh) and tablet (60vh).
Desktop unchanged — vertical real estate is plentiful at 1024+, hero
can dominate as a brand statement.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — `white-space: nowrap` audit

The page has 11 `nowrap` declarations (lines 426, 489, 548, 664, 729, 1024, 1180, 2080, 2350-area, 2744). One was already removed in Phase 2 (`.goal-detail-label`, line 548). Each remaining one is a horizontal-overflow risk if the content grows or the viewport narrows. Audit each, keep load-bearing ones, drop the rest.

### Task 4.1: Audit each remaining `nowrap`

**Files:**
- Modify: `C:/Users/Owner/workspace/audit/NOWRAP-AUDIT-2026-04-25.md` (create)

- [ ] **Step 1: Grep current state**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" grep -n "white-space:\s*nowrap" -- index.html > "C:/Users/Owner/workspace/audit/NOWRAP-AUDIT-2026-04-25.md"
```

- [ ] **Step 2: For each match, classify**

In the audit file, append after each match:
- `KEEP` — the content is short and fixed-length (e.g., a date pill like "1d 4h 32m", or a button label like "Standard")
- `DROP` — the content can grow or the viewport can compress it; nowrap will silently truncate
- `INSPECT` — needs visual verification before deciding

Expected classifications (subject to verification):
- `.countdown` (~426): KEEP — date string is short
- `.pill-tab` (~489): KEEP — short tab labels
- `.section-note` (~664): KEEP — short labels (e.g., "26.2 mi · 1,150 – 1,290 ft")
- `.race-map-subtitle` (~729): INSPECT — does "Elevation + zones" / "Pace per mile" / etc. fit at 360px?
- `.zone-pace` (~1024): KEEP — pace strings are short (e.g., "9:00–9:15")
- `.split-note-inline` (~1180): KEEP — display:none below 640 anyway
- `.ops-jump-btn` (~2080): KEEP — chip-style nav buttons
- (others): INSPECT visually

### Task 4.2: Apply the audit decisions

**Files:**
- Modify: `index.html` (the specific lines flagged DROP in 4.1)

- [ ] **Step 1: For each `DROP`, remove the `white-space: nowrap` declaration**

Use `Edit` with the surrounding selector + property block as context to make each change uniquely matched. Example:

If `.race-map-subtitle` is flagged DROP, find its block (lines ~727–735) and remove the `white-space: nowrap;` line.

- [ ] **Step 2: For each `INSPECT`, screenshot and decide**

Capture a 360 light screenshot zoomed to the relevant element if needed. Make the keep/drop call inline. Update the audit file with the final disposition.

- [ ] **Step 3: Verify the page still renders correctly**

Capture a fresh full-page 390 light screenshot. `Read` it. Confirm no new layout shifts, overflows, or weird wrapping introduced by the removals.

Save as `audit/phase4-2-390-light.png`.

### Task 4.3: Commit Phase 4

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): drop nowrap on selectors that should wrap on mobile

Audited all 10 remaining white-space:nowrap declarations against the
content each governs. Kept it on short-fixed-length content (countdown
pill, tab labels, zone pace, section notes). Dropped it on selectors
where content can grow or the viewport can compress — see
audit/NOWRAP-AUDIT-2026-04-25.md for per-line disposition.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Splits inner-scroll resolution

The splits list is wrapped in a `.splits-wrapper` with `max-height: 440px` and inner scroll, with fade gradients top + bottom and an expand toggle in the section header. The user flagged "scroll behaviors and settings shit" as a structural complaint. Two competing scroll axes (page + inner container) on the surface where data density is highest is the issue.

Strategy: **remove the inner-scroll wrapper.** The splits become a normal in-page section. The page is long but that's fine — Christina opens this on a phone and swipes through her plan; nested scroll containers are a desktop convention that translates poorly to touch.

The expand/collapse toggle stays as a state-keeper but its role becomes "show all 27 miles" vs "show only key checkpoints" instead of "expand the inner scrollbox." Specifically: collapsed state shows miles 1, 5, 10, 15, 20, 24, 26.2 (7 rows ~= 280px); expanded shows all 27.

### Task 5.1: Audit current splits-wrapper structure

**Files:**
- Modify: `C:/Users/Owner/workspace/audit/SPLITS-AUDIT-2026-04-25.md` (create)

- [ ] **Step 1: Read the current splits markup**

Find `.splits-wrapper` in HTML (`<div class="splits-wrapper" id="splits-wrapper">` near line 2895). Note its children: `.splits-fade.splits-fade-top`, `.splits`, `.splits-fade.splits-fade-bottom`.

- [ ] **Step 2: Read the current splits CSS**

Grep for `.splits-wrapper`, `.splits`, `.splits-fade` CSS rules. Note the `max-height: 440px` rule on `.splits` (around line 1041). Note the toggle behavior (search for `splits-compact` or similar class controlling collapse state).

- [ ] **Step 3: Read the current toggle JS**

Find the toggle handler in the inline `<script>`. Note what class is added/removed and where the `localStorage` persists state.

- [ ] **Step 4: Document findings**

Write `C:/Users/Owner/workspace/audit/SPLITS-AUDIT-2026-04-25.md` with:
- Current DOM structure
- Current CSS rules (with line numbers)
- Current toggle logic (with line numbers)
- Proposed new structure (page-scroll only, fewer rows when collapsed)

### Task 5.2: Remove inner-scroll, keep the toggle as row filter

**Files:**
- Modify: `index.html` — `.splits-wrapper` HTML (around line 2895), `.splits` + `.splits-wrapper` + `.splits-fade` CSS (around lines 1040-ish), the toggle JS handler.

- [ ] **Step 1: Remove the fade-gradient divs from HTML**

Find:
```html
  <div class="splits-wrapper" id="splits-wrapper">
    <div class="splits-fade splits-fade-top" aria-hidden="true"></div>
    <div class="splits" id="splits"></div>
    <div class="splits-fade splits-fade-bottom" aria-hidden="true"></div>
  </div>
```

Replace with:
```html
  <div class="splits" id="splits"></div>
```

(Drop the wrapper and the two fade divs. The `.splits-wrapper` selector no longer applies; `.splits` is now the direct child of the section.)

- [ ] **Step 2: Drop `.splits-wrapper` + `.splits-fade*` CSS**

Find every CSS rule that targets `.splits-wrapper` or `.splits-fade*` (grep first to be thorough). Delete each rule.

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" grep -n "splits-wrapper\|splits-fade" -- index.html
```

For each match in the CSS section (lines 19–2769), use `Edit` to delete that rule. Keep the `<div id="splits">` rule itself.

- [ ] **Step 3: Drop `max-height` on `.splits`**

Find the `.splits { ... max-height: 440px; ... }` rule (around line 1040). Remove just the `max-height` declaration; keep the rest of the rule. Also remove `overflow-y: auto` if present.

- [ ] **Step 4: Update toggle JS to filter rows instead of toggling scroll**

Find the toggle handler in the inline JS. The current logic likely toggles a `.splits-compact` class on the wrapper. New logic:
- Collapsed state: render only key miles (1, 5, 10, 15, 20, 24, 26.2). Rest are `display: none`.
- Expanded state: all 27 rows visible.

Reuse the existing `localStorage` key. Confirm the chevron rotation animation still fires on toggle.

Concrete approach: in `renderSplits(plan)`, add a class to each `.split` row marking it as `key` or `non-key` based on its mile number. CSS:

```css
  .splits.compact .split:not(.split-key) { display: none; }
```

Then the toggle JS just toggles the `compact` class on the `#splits` element. Update the chevron icon based on state.

(If implementing this turns out larger than expected, fall back to a simpler V1: show first 12 miles when collapsed, all 27 when expanded — same UX value, less logic churn. Cap to ~30 minutes; if you blow that budget, fall back.)

- [ ] **Step 5: Verify scroll behavior**

Capture full-page screenshots at 360 + 390 light. Scroll through manually via Firecrawl `executeJavascript` if needed. Confirm:
- No inner scrollbox.
- Page scrolls smoothly through splits.
- Collapse/expand toggle still works (test via `executeJavascript: document.getElementById('splits-toggle').click()`).
- `localStorage.splitsCollapsed` (or whatever the key is) still persists.

Save as `audit/phase5-2-<W>-light.png`.

### Task 5.3: Commit Phase 5

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): remove splits inner-scroll, switch toggle to row filter

The mile-by-mile splits used a 440px max-height inner-scroll wrapper
with top/bottom fade gradients. On mobile this meant two competing
scroll axes (page scroll + inner scroll) on the surface where data
density is highest. The user called out scroll behaviors as one of
the structural defects.

Switched to a single page-level scroll. Compact state filters to key
miles (1, 5, 10, 15, 20, 24, 26.2); expanded state shows all 27 rows.
Toggle button preserved with chevron animation; localStorage state
preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Z-index + FAB clearance audit

Two FABs (`.coach-fab` + `.map-fab`) both share `z-index: 40`. The map FAB stacks above the coach FAB only because of DOM order. If anyone reorders the DOM, FABs collide. The `.ops-backdrop` and `.ops-sheet` lack explicit z-index, relying on stacking-context defaults. Fix the stack with an explicit, documented map.

### Task 6.1: Define the z-index scale

**Files:**
- Modify: `index.html` — header comment in CSS section + each fixed-position element's z-index

- [ ] **Step 1: Add a z-index scale comment near the top of the CSS**

Find a good anchor near the start of the CSS block (after `:root` and before component blocks, around line 200). Insert this comment block:

```css
  /* ─── Z-INDEX SCALE (firm) ───
     Per engineering-constitution layout-spacing.STICKY_PATTERNS,
     all fixed-position elements use this scale. No arbitrary values.

       1   .container        — page content baseline
       10  (reserved)        — sticky headers (none currently)
       20  (reserved)        — dropdowns
       40  .map-fab          — bottom-right course-map FAB
       41  .coach-fab        — bottom-center coach FAB (above map FAB
                                because tap target is wider; coach
                                wins coplanar tap conflicts)
       50  .ops-backdrop, .map-backdrop, .coach-backdrop
       60  .ops-sheet, .map-sheet, .coach-sheet
       90  .ops-toast        — confirmations
  */
```

- [ ] **Step 2: Set `.coach-fab` to z-index 41**

Find `.coach-fab` (around line 1693). Update `z-index: 40;` → `z-index: 41;`.

- [ ] **Step 3: Add z-index to `.ops-backdrop`**

Find `.ops-backdrop` (around line 1974). Add `z-index: 50;` if missing.

- [ ] **Step 4: Add z-index to `.ops-sheet`**

Find `.ops-sheet` (around line 1985). Add `z-index: 60;` if missing.

- [ ] **Step 5: Verify other backdrops + sheets**

Grep:
```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" grep -n "backdrop\|map-sheet\|coach-sheet\|ops-toast" -- index.html
```

For each `.coach-backdrop`, `.coach-sheet`, `.map-backdrop`, `.map-sheet`, `.ops-toast` selector, confirm or add the corresponding z-index from the scale. Use `Edit` to fix any mismatches.

- [ ] **Step 6: Test FAB tap behavior**

Capture a 390 light screenshot. The coach FAB should be clearly tappable; the map FAB sits clear in the bottom-right. Both FABs should not visually collide. Open the ops sheet via `executeJavascript: document.querySelector('[data-action=\"open-ops\"]').click()` and confirm the sheet covers the FABs (z-index 60 vs 40/41 = sheet wins).

### Task 6.2: Commit Phase 6

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): explicit z-index scale per constitution STICKY_PATTERNS

Both FABs were at z-index 40, relying on DOM order for stacking.
Backdrops and sheets had no explicit z-index. Added a documented
scale at the top of the CSS block and set each fixed-position
element to its assigned tier:

  40 .map-fab
  41 .coach-fab    (above map FAB; coach wins coplanar tap conflicts)
  50 backdrops
  60 sheets
  90 toasts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Motion accessibility (`prefers-reduced-motion`)

Inventory every `@keyframes` and `animation:` rule. Each must either be wrapped in `@media (prefers-reduced-motion: no-preference)` or be neutralized by a global `@media (prefers-reduced-motion: reduce)` block. The current page has a `prefers-reduced-motion: reduce` block at line 156; verify it's complete and add per-keyframe guards where it isn't.

### Task 7.1: Inventory motion rules

**Files:**
- Modify: `C:/Users/Owner/workspace/audit/MOTION-AUDIT-2026-04-25.md` (create)

- [ ] **Step 1: Grep all keyframes and animations**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" grep -nE "(@keyframes|animation:|animation-)" -- index.html > "C:/Users/Owner/workspace/audit/MOTION-AUDIT-2026-04-25.md"
```

- [ ] **Step 2: Read the existing reduced-motion block**

Read lines 156–168 of `index.html`. Note what it neutralizes — usually `* { animation-duration: 0s !important; transition-duration: 0s !important; }`.

- [ ] **Step 3: Cross-check inventory vs guard**

For each animation in the inventory, ask: does the existing reduced-motion block neutralize it? If the block uses `*` selector with `animation-duration: 0s !important`, the answer is yes — animations are forcibly halted. If the block is selective, list the animations not covered.

If the existing `prefers-reduced-motion: reduce` block is comprehensive (uses `*` selectors), no per-keyframe guards are needed and Phase 7 is just verification. Mark the audit complete and move to commit.

If gaps exist, list them and proceed to Task 7.2.

### Task 7.2: Add per-keyframe `prefers-reduced-motion: no-preference` guards (only if needed)

**Files:**
- Modify: `index.html` — wrap each unguarded `@keyframes` and its consuming `animation:` rule.

- [ ] **Step 1: For each gap from 7.1, wrap**

Pattern: instead of

```css
.foo { animation: rise 600ms ease 0s backwards; }
@keyframes rise { from { opacity: 0; } to { opacity: 1; } }
```

write:

```css
@media (prefers-reduced-motion: no-preference) {
  .foo { animation: rise 600ms ease 0s backwards; }
  @keyframes rise { from { opacity: 0; } to { opacity: 1; } }
}
```

(The `.goal-card` rule already got this treatment in Phase 2.)

- [ ] **Step 2: Verify with reduced-motion simulated**

Capture a 390 screenshot using Firecrawl's `actions` parameter to set the `prefers-reduced-motion` query:

```json
{
  "actions": [
    { "type": "executeJavascript", "script": "Object.defineProperty(window, 'matchMedia', { value: q => ({ matches: /reduce/.test(q), media: q, addEventListener: () => {}, removeEventListener: () => {} }) });" },
    { "type": "wait", "milliseconds": 1500 },
    { "type": "screenshot" }
  ]
}
```

(Alternative: if the browser engine respects a CSS-level test, use `document.documentElement.style.cssText` to inject a media-query override. The exact mechanism depends on Firecrawl's headless Chrome version; if matchMedia spoofing doesn't take, skip this verification — the CSS guards are correct by construction.)

### Task 7.3: Commit Phase 7

- [ ] **Step 1: Commit**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" add index.html
git -C "C:/Users/Owner/workspace/christina-okc-pacing" commit -m "$(cat <<'EOF'
refactor(ui): respect prefers-reduced-motion across all animations

Engineering constitution motion.RESPECT_REDUCED_MOTION mandates every
animation either sit inside @media (prefers-reduced-motion:
no-preference) or be neutralized by an existing reduce block. Audited
all keyframes and confirmed coverage; added per-keyframe guards where
the global reduce block didn't reach.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Final visual verification across the matrix

Capture the full screenshot matrix again and compare to baseline. Any defect from baseline that's now resolved is a win; any new defect is a regression that must be fixed before merging.

### Task 8.1: Capture post-state screenshots

**Files:**
- Create: `C:/Users/Owner/workspace/audit/final-light-<W>.png` × 6
- Create: `C:/Users/Owner/workspace/audit/final-dark-<W>.png` × 6

- [ ] **Step 1: Light theme × 6 widths in parallel**

Same Firecrawl pattern as Phase 0 Task 0.2.

- [ ] **Step 2: Dark theme × 6 widths in parallel**

Same Firecrawl pattern as Phase 0 Task 0.3.

- [ ] **Step 3: Read each image**

Use the `Read` tool on each of the 12 PNGs.

### Task 8.2: Diff observations vs baseline

**Files:**
- Modify: `C:/Users/Owner/workspace/audit/FINAL-OBSERVATIONS-2026-04-25.md` (create)

- [ ] **Step 1: Write the comparison doc**

Write `C:/Users/Owner/workspace/audit/FINAL-OBSERVATIONS-2026-04-25.md` with two sections:
- **Resolved from baseline:** for each defect listed in `BASELINE-OBSERVATIONS-2026-04-25.md`, confirm it's now fixed (cite the screenshot file).
- **New defects (regressions):** anything that looks worse than baseline. If any exist, fix them before commit. If none, the phase passes.

- [ ] **Step 2: Verify all baseline defects resolved**

Confirm at minimum:
- 360/390/414 light + dark: goal-card labels render in full, no truncation.
- 360/390/414 light + dark: hero is ~45% of viewport, goal-card lands above the fold.
- 768 light + dark: container uses 680px max-width, no wasted whitespace.
- 360 dark: folded banner inside goal-card is clearly visible.
- All widths: no horizontal overflow, no edge cutoff, FABs sit clear of content at scroll-end.
- All widths: no inner-scroll on splits.

If any of these fails, **return to the relevant phase and re-fix**, do NOT proceed to merge.

### Task 8.3: Final commit + merge to main

- [ ] **Step 1: Push the work branch**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin structural-rewrite-2026-04-25
```

- [ ] **Step 2: Confirm Vercel preview build succeeded**

Use the Vercel MCP (`mcp__vercel__list_deployments`) to find the deployment for `structural-rewrite-2026-04-25` branch. Wait until state is `READY`. Open the preview URL via `mcp__vercel__get_deployment` and capture a 390 light screenshot — verify the preview matches local screenshots.

- [ ] **Step 3: Merge to main (fast-forward)**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" checkout main
git -C "C:/Users/Owner/workspace/christina-okc-pacing" merge --ff-only structural-rewrite-2026-04-25
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin main
```

- [ ] **Step 4: Confirm prod deploy + visual smoke test**

Poll `mcp__vercel__list_deployments` until the new `main` deployment is `READY`. Capture a 390 light + dark screenshot of the live `christina-okc-pacing.vercel.app` URL. `Read` both. Confirm the page matches the local final screenshots.

- [ ] **Step 5: Delete the work branch**

```bash
git -C "C:/Users/Owner/workspace/christina-okc-pacing" branch -d structural-rewrite-2026-04-25
git -C "C:/Users/Owner/workspace/christina-okc-pacing" push origin --delete structural-rewrite-2026-04-25
```

- [ ] **Step 6: Save execution time**

Append a line to `C:/Users/Owner/.claude/projects/C--Users-Owner-workspace/memory/execution-times.md`:

```markdown
- 2026-04-25 — christina-okc-pacing structural rewrite — N tasks across 8 phases — <wall-clock minutes>
```

---

## Self-review checklist

Before declaring the plan executable:

**1. Spec coverage:** Each user complaint mapped to a phase?
- Spacing → Phase 2 (goal-card padding clamp), Phase 3 (hero rebalance) ✓
- Overlaps → Phase 6 (z-index scale), Phase 0/8 (verification) ✓
- Runoff/cutoff at edges → Phase 2 (drop nowrap on labels), Phase 4 (nowrap audit) ✓
- Poor padding strategies → Phase 2 (clamp), Phase 1 (768 tier on container) ✓
- Scroll behaviors → Phase 5 (remove splits inner-scroll) ✓

**2. No placeholders:** Each step has actual code or actual command? ✓

**3. Type/selector consistency:** `.goal-detail-label` referenced in Phase 2 matches the existing class name; `.splits-wrapper` removed in Phase 5 not referenced in later phases ✓

**4. Verification per phase:** Every phase ends in a screenshot read + commit ✓

**5. Reversibility:** Each phase is a single commit; `git revert <sha>` restores prior state if a regression appears ✓

---

## Execution handoff

Plan saved to `christina-okc-pacing/docs/plans/2026-04-25-structural-rewrite.md`.

**Recommended execution mode:** Inline execution via `superpowers:executing-plans` — this is a single-file refactor with phase-level checkpoints, no parallel work to dispatch. Use the executing-plans skill for batch execution with screenshot verification at each phase boundary.
