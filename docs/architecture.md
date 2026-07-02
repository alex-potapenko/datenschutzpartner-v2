# Architecture

Stack is fixed — see `AGENTS.md`.

## Project structure

| Path                    | Responsibility                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `app/academy/`          | Academy landing page, past sessions archive (`/academy/past-sessions`), and member content.                                       |
| `components/ui/`        | Local seam over HeroUI and Phosphor icons — the only place that imports `@heroui/*` or `@phosphor-icons/*`.                       |
| `components/shared/`    | Reusable composed components used across features (`RegularPage` for full-width text routes with separate header slot).           |
| `api/`                  | Server-data domain modules (zod schema → type → TanStack Query hooks).                                                            |
| `mocks/`                | MSW handlers = the draft API contract; persistent in the browser.                                                                 |
| `store/`                | Zustand stores — client UI state only.                                                                                            |
| `styles/tokens.css`     | Brand design tokens. Re-theme the whole app here.                                                                                 |
| `content/legal/`        | Authoritative German legal copy (imprint, privacy, terms) rendered as static pages.                                               |
| `content/insights/`     | Optional markdown bodies for insight articles (`{slug}.{locale}.md`).                                                             |
| `content/academy/`      | Markdown bodies for Datenschutz Academy articles (`{slug}.{locale}.md`).                                                          |
| `lib/insights-content/` | Static insight data (webinars, news & questions, podcasts) with tab-aware prev/next helpers.                                      |
| `lib/academy-content/`  | Academy helpers for webinars and News & Questions; content is derived from `lib/insights-content/` so both surfaces stay in sync. |
| `messages/`             | next-intl translations (de/en, default `de`).                                                                                     |
| `docs/`                 | This documentation set.                                                                                                           |

## Key technical decisions

- **Server state lives in TanStack Query, not in stores.** Stores hold UI state only.
- **Components never fetch or touch mock data directly** — always through `api/` modules.
- **Mocks are durable** in the browser (localStorage) so prototypes keep state across reloads.
- **Future backend integration:** replace `api/client.ts` internals with a generated OpenAPI
  client and delete `mocks/` — components must not change. See [data-layer.md](data-layer.md).
