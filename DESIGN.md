# Design Brief

## Direction

Warm Kitchen Editorial — a photo-forward menu and staff training app with a terracotta-and-sage palette on warm cream, where food photography is the hero.

## Tone

Editorial warmth: cream canvas, characterful serif headings, generous imagery — appetizing on the storefront, the same brand carried into a functional (not cold) admin.

## Differentiation

Food photos lead every card; the warm cream canvas makes plates pop, and the admin shares the identical warm identity so the back-office feels like the same kitchen.

## Color Palette

| Token      | OKLCH (light)    | OKLCH (dark)     | Role                                  |
| ---------- | ---------------- | ---------------- | ------------------------------------- |
| background | 0.965 0.012 75   | 0.16 0.012 55    | warm cream / warm charcoal canvas     |
| foreground | 0.2 0.025 50     | 0.92 0.012 60    | deep warm ink / warm off-white text   |
| card       | 0.985 0.008 75   | 0.2 0.015 55     | slightly lifted surface               |
| primary    | 0.55 0.14 32     | 0.72 0.15 55     | terracotta / warm amber — CTAs, active |
| accent     | 0.5 0.09 160     | 0.6 0.1 160      | muted sage — secondary highlights     |
| muted       | 0.93 0.015 75    | 0.24 0.018 55    | quiet surfaces, captions               |
| sidebar    | 0.985 0.008 75   | 0.2 0.015 55     | admin navigation surface               |

## Typography

- Display: Fraunces — headings, category names, dish names, wordmark
- Body: DM Sans — UI labels, body copy, table text, instructions
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-5xl font-bold tracking-tight`, label `text-sm font-semibold tracking-widest uppercase`, body `text-base lg:text-lg`

## Elevation & Depth

Layered warmth: cards lift on `shadow-card`, hover to `shadow-elevated`; warm-tinted shadows (rgba 60,40,20) instead of default grey so depth reads as part of the kitchen palette.

## Structural Zones

| Zone          | Background         | Border              | Notes                                       |
| ------------- | ------------------ | ------------------- | ------------------------------------------- |
| Header        | `bg-card`          | `border-b`          | wordmark + staff login; sticky on storefront |
| Content       | `bg-background`    | —                   | alternate `bg-muted/30` per section          |
| Footer        | `bg-muted/40`      | `border-t`          | quiet copyright + brand                     |
| Admin sidebar | `bg-sidebar`      | `border-r`          | vertical nav, terracotta active state        |
| Admin content | `bg-background`    | —                   | tables + forms on `bg-card` panels          |

## Spacing & Rhythm

Generous: section gaps `py-16 md:py-24`, card padding `p-5 md:p-6`, grid gaps `gap-6`; micro-spacing `space-y-2` for ingredient/instruction lists.

## Component Patterns

- Buttons: rounded-md, `bg-primary text-primary-foreground`, hover lifts shadow; sage accent for secondary actions
- Cards: `rounded-xl bg-card shadow-card border`, image area dominates (16:10 category, square item)
- Badges: `rounded-full bg-secondary text-secondary-foreground` for category tags; terracotta for "Training" pill
- Recipe card: small square photo left, ingredients + numbered instructions right, prominent "Start Training" CTA

## Motion

- Entrance: cards `animate-fade-in` staggered; modal/recipe view `animate-scale-in`
- Hover: card lifts (`shadow-elevated`) + image subtle scale over `transition-smooth`
- Decorative: none — food photography carries the visual weight

## Constraints

- All colors via OKLCH CSS custom properties; admin theme-customization overrides `--primary`, `--accent`, `--font-display`, `--font-body` at runtime on `:root`
- No raw hex or named colors in components; tokens only
- Both light and dark themes fully supported and contrast-tuned
- Food photos are the focal element — never cover them with heavy overlays

## Signature Detail

Terracotta-tinted photo overlays on category cards that fade from transparent to a warm gradient bar holding the serif category name — a magazine-cover treatment that makes every category tile read like a cookbook cover.
