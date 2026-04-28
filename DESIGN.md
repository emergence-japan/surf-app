# Design System — Wave Forecast App
## Inspired by Nike × Surf

Adapted from the Nike Podium CDS. Monochromatic white-first canvas where
ocean photography and wave-quality color do all the expressive work.
Nike Black → replaced with Ocean Ink for text. Nike Red accent → Ocean Cyan.

---

## 1. Visual Theme & Atmosphere

Clean white canvas (`#FFFFFF`, `#FAFAFA`) with deep ocean-ink text (`#0d1b2a`).
The UI stays achromatic so hero surf photography and wave-quality badges
(Cyan A/B, Amber S, Slate C/D) carry all the color energy.

Full-bleed hero photography with no border radius. Pill buttons (30px).
Flat elevation — no card shadows, depth through grey surface shifts only.
Massive uppercase display headlines (clamp 48–80px, line-height 0.90) punching
through hero images like a wave report on a beach sign.

**Key Characteristics:**
- White canvas (`#FFFFFF`) + ocean-ink text (`#0d1b2a`)
- Ocean Cyan (`#06b6d4`) as the sole UI accent — CTAs, active states, links
- Barlow Condensed (Google Fonts) for display headlines — condensed, athletic
- Inter (Google Fonts) for all body / UI text
- Full-bleed hero photography, no border radius on images
- Pill buttons (30px radius), flat cards (0 shadow, 1px border `#CACACB`)
- 8px spacing grid, mobile-first responsive

---

## 2. Color Palette

### Primary
- **Ocean Ink** (`#0d1b2a`): Primary text, headings, nav. Deep navy-black.
- **White** (`#FFFFFF`): Page background, card surface, button text on dark.

### Surfaces
- **Snow** (`#FAFAFA`): Section backgrounds, subtle surface tint.
- **Light Gray** (`#F5F5F5`): Search input fill, skeleton placeholder.
- **Hover Gray** (`#E5E5E5`): Hover backgrounds, disabled fills.
- **Border** (`#CACACB`): Card borders, input borders, dividers.

### Text
- **Primary** (`#0d1b2a`): Headings, nav, card titles.
- **Secondary** (`#707072`): Metadata, captions, muted labels.
- **Disabled** (`#9E9EA0`): Inactive elements.

### Accent — Ocean Cyan
- **Cyan 500** (`#06b6d4`): Primary CTA background, active badge highlight.
- **Cyan 600** (`#0891b2`): Hover state on cyan buttons.
- **Cyan 100** (`#cffafe`): Subtle cyan surface for badge backgrounds.
- **Cyan Text** (`#164e63`): Text on cyan-tinted surfaces.

### Wave Quality Badges
- **S · EPIC**: `from-amber-400 to-orange-500` — warm gold
- **A · GREAT**: `from-cyan-500 to-sky-400` — ocean cyan
- **B · GOOD**: `from-emerald-500 to-teal-400` — sea green
- **C · FAIR**: `from-slate-400 to-slate-500` — grey
- **D · POOR**: `from-slate-300 to-slate-400` — light grey

### Semantic
- **Error** (`#D30005`): Errors, critical alerts.
- **Success** (`#007D48`): Positive states.
- **Warning** (`#FEDF35`): Attention banners.
- **Focus Ring** (`rgba(6,182,212,0.5)`): Keyboard focus — cyan tint.

---

## 3. Typography

### Fonts (Google Fonts)
- **Display**: `Barlow Condensed`, weight 700–800, uppercase — hero headlines
- **Body / UI**: `Inter`, weight 400/500 — all UI text

### Scale
| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Display Hero | clamp(48px,8vw,80px) | 700 | 0.90 | Barlow Condensed, uppercase |
| Heading 1 | 32px | 600 | 1.20 | Inter, section titles |
| Heading 2 | 24px | 600 | 1.20 | Inter, card group titles |
| Card Title | 18px | 500 | 1.40 | Inter, spot names |
| Body | 16px | 400 | 1.75 | Inter, descriptions |
| Caption | 14px | 500 | 1.50 | Inter, metadata, stats |
| Small | 12px | 500 | 1.50 | Inter, badges, counts |
| Micro | 11px | 700 | 1.00 | Inter, uppercase badge labels |

---

## 4. Components

### Buttons
**Primary (Cyan)**
- Background: `#06b6d4`, Text: `#FFFFFF`, radius: 30px, padding: 12px 24px
- Hover: `#0891b2`

**Primary (Dark)**
- Background: `#0d1b2a`, Text: `#FFFFFF`, radius: 30px
- Hover: `#707072`

**Secondary (Outlined)**
- Background: transparent, Border: 1.5px `#CACACB`, radius: 30px
- Text: `#0d1b2a`, Hover border: `#707072`

### Cards (Spot Cards)
- Background: `#FFFFFF`
- Border: 1px `#CACACB` — visible, flat
- Border radius: 12px
- Shadow: none
- Top accent bar: 3px gradient per quality grade
- Hover: border darkens to `#707072` (no lift)

### Search Input
- Background: `#F5F5F5`
- Border radius: 30px (pill)
- Padding: 12px 16px 12px 48px
- Focus: border `#06b6d4`, focus ring `rgba(6,182,212,0.4)`

### Hero Section
- Full-bleed photography, no border radius
- Dark gradient scrim bottom: `from-transparent to-white` for card section transition
- Display headline uppercase Barlow Condensed over image

---

## 5. Layout & Responsive

### Breakpoints
| Name | Width | Grid |
|------|-------|------|
| Mobile | <640px | 1 column, 16px padding |
| Tablet | 640–1024px | 2 columns, 24px padding |
| Desktop | >1024px | 3 columns, 48px padding |

### Spacing (8px grid)
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80px

### Touch Targets
- Minimum 44×44px
- Card: full surface tappable

---

## 6. Do's and Don'ts

### Do
- Keep UI achromatic (white, grays, ocean-ink) — let badges and photos be the color
- Use Cyan only for primary CTAs and active states
- Full-bleed hero photo, no border radius on images
- Barlow Condensed uppercase for display only (≥ 32px)
- Flat cards — no shadows

### Don't
- Don't add card box-shadows
- Don't use Barlow Condensed below 32px
- Don't add hover lift (-translate-y) on cards — border darkening only
- Don't use colored backgrounds on UI elements (badges excepted)
- Don't round hero photography
