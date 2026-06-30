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

## Animation

Use `motion/react` for transitions HeroUI/CSS can't express (page, tab, list enter/exit). Animations live in `'use client'` leaves only. Always respect `prefers-reduced-motion` — gate non-essential motion behind `useReducedMotion()` from `motion/react`.

## Theming a client project

Edit `styles/tokens.css` only — replace the `--key-*` ramp with the client's brand color.
Nothing else should reference raw colors, so this re-themes the whole app.
