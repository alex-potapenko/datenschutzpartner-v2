# Data Layer

## Flow

```
Component → api/ hook (TanStack Query) → request() → MSW handler → persistent mock store
```

Forbidden: a component calling `fetch` or importing mock data directly.

## Add a new entity (copy `api/contacts.ts`)

1. Define the zod schema — it is the source of truth for the **type** and **form validation**.
2. Export `useX()` / `useCreateX()` hooks (TanStack Query) calling `request()`.
3. Add matching handlers in `mocks/handlers.ts` with seed data via `createCollection`.

The mock you write **is** the API contract the backend team will implement.

## Future API replacement

Only `api/client.ts` and `mocks/` change at handover:

- Generate the client from the backend OpenAPI schema (`@hey-api/openapi-ts`).
- Replace `request()` internals; delete `mocks/`.
- Domain modules keep their signatures; **components do not change.** If they would, the
  data seam was bypassed — fix that.
