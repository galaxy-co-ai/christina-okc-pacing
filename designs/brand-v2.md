# Christina OKC Pacing — Brand v2

> **Supersedes `brand.md` (Boutique adaptation).** Adopted 2026-04-25.
> Full system pivot from "Mechanical Sfumato" to **Editorial Running Monograph**.
>
> **2026-04-25 update (typography):** Editorial Fraunces serif retired. Pivoted
> to **Apple HIG / SF Pro system stack** at Dalton's call — felt too whimsical
> for a precision-instrument utility on race morning. Should feel like Apple
> Health / Stocks / Fitness, not a magazine spread. Color, surfaces, motion,
> photography direction below remain valid; only the type families changed.
> Display = SF Pro Display (system), body = SF Pro Text (system), mono = SF
> Mono (system). Weights lean 600-700 for display, 400 for body. No web fonts.

## Identity one-liner

A bespoke race program made for one runner. Not an app, not a dashboard — a personal monograph that happens to be interactive. Photography, serif headlines, and one disciplined warm accent.

## Inspiration & differentiation

- **Aesthetic DNA:** Nike Run Club's photo-led restraint + magazine editorial typography (think *The Gentlewoman*, *Tracksmith Meter Magazine*).
- **What we steal:** Hero photography, frosted-glass nav over imagery, big confident numbers + tiny labels, no visible card borders, generous breathing room, single warm accent.
- **What we don't:** NRC's bright-and-corporate energy. We are quieter, warmer, more personal.

## Palette

Light and dark are designed as **independent atmospheres**, not inverted tokens. Light = warm cream daylight. Dark = cool night-running.

### Light (default)

| Role | Hex | Use |
|---|---|---|
| Background | `#F8F6F1` | Warm paper, page floor |
| Surface | `#FFFEFB` | Cards, sheets — warmer than pure white |
| Elevated | `#F1EEE7` | Pill rails, inset chips |
| Foreground | `#0F1410` | Forest ink, near-black with green undertone |
| Muted | `#6E6F66` | Secondary text, labels |
| Faint | `#A09F95` | Tertiary, low-emphasis labels |
| Accent | `#C5482F` | **Terracotta** — single disciplined warm signal |
| Accent soft | `rgba(197,72,47,0.10)` | Hover wash, focus tints |
| Hero overlay | `linear-gradient(180deg, rgba(15,20,16,0.10) 0%, rgba(15,20,16,0.55) 70%, rgba(15,20,16,0.78) 100%)` | Bottom-weighted darken for hero text legibility |

### Dark (independent atmosphere — not inverted)

| Role | Hex | Use |
|---|---|---|
| Background | `#0E1318` | Cool midnight, slight blue undertone |
| Surface | `#161B22` | Card fill — cooler than light surface |
| Elevated | `#1C242E` | Pill rails, modal lift |
| Foreground | `#F2EDE2` | Warm cream — never pure white |
| Muted | `#8B8A82` | Warm gray |
| Faint | `#5A5A53` | Tertiary |
| Accent | `#E36B4B` | Brighter terracotta — pops on cool dark |
| Accent soft | `rgba(227,107,75,0.14)` | |
| Hero overlay | `linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.85) 100%)` | Heavier overlay for night atmosphere |

### Domain colors (preserved, desaturated)

Zone identity is functional. We keep the three zones but pull them ~30% toward the surface so they read as quiet markers, not alarms.

| Zone | Light | Dark |
|---|---|---|
| Cruise (Mi 1–19) | `#3F6B85` (slate blue) | `#5C8AAA` |
| Fight (Mi 20–24) | `#A8523F` (warm rust, near-accent) | `#C77460` |
| Finish (Mi 25–26.2) | `#5E7A4A` (olive) | `#82A36A` |

**Rule:** Accent (terracotta) = interactive only. Zones = phase identity only. Never cross.

## Typography

| Role | Family | Source |
|---|---|---|
| Display | **Fraunces** (variable, opsz 9–144, wght 100–900) | Google Fonts |
| Body / UI | **Switzer** (300–700) | Fontshare |
| Numbers / mono | **Geist Mono** (when emphasized) | Vercel via Google Fonts |

