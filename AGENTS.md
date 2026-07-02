# mp-frontend — agent instructions

mühlemann+popp frontend template. Next.js App Router + TypeScript strict + Tailwind v4 + HeroUI v3 + Phosphor icons + motion (animation) + next-themes (dark mode).
These rules apply to every coding agent (Claude Code, Cursor, …) and every role (designer, developer).

## Documentation map — read the relevant doc before implementing

This file is the entry point. For depth, read the focused doc, not the whole codebase:

- Need a system overview / project structure? → [`docs/architecture.md`](docs/architecture.md)
- Need to add an entity, a form, or wire data? → [`docs/data-layer.md`](docs/data-layer.md)
- Building or theming UI? → [`docs/design-principles.md`](docs/design-principles.md)

When you add or change a feature, update the affected `docs/*.md` in the same change —
documentation is part of the deliverable, not an afterthought.

## Commands

| Command            | Purpose                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `pnpm dev`         | Dev server (MSW mocks auto-enabled via `.env.development`)                         |
| `pnpm verify`      | The gate: lint + format check + typecheck + tests. Run before declaring work done. |
| `pnpm verify:full` | verify + production build + Playwright smoke (incl. a11y scan)                     |
| `task promote`     | Flip `poc` → `production` stage (activates git guardrails; prints checklist)       |

Use **pnpm** only. Node version is pinned in `.nvmrc`.

## Project stage

`package.json` → `"mp": { "stage": "poc" | "production" }`.

- **poc** (presales prototype): work directly on `main` is fine, history may be rewritten, app runs fully on MSW mocks.
- **production**: never commit to `main` (hooks block it). Branch as `design/<topic>` or `feature/<topic>`, sync first (`git pull --rebase`), open PRs.

## Architecture rules (enforced where possible)

1. **UI components**: import primitives and icons from `@/components/ui` — never from `@heroui/*` or `@phosphor-icons/*` directly (lint enforces this). Composed reusable components go in `components/shared/`; feature/route-specific components in `app/<route>/_components/`.
2. **Colors & tokens**: never hardcode colors. The brand ramp lives in `styles/tokens.css` (`--key-*`); use Tailwind utilities (`bg-key-500`) or HeroUI semantic variables. Re-branding a client project = editing `styles/tokens.css` only.
3. **Server state**: TanStack Query, in domain modules under `api/` (see `api/contacts.ts` as the canonical example: zod schema → type → query keys → hooks). Never fetch in components or stores.
4. **Client state**: Zustand + immer in `store/`, one file per domain — UI state only, no server data.
5. **API contract**: every endpoint exists twice and must stay in sync: typed functions in `api/` and MSW handlers in `mocks/handlers.ts`. The mock IS the draft API contract for the backend team.
6. **Forms**: react-hook-form + zodResolver; validation schemas come from the `api/` domain module; error messages are i18n keys.
7. **Text**: no hardcoded user-facing strings — everything through next-intl (`messages/de.json`, `messages/en.json`, default `de`).
8. **Env vars**: only via `env.ts` (zod-validated). Never `process.env` in app code.
9. **Server Components by default**; add `'use client'` only at interactive leaves. Every route group keeps `error.tsx` / `loading.tsx` working.
10. **Accessibility is non-negotiable**: labelled fields, real buttons/links, keyboard reachable. CI runs an axe scan; serious/critical violations fail.

## Adding things

- **New API domain**: copy `api/contacts.ts` structure + add matching handlers in `mocks/handlers.ts` + seed data.
- **New page**: folder under `app/`, server component `page.tsx`, interactive parts in `_components/`.
- **New reusable component**: `components/shared/`, built from `@/components/ui` primitives + Tailwind utilities with token-based colors.
- **Tests**: colocate `*.test.tsx` next to the component; use `renderWithProviders` from `tests/test-utils.tsx`. MSW handlers serve the tests automatically.

## Handover (poc → production)

Run `task promote` and complete the printed checklist: branch protection, Renovate app, Sentry wiring (in `app/error.tsx` / `app/global-error.tsx`), real API base URL, generate the client from the backend OpenAPI schema (`@hey-api/openapi-ts`), delete `mocks/handlers.ts`. Components must not change during this swap — if they do, the api/ layer was bypassed somewhere.

On a new project, record third-party services that aren't evident from the code — deployment target, DNS, error tracking, analytics — so agents don't have to rediscover them.
