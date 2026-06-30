# Architecture

Stack is fixed — see `AGENTS.md`.

## Project structure

| Path                 | Responsibility                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `app/`               | Routes (Server Components by default). Route-private UI in `app/<route>/_components/`.                      |
| `components/ui/`     | Local seam over HeroUI and Phosphor icons — the only place that imports `@heroui/*` or `@phosphor-icons/*`. |
| `components/shared/` | Reusable composed components used across features.                                                          |
| `api/`               | Server-data domain modules (zod schema → type → TanStack Query hooks).                                      |
| `mocks/`             | MSW handlers = the draft API contract; persistent in the browser.                                           |
| `store/`             | Zustand stores — client UI state only.                                                                      |
| `styles/tokens.css`  | Brand design tokens. Re-theme the whole app here.                                                           |
| `messages/`          | next-intl translations (de/en/fr).                                                                          |
| `docs/`              | This documentation set.                                                                                     |

## Key technical decisions

- **Server state lives in TanStack Query, not in stores.** Stores hold UI state only.
- **Components never fetch or touch mock data directly** — always through `api/` modules.
- **Mocks are durable** in the browser (localStorage) so prototypes keep state across reloads.
- **Future backend integration:** replace `api/client.ts` internals with a generated OpenAPI
  client and delete `mocks/` — components must not change. See [data-layer.md](data-layer.md).