### Type scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `hero` | `clamp(48px, 7vw, 84px)` Fraunces | 400, opsz 144 | Goal finish time, hero numbers |
| `display` | `clamp(36px, 5vw, 56px)` Fraunces | 400, opsz 72 | Page title in hero |
| `h1` | `clamp(28px, 3.6vw, 40px)` Fraunces | 500 | Section openers |
| `h2` | `clamp(22px, 2.6vw, 28px)` Switzer | 600 | Subsections |
| `h3` | 18px Switzer | 600 | Card titles |
| `body` | 15px Switzer | 400 | Default |
| `body-sm` | 13px Switzer | 400 | Secondary |
| `caption` | 11px Switzer | 600 | Letterspaced labels (uppercase) |
| `kpi-label` | 10px Switzer | 600 | Tiny labels under big numbers |

### Firm rules

- **Numbers always tabular** (`font-variant-numeric: tabular-nums`)
- **Hero numbers in Fraunces** with optical-size 144 — feels engraved, not generic
- **Letter-spacing:** `-0.04em` on hero, `-0.02em` on display, `0.12em` on uppercase captions
- **Italic Fraunces** is allowed for editorial flourish (e.g., "*Standard*" plan label) — the soft optic is gorgeous

## Surfaces

**No visible borders.** Cards are separated by shadow + tonal fill only. This is a complete reversal from v1.

| Element | v1 (Boutique) | v2 (Editorial) |
|---|---|---|
| Card border | `1px solid rgba(0,0,0,0.11)` | **None** |
| Card padding | 14–16px | 24–32px |
| Card radius | 12px | **20px** standard, 28px hero |
| Card shadow (light) | `--shadow` with cast | `0 1px 2px rgba(15,20,16,0.04), 0 8px 24px -8px rgba(15,20,16,0.10)` |
| Card shadow (dark) | inset highlight + cast | `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -4px rgba(0,0,0,0.5)` |

### Frosted glass (over photography)

```css
background: rgba(255, 255, 255, 0.18);
backdrop-filter: blur(20px) saturate(140%);
-webkit-backdrop-filter: blur(20px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.22);
```

In dark mode, swap to `rgba(255, 255, 255, 0.10)` base and `rgba(255, 255, 255, 0.14)` border.

## Photography

### The hero image

Full-bleed image at the top of the page. Subject: running, road, atmospheric — **NOT a stock fitness model**. Looks like an editorial spread.

- Aspect: 16:9 desktop, ~4:5 mobile (use `object-fit: cover`)
- Treatment: gradient overlay (see palette table) for text legibility
- Sourced from Unsplash by default, swappable to Christina's training photo via single CSS var
- Fallback: cool deep gradient if image fails to load

### Other imagery

- Topo map peek for race-map default view (monochrome path on cream/midnight)
- Otherwise restrained — no decorative imagery

## Layout

| Breakpoint | Container max-width | Side padding |
|---|---|---|
| < 640px | full-bleed hero, 100% body | 20px body |
| ≥ 640px | 580px body | 28px |
| ≥ 1024px | 760px body | 32px |
| ≥ 1280px | 880px body | 36px |

### Section rhythm (firm)

- Between major sections: **48–64px**
- Inside cards: **24–32px** padding, **16px** internal gaps
- Hero overlap: -32px on body sections so they kiss the hero edge

## Motion

Inherits the v1 timing system (already correct per workspace constitution). New rules:

- **Hero photo entrance:** scale 1.04 → 1.0 over 800ms `ease-emphasized-enter` on first paint, with overlay fading in 200ms after
- **KPI numbers:** stagger in with 60ms delay between cards
- **Theme toggle:** **instant** (no transition on theme switch — per constitution)
- **Sheet open/close:** keep existing 380ms spring

## Voice

Unchanged from v1. Dalton's voice. Warm but precise. Direct. Numerals always. Active voice. Sentence case.

**One change:** em-dashes are still allowed because this is hand-authored, but in the redesign we lean on punctuation breath rather than dashes wherever possible. Periods and line breaks do the work.

## Migration checklist

- [ ] Token system rewrite (`:root` + `:root[data-theme="dark"]`)
- [ ] Fraunces font load
- [ ] Hero replacement (photo-led)
- [ ] Strip all card borders
- [ ] KPI/goal card editorial rework
- [ ] Splits row softening
- [ ] FAB → frosted glass bottom pill
- [ ] Ops sheet inherits new system
- [ ] Race map peek treatment (post-V2 if scope creeps)
