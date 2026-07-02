# Design Principles

## Rules

- **Tokens only.** Colors/spacing come from `styles/tokens.css` (the `--key-*` ramp) via
  Tailwind utilities or HeroUI semantic variables. Never hardcode hex/rgb.
- **Layering.** Build from `@/components/ui` primitives → `components/shared/` → route
  `_components/`. Add a HeroUI primitive to `components/ui/` before using it elsewhere.
  Import icons from `@/components/ui` (the icon seam over Phosphor) — never `@phosphor-icons/*` directly.
- **Every interactive feature has all states:** loading, empty, error (with retry), disabled.
- **Translated text only** — no hardcoded user-facing strings (next-intl, default `de`).
- **Accessibility is required** — labelled fields, real button/link semantics, keyboard
  reachable. CI runs an axe scan that fails on serious/critical issues.
- **Responsive**, mobile-first; verify narrow and wide.
- **Body text is dark by default** — use `text-foreground` for all body copy. `text-muted` is reserved for explicitly secondary content (captions, helper text, timestamps, metadata). Never use `text-muted` as the default for regular paragraphs or list items.

## Typography

- **Body / UI default:** Geist (`--font-geist-sans` via `next/font/google`) — paragraphs, forms, most interface copy.
- **Display / accent:** Geometos Neue (`next/font/local` → `--font-geometos-neue`, utility `font-display`, global `h1`–`h3`) — headlines, nav labels, buttons, and selected emphasis lines. Font file: `public/fonts/GeometosNeueBold.ttf` (bold only, mapped across the full weight range) (must be present in the repo).

## Animation

Use `motion/react` for transitions HeroUI/CSS can't express (page, tab, list enter/exit). Animations live in `'use client'` leaves only. Always respect `prefers-reduced-motion` — gate non-essential motion behind `useReducedMotion()` from `motion/react`.

## Theming a client project

Edit `styles/tokens.css` only — replace the `--key-*` ramp with the client's brand color.
Nothing else should reference raw colors, so this re-themes the whole app.
