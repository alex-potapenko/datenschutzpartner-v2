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
- **Academy membership promo** — `AcademyMembershipPromoBanner` in `components/shared/` (`variant`: `horizontal` | `vertical`; `sessionType`: `all` | `webinars` | `newsQuestions`). Copy lives in `academy.membershipPromo`.
- **Navigation links** — accent inline links with optional chevron (`left` | `right` | `none`), underline on hover, and size (`default` | `sm`) use `NavigationLink` in `components/shared/NavigationLink.tsx` (`href`, `onPress`, or `as="span"` inside a larger clickable card).
- **Page shells stretch vertically** — `body` is a `min-h-dvh` flex column; `RegularPage` and bespoke route layouts use `flex-1` on `main` so short pages fill the viewport between TopBar and Footer.
- **Body text is dark by default** — use `text-foreground` for all body copy. `text-muted` is reserved for explicitly secondary content (captions, helper text, timestamps, metadata). Never use `text-muted` as the default for regular paragraphs or list items.
- **Outline buttons use accent (blue) content** — label, icon, and caret inside `variant="outline"` buttons must render in `--accent`, not `--foreground` or HeroUI's default gray. This is enforced globally in `app/globals.css` (`.button--outline { --button-fg: var(--accent) }`). Custom outline links that are not `<Button>` must reuse the same HeroUI classes (`button button--outline`) or set `color: var(--accent)` explicitly. **Exception:** outline buttons on the accent TopBar bar opt out with `text-white` because they sit on a blue background.
- **FAQ answers are one text node** — Academy and EU Rep FAQ copy may use blank lines (`\n\n`) in `messages/*.json` to separate paragraphs. Render answers as a single element with `whitespace-pre-line`, `text-base`, and `leading-relaxed` (`text-foreground`). Do not split answers into multiple `<p>` tags.
- **Member-area sections** — use `AccountSection` in `app/account/_components/account-ui.tsx` for the account split/stack layouts. `size="default"` (`p-8`, large title) for the main column; `size="small"` (`p-6`, uppercase eyebrow) for the sidebar. Pass optional `icon`, header `action` (button/link), and `titleAside` (e.g. status pill). Override spacing with `className` / `contentClassName` when a panel needs tighter gaps (profile, payment methods).

## Typography

- **Body / UI default:** Geist (`--font-geist-sans` via `next/font/google`) — paragraphs, forms, most interface copy.
- **Display / accent:** Geometos Neue (`next/font/local` → `--font-geometos-neue`, utility `font-display`, global `h1`–`h3`) — headlines, nav labels, buttons, and selected emphasis lines. Font file: `public/fonts/GeometosNeueBold.ttf` (bold only, mapped across the full weight range) (must be present in the repo).

## Animation

Use `motion/react` for transitions HeroUI/CSS can't express (page, tab, list enter/exit). Animations live in `'use client'` leaves only. Always respect `prefers-reduced-motion` — gate non-essential motion behind `useReducedMotion()` from `motion/react`.

In-page anchor navigation (`href="#…"`) uses native smooth scrolling via `scroll-behavior: smooth` on `html` (also gated by `prefers-reduced-motion`).

## Theming a client project

Edit `styles/tokens.css` only — replace the `--key-*` ramp with the client's brand color.
Nothing else should reference raw colors, so this re-themes the whole app.
