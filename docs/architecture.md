# Architecture

Stack is fixed — see `AGENTS.md`.

## Project structure

| Path                    | Responsibility                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/academy/`          | Marketing-only Academy landing page; all Academy access continues on the external platform.                                                                              |
| `app/news/`             | News listing and article routes.                                                                                                                                         |
| `app/podcasts/`         | Podcast listing and episode routes.                                                                                                                                      |
| `app/insights/`         | Legacy redirects plus shared article presentation components.                                                                                                            |
| `app/eu-rep/`           | EU representation landing page and the Art. 27 GDPR questionnaire (`/eu-rep/questionnaire`).                                                                             |
| `app/scan/`             | Privacy policy generator landing page (`/scan`) with an on-page FAQ section (`#faq`); linked from the result wizard top bar.                                             |
| `app/account/`          | Authenticated member area (`/account`, «Mein Konto»); client-side section switching (`?section=`) over a persistent sidebar shell. Trial payment is `/account/checkout`. |
| `app/verify-email/`     | Double opt-in confirmation after the generator welcome step (`/verify-email?token=`).                                                                                    |
| `components/ui/`        | Local seam over HeroUI and Phosphor icons — the only place that imports `@heroui/*` or `@phosphor-icons/*`.                                                              |
| `components/shared/`    | Reusable composed components used across features (`RegularPage` for full-width text routes with separate header slot).                                                  |
| `api/`                  | Server-data domain modules (zod schema → type → TanStack Query hooks).                                                                                                   |
| `mocks/`                | MSW handlers = the draft API contract; persistent in the browser.                                                                                                        |
| `store/`                | Zustand stores — client UI state only.                                                                                                                                   |
| `styles/tokens.css`     | Brand design tokens. Re-theme the whole app here.                                                                                                                        |
| `content/legal/`        | Authoritative German legal copy (imprint, privacy, terms) rendered as static pages.                                                                                      |
| `content/insights/`     | Optional markdown bodies for insight articles (`{slug}.{locale}.md`).                                                                                                    |
| `lib/insights-content/` | Static insight articles (updates, podcasts); the newsletter tab is subscription UI only. Tab-aware prev/next helpers.                                                    |
| `lib/academy-content/`  | Landing constants, including the external Academy URL and feature keys.                                                                                                  |
| `messages/`             | next-intl translations (de/en, default `de`).                                                                                                                            |
| `docs/`                 | This documentation set.                                                                                                                                                  |

## Key technical decisions

- **Server state lives in TanStack Query, not in stores.** Stores hold UI state only.
- **Components never fetch or touch mock data directly** — always through `api/` modules.
- **Mocks are durable** in the browser (localStorage) so prototypes keep state across reloads.
- **Future backend integration:** replace `api/client.ts` internals with a generated OpenAPI
  client and delete `mocks/` — components must not change. See [data-layer.md](data-layer.md).
