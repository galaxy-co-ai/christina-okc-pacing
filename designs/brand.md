# Christina OKC Pacing — Brand Brief

> Boutique-adapted (Mechanical Sfumato). See `designs/systems/boutique/profile.md` in the workspace root for the full system DNA.

## Project context

A single-page pacing plan Dalton built for his wife Christina for the 2026 Oklahoma City Memorial Marathon. Race-day strategy designed by her father-in-law Jeff. This is a gift. Quality perception is not a side effect — it IS the product.

## Identity one-liner

Precision instrument worn smooth from use. Swiss timing under warm paper.

## Palette

| Role                 | Light                      | Dark                   | Rule                                 |
| -------------------- | -------------------------- | ---------------------- | ------------------------------------ |
| Background           | `#F5F4F0` (warm parchment) | `#0A0B0D` (deep floor) | Never pure white/black               |
| Surface              | `#FFFFFF`                  | `#111214`              | Cards, splits, timeline frame        |
| Elevated             | `#EEEDF2`                  | `#18191D`              | Tab rail, modal, coach sheet         |
| Text primary         | `#18181F` (ink-black)      | `#F2F2F3`              | 90% warm black                       |
| Text secondary       | `#6B6A7A`                  | `#8B8D94`              | Violet undertone in light            |
| Text tertiary        | `#9E9DAD`                  | `#5A5C63`              | Lowest-emphasis labels               |
| Accent (interactive) | `#1E72F0`                  | `#2B7FFF`              | Pill indicator, buttons, focus rings |
| Data (informational) | `#C97F0A`                  | `#F5A623`              | Reserved; not currently surfaced     |
| Zone — Cruise        | `#1E72F0`                  | `#2B7FFF`              | Miles 1–19                           |
| Zone — Fight         | `#DC2626`                  | `#EF4444`              | Miles 20–24                          |
| Zone — Finish        | `#16A34A`                  | `#22C55E`              | Miles 25–26.2                        |
| Now (current mile)   | `#D97706`                  | `#F59E0B`              | Amber pulse accent                   |
| Water station        | `#2563EB`                  | `#3B82F6`              | Droplet markers                      |

**Rule:** Blue = interactive only. Amber = data only. Zone colors = domain-specific (phase ID) and never cross into interactive or generic data roles. Purple banned entirely.

## Typography

| Role         | Family                           | Used where                                      |
| ------------ | -------------------------------- | ----------------------------------------------- |
| Display + UI | **Switzer** (Fontshare, 300–700) | Everything. Single-font economy is intentional. |

Numeric rendering: `font-variant-numeric: tabular-nums` on every pace, clock time, countdown, and cumulative. Non-negotiable — the data must column-align.

- Weights: 400 body, 500 labels + nav, 600 emphasis + headings
- Hero (goal finish time): `clamp(56px, 9vw, 72px)`, weight 600, letter-spacing -0.045em
- H1 (page title): `clamp(28px, 3.6vw, 40px)`, weight 600
- H2 (section): `clamp(20px, 2.4vw, 24px)`, weight 600
- Body: 14–15px, weight 400–500

## Shadows

10-o'clock light source always. Cast model in light, subtractive + rim-highlight model in dark. Canonical set:

- `--shadow-xs` — inputs at rest
- `--shadow` — default cards, splits list
- `--shadow-md` — coach sheet elevation
- `--shadow-kpi` — goal card (dual lift: dark cast bottom-right + white highlight top-left)
- `--shadow-input` — inset carved-in for pace-editor pill

## Motion

Choreographed per-property: `color` 80ms → `box-shadow` 150ms → `transform` 200ms. House curve: `cubic-bezier(0.16, 1, 0.3, 1)`. Exit animations use `cubic-bezier(0.4, 0, 1, 1)` and run 30% faster than entry.

The only elements that animate:

- Pill tab indicator (transform, 380ms, iOS-style spring)
- Coach sheet (transform, 380ms, same spring)
- Pulse dot on the countdown (2.4s infinite)
- Hover / active / focus state changes (instant-feel)

All animation respects `prefers-reduced-motion: reduce`.

## Layout

| Breakpoint | Container max-width | Padding         |
| ---------- | ------------------- | --------------- |
| < 640px    | 580px               | 24px 20px 96px  |
| ≥ 640px    | 580px               | 32px 28px 112px |
| ≥ 1024px   | 760px               | 48px 32px 120px |
| ≥ 1280px   | 840px               | 56px 36px 128px |

At ≥ 640px, each split row shows a short inline note (from `MILES[m].note`) next to the pace. Below 640px, the note is hidden and accessible via row expand.

## Surface techniques

1. **KPI goal card** — `shadow-kpi` dual lift on the hero panel
2. **Carved-in pace editor** — pill with `shadow-input` inset
3. **Color-choreographed hover** — splits rows tint 3% foreground on pointer-hover, guarded by `@media (hover: hover)`
4. **Focus-visible double ring** — `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)` on keyboard focus only

## Voice

Dalton's voice. Warm but precise. Direct. No marketing-speak. No exclamation points. Em-dashes allowed because this is NOT AI output — it's hand-authored copy. Numerals always. Active voice. Sentence case.
