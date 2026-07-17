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

Contact form submissions use `api/contact-messages.ts` (`POST /api/contact-messages`) with a
`subject` enum that routes inquiries to the right admin queue.

Auth uses `api/auth.ts`: `POST /auth/login` stores a bearer token in `localStorage`
(`lib/auth-session.ts`); `GET /auth/session` returns `{ email, hasAcademyMembership }`.
Mock accounts: `lucas.baumgartner@gmail.com` (logged in, with membership) — password `dspmp`;
`demo@datenschutzpartner.ch` (logged in, no membership) — password `demo`.

## Member area («Mein Konto»)

The authenticated hub at `/account` reads from three domain modules:

- `api/account.ts` — dashboard snapshot, profile, addresses (full CRUD), password
  change. `GET /account/snapshot` feeds the **Overview** dashboard: membership summary,
  next live session timestamp, document count, and optional EU Rep inquiry allowance
  (`euRepInquiryAllowance`: included/used counts + further-inquiry price). The **Account details** section splits into **Profile** (name, email,
  password) and **Payment Details** (`PaymentDetailsSection`) — the member's saved
  addresses and payment methods, laid out in the same section/column/divider style as
  the Academy membership screen. Addresses carry an optional `label` (e.g. "Head
  office") and an optional `vatId` shown on invoices; there is no more upsert-by-type —
  a member can save several `type: 'billing'` addresses and pick freely between them.
- `api/billing.ts` — subscriptions (+ cancel), memberships, orders, payment methods
  (full CRUD). Orders for the Privacy Policy Generator may include `siteCount`; EU Rep
  orders use `orderKind` (`subscription` | `extraInquiry`). Subscriptions expose
  optional `planId` for plan-specific terms in the member UI, and optional
  `paymentMethodId` / `billingAddressId` linking to the card/address used for that one
  subscription (`PATCH /billing/subscriptions/:id/billing`).
- `api/documents.ts` — the generated-document inventory plus the Privacy Policy
  Generator plan (`useGeneratorPlan` → `GET /generator/plan`, `{ siteAllowance }`). The
  generator is **not** a subscription: a member buys an allowance of websites and every
  generated policy consumes one, so the member area derives "used" from the document
  count and shows the remaining allowance. Generated documents may include optional
  `siteUrl` and `updateAvailableSince` for the Overview attention list. The "Generated Policies" tab
  (`DocumentsSection`) surfaces this as two summary cards (allowance + generated count)
  above the document list; the "Payments" tab (`GeneratorPaymentsPanel`) shows the policy
  billing history and billing details.

### Per-product billing selection vs. management

Members may have **different saved cards/addresses per product** (Privacy Policy
Generator, Academy, EU Rep) — each `Subscription` independently points at one
`paymentMethodId` and one `billingAddressId`. Two distinct UI surfaces implement this
split:

- **Selection, in each product's billing panel** (`AcademyMembershipPanel`'s "Change" /
  "Edit" links, `SubscriptionPanel`'s equivalents for EU Rep) — opens
  `BillingSelectionDialog` (`app/account/_components/BillingSelectionDialog.tsx`), a
  modal listing the member's saved payment methods or billing addresses as selectable
  cards. Confirming calls `useUpdateSubscriptionBilling` to re-point that one
  subscription. The dialog includes a "Manage cards & addresses in Payment Details"
  link that navigates to Account details → Payment Details — it never creates, edits,
  or deletes records itself.
- **CRUD, only in Payment Details** (`PaymentDetailsSection`) — lists payment methods
  and billing addresses as HeroUI `Card`s in a vertical list; "New Method" / "New
  address" and each card's edit icon open a `Modal` dialog form (`react-hook-form` +
  `zodResolver`, schemas `paymentMethodCreateInputSchema` /
  `paymentMethodUpdateInputSchema` / `addressInputSchema`); delete goes through the
  shared `ConfirmDialog`. This is the **only** place members can create, edit, or
  delete cards and addresses.

#### Payrexx (payment service provider)

The client will use [Payrexx](https://www.payrexx.com/) for card tokenization and
recurring charges. **PAN and CVV must never be stored** — only a Payrexx alias/token
(`PaymentMethod.externalId`, `provider: 'payrexx'`).

| Phase          | Create card flow                                                                   | API                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **POC (now)**  | Dialog collects full card fields; MSW derives `last4`/`brand` and discards PAN/CVV | `POST /billing/payment-methods` with `paymentMethodCreateInputSchema`                                                                          |
| **Production** | Dialog opens Payrexx widget / hosted page; frontend sends token only               | `POST /billing/payment-methods/payrexx-session` → `{ checkoutUrl }`, then `POST /billing/payment-methods/from-payrexx` with `{ payrexxToken }` |

Hooks are already in `api/billing.ts`: `usePayrexxPaymentMethodSession`,
`useCreatePaymentMethodFromPayrexx`. MSW stubs both production endpoints. At handover
the backend team implements the real Payrexx API calls; the drawer UI swaps from raw
fields to the Payrexx embed without touching list/selection components.

Subscriptions/memberships/orders are gated on the bearer token in `mocks/handlers.ts`:
the member token (`lucas.baumgartner@gmail.com`) sees an active subscription +
membership; the `demo@` token sees the empty states. Addresses and payment methods are
shared across mock accounts (not gated). The shell renders client-side; `AccountApp`
redirects unauthenticated visitors to `/login`, and the current password for the mock
change-password endpoint is `dspmp`.

## Future API replacement

Only `api/client.ts` and `mocks/` change at handover:

- Generate the client from the backend OpenAPI schema (`@hey-api/openapi-ts`).
- Replace `request()` internals; delete `mocks/`.
- Domain modules keep their signatures; **components do not change.** If they would, the
  data seam was bypassed — fix that.
