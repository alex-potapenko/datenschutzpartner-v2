# mp-frontend

mühlemann+popp frontend template — for clickable prototypes that hand over to production
without refactoring.

**Stack**: Next.js (App Router) · React · TypeScript strict · Tailwind v4 · HeroUI v3 ·
TanStack Query · Zustand · react-hook-form + zod · MSW · next-intl (de/en/fr) · vitest ·
Playwright (+axe) · lefthook · pnpm

## Start a new project

```bash
npx degit muehlemann-popp/frontend-template my-app --mode=git
cd my-app
git init && pnpm install   # installs git hooks via lefthook automatically
pnpm dev                    # runs fully on mocks — no backend needed
```

Or use the `mp-frontend-template` Claude Code skill, which does this for you.

## The 60-second tour

| Path                | What it is                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| `styles/tokens.css` | Brand tokens — re-brand the whole app by editing this one file         |
| `components/ui/`    | Local seam over HeroUI — the only place allowed to import `@heroui/*`  |
| `api/contacts.ts`   | Canonical API domain module: zod schema → types → TanStack Query hooks |
| `mocks/handlers.ts` | The mock API = the draft backend contract; also serves the tests       |
| `app/contacts/`     | Example feature wiring everything together                             |
| `AGENTS.md`         | Conventions for coding agents (Claude Code & Cursor both read it)      |

## Quality gates

- `pnpm verify` — lint (type-aware + a11y + layer rules) · format · typecheck · tests
- `pnpm verify:full` — adds production build + Playwright smoke with axe a11y scan
- lefthook: lint/format on commit, typecheck/tests on push, stage-aware main-branch guard

## Stage model

`package.json → mp.stage` is `poc` (presales: free git workflow, full mocks) until you run
`task promote`, which flips to `production` (branch discipline enforced by hooks) and prints
the handover checklist (Renovate, branch protection, Sentry, real API client).
