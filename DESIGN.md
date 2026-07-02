# Design Brief

## Direction

Bubba's 33 Roadhouse — a bold red-and-black staff training app for a roadhouse kitchen, dark-first and mobile-first for staff on phones.

## Tone

High-energy roadhouse grit: near-black canvas, fire-engine red primary, gold spark — condensed display type and uppercase labels that read like a neon sign at the door.

## Differentiation

A pure-black top bar with the tall Anton wordmark, a red-to-deep-red gradient banner, and a circular B33 splash emblem — unmistakably a roadhouse, never a generic admin panel.

## Color Palette

| Token      | OKLCH            | Hex        | Role                                       |
| ---------- | ---------------- | ---------- | ------------------------------------------ |
| background | 0.14 0.005 70    | #141412    | near-black warm page canvas                |
| foreground | 0.96 0.012 80    | #F5F1E8    | warm off-white headings/body text          |
| card       | 0.2 0.005 75     | #1E1E1B    | lifted dark surface for cards/panels       |
| primary    | 0.6 0.24 27      | #E4002B    | fire-engine red — CTAs, active, brand      |
| primary-h  | 0.5 0.21 27      | #B00020    | hover/pressed deep red (gradient end)      |
| accent     | 0.79 0.17 75     | #F2A900    | gold — secondary highlights, outline btns  |
| muted      | 0.24 0.005 75    | —          | quiet surfaces                             |
| muted-fg   | 0.66 0.008 80    | #9A9A92    | muted captions, meta text                  |
| topbar     | 0 0 0            | #000000    | pure black header/admin sidebar            |

## Typography

- Display: Anton — wordmark, hero, position names (all-caps, tight tracking)
- Heading: Oswald 600-700 — section headings, button labels, card titles (uppercase)
- Body: Barlow — UI labels, body copy, table text, instructions
- Scale: hero `text-5xl md:text-7xl font-display uppercase tracking-tight`, h2 `text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight`, label `text-xs font-heading font-semibold tracking-widest uppercase`, body `text-base lg:text-lg font-body`

## Elevation & Depth

Layered darkness: cards lift on `shadow-card`, hover to `shadow-elevated`; neutral black-tinted shadows (rgba 0,0,0) instead of warm tints so depth reads on dark surfaces.

## Structural Zones

| Zone          | Background         | Border              | Notes                                       |
| ------------- | ------------------ | ------------------- | ------------------------------------------- |
| Top bar       | `bg-topbar` (#000) | `border-b border-border` | Anton wordmark + staff login; sticky        |
| Hero/banner   | `bg-gradient-primary` | —               | red→deep-red gradient with B33 emblem       |
| Content       | `bg-background`    | —                   | alternate `bg-muted/30` per section          |
| Footer        | `bg-topbar`        | `border-t`          | quiet copyright + roadhouse tagline          |
| Admin sidebar | `bg-sidebar` (#000) | `border-r`        | vertical nav, red active state               |
| Admin content | `bg-background`    | —                   | tables + forms on `bg-card` panels          |
| Card          | `bg-card`          | `border`             | photo area + red footer bar with Oswald title |

## Spacing & Rhythm

Mobile-first: section gaps `py-12 md:py-20`, card padding `p-4 md:p-6`, grid gaps `gap-4 md:gap-6`; micro-spacing `space-y-2` for ingredient/instruction lists.

## Component Patterns

- Buttons: `rounded-md`, `bg-primary text-primary-foreground`, Oswald uppercase labels; hover deepens via gradient; gold outline button for secondary actions
- Cards: `rounded-lg bg-card shadow-card border`, image area dominates (4:3 position), red `bg-primary` footer bar with Oswald name + Barlow category count
- Badges: `rounded-full bg-secondary text-secondary-foreground` for category tags; `bg-primary` for "Training" pill; `bg-accent text-accent-foreground` for gold accents
- Position card: 4:3 cover photo or initial-letter placeholder, red footer bar, "START TRAINING" CTA

## Motion

- Entrance: cards `animate-fade-in` staggered; modal/recipe view `animate-scale-in`
- Hover: card lifts (`shadow-elevated`) + image subtle scale over `transition-smooth`
- Decorative: none — no animated route transitions, no sound effects (per doNotBuild)

## Constraints

- All colors via OKLCH CSS custom properties; admin theme-customization overrides `--primary`, `--accent`, `--font-display`, `--font-body` at runtime on `:root`
- No raw hex or named colors in components; tokens only
- Dark-first: `:root` and `.dark` carry the SAME roadhouse palette
- Fonts: Anton + Oswald + Barlow only — explicitly NOT Inter, Roboto, Arial, or generic system fonts
- Mobile-first: staff use phones; optimize for one-column layouts and thumb reach
- Visual/branding pass only — no data-model, role, quiz, or logic changes

## Signature Detail

The pure-black top bar holding the tall all-caps Anton "BUBBA'S 33" wordmark with a gold accent dot — a neon-sign treatment that makes every screen read as the roadhouse door, paired with a circular B33 splash emblem in the hero.
