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
  (`euRepInquiryAllowance`: included/used counts + further-inquiry price). The **Account Details** section splits into **Profile** (name, email,
  password) and **Billing Addresses** (`PaymentDetailsSection`) — the member's saved
  billing addresses, laid out in the same section/column/divider style as the Academy
  membership screen. Addresses carry an optional `label` (e.g. "Head office") and an
  optional `vatId` shown on invoices; there is no more upsert-by-type — a member can
  save several `type: 'billing'` addresses and pick freely between them.
- `api/billing.ts` — subscriptions (+ cancel), memberships and orders. Orders for the
  Privacy Policy Generator may include `siteCount`; EU Rep orders use `orderKind`
  (`subscription` | `extraInquiry`). Subscriptions expose optional `planId` for
  plan-specific terms in the member UI, and an optional `billingAddressId` linking to
  the address used for that one subscription (`PATCH /billing/subscriptions/:id/billing`).
  **There is no payment-method resource**: payments run through Payrexx (see below), so
  the member area never stores or displays card details.
- `api/documents.ts` — the generated-document inventory plus the Privacy Policy
  Generator plan (`useGeneratorPlan` → `GET /generator/plan`, `{ siteAllowance }`). The
  generator is a **yearly subscription that also grants a site allowance**: a member buys
  a number of websites and every generated policy consumes one, so the member area derives
  "used" from the document count and shows the remaining allowance. The term/renewal live
  on the `policy` `Subscription` (`api/billing.ts`), alongside Academy and EU Rep, so the
  generator appears in the dashboard renewals like the other products. Generated policies
  are **hosted on Datenschutzpartner servers and embedded on the customer's site**, so
  legal updates are applied automatically — there is **no per-document status** to track
  and no "update available" action. Each document has a `site` (website domain) and
  an optional `siteUrl` (hosted policy page path). The member-area policy table shows
  name, site, created date, and last updated date in separate columns; the detail page
  is `/account/policies/[id]`.
  The "Generated Policies" tab (`DocumentsSection`) surfaces this as two summary cards
  (allowance + generated count) above the document list; billing history for the generator
  lives on the "Subscription" tab inside the shared `MembershipPanel`.

#### Mid-term site purchases (working assumption)

When a member has used their full site allowance and buys **additional sites** before
the current term ends, treat the purchase as a **new yearly subscription charge**, not
a prorated allowance bump on the existing term:

1. **`siteAllowance` increases** — the new order's `siteCount` is added to the running
   total (e.g. 5 sites + 3 more → allowance 8).
2. **Renewal resets** — `Subscription.nextPaymentDate` moves to **+12 months from the
   top-up payment date**; `lastOrderDate` updates to that payment. There is still one
   active `policy` subscription, not a second contract.
3. **Existing hosted policies stay live** — documents already generated keep working;
   the member can create policies for the newly purchased slots until the new allowance
   is used.
4. **Billing history** — each purchase is a separate `Order` with its own `siteCount`
   and invoice; the "+" action on **site allowance** opens `/account/generator/checkout`
   (`generatorTopUp` session); completing the generator wizard opens a `generator`
   session that also creates the hosted document.

This assumption is not spelled out in the client PDFs; it matches the product model
(hosted policy = yearly service) until billing confirms otherwise.

- `api/eu-rep-inquiries.ts` — inquiry log for EU Representation members.
  `useEuRepInquiries` → `GET /eu-rep/inquiries` returns `{ id, date, subject, status,
reference? }[]` with `status` in `forwarded` | `answered` | `closed`. Gated on the
  member token in MSW (empty for demo). The **EU Representation → Inquiries** tab
  (`EuRepSection`) renders these as a table with `StatusPill` tones.
- `api/checkout.ts` — Payrexx checkout sessions and post-payment side effects.
  `useCreateCheckoutSession` → `POST /checkout/sessions` returns `{ id, redirectUrl,
amount, siteCount }`. The POC simulates Payrexx by calling
  `useCompleteCheckoutSession` → `POST /checkout/sessions/:id/complete`, which appends
  an `Order`, increases `siteAllowance`, resets the `policy` subscription renewal,
  and (for `kind: 'generator'`) creates a hosted document. Mid-term top-ups use
  `kind: 'generatorTopUp'` from `/account/generator/checkout`. Helpers:
  `openPayrexxPortal()` → `GET /checkout/payrexx-portal`; `downloadOrderInvoice(orderId)`
  → `GET /billing/orders/:id/invoice` (+ PDF blob).

### Per-product billing address selection vs. management

Members may assign a **different billing address per product** (Privacy Policy
Generator, Academy, EU Rep) — each `Subscription` independently points at one
`billingAddressId`. Two distinct UI surfaces implement this split:

- **Selection, in each product's billing panel** (the shared `MembershipPanel`'s
  "Change" link on the billing address, used for Academy, EU Rep and the Privacy Policy
  Generator) — opens `BillingSelectionDialog`
  (`app/account/_components/BillingSelectionDialog.tsx`), a modal listing the member's
  saved billing addresses as selectable cards. Confirming calls
  `useUpdateSubscriptionBilling` to re-point that one subscription. The dialog includes
  a "Manage billing addresses" link that navigates to Account Details →
  Billing Addresses — it never creates, edits, or deletes records itself.
- **CRUD, only in Billing Addresses** (`PaymentDetailsSection`) — lists billing addresses
  as HeroUI `Card`s in a vertical list; "New address" and each card's edit icon open a
  `Modal` dialog form (`react-hook-form` + `zodResolver`, schema `addressInputSchema`);
  delete goes through the shared `ConfirmDialog`. This is the **only** place members can
  create, edit, or delete addresses.

#### Payrexx (payment service provider)

The client uses [Payrexx](https://www.payrexx.com/) for all payments (card
tokenization and recurring charges) via its **hosted checkout**. The member area
therefore **never stores or displays card details** — there is no payment-method
resource, form, or brand/last4/expiry anywhere in the app. **PAN and CVV are never
touched by this frontend.**

Every checkout flow redirects to Payrexx's hosted checkout (`api/checkout.ts`). The
member area never stores or displays card details — there is no payment-method resource,
form, or brand/last4/expiry anywhere in the app. **PAN and CVV are never touched by this
frontend.** In production, payment-method changes happen on Payrexx's hosted portal, not
inside this app; the POC stubs that redirect via `openPayrexxPortal()`.

Subscriptions/memberships/orders are gated on the bearer token in `mocks/handlers.ts`:
the member token (`lucas.baumgartner@gmail.com`) sees an active subscription +
membership; the `demo@` token sees the empty states. Addresses and payment methods are
shared across mock accounts (not gated). The shell renders client-side; `AccountApp`
redirects unauthenticated visitors to `/login`, and the current password for the mock
change-password endpoint is `dspmp`.

The **Academy** tab (`AcademySection`) has three sub-tabs: **Sessions**, **Documents**, and
**Membership**. Session schedules come from static modules under
`lib/academy-content/` — upcoming/past sessions from `preview-schedule.ts` + `events.ts`;
checklists and tools from `resources.ts` (linked to existing `/insights/…` articles and
`/scan`). No dedicated API yet.

## Future API replacement

Only `api/client.ts` and `mocks/` change at handover:

- Generate the client from the backend OpenAPI schema (`@hey-api/openapi-ts`).
- Replace `request()` internals; delete `mocks/`.
- Domain modules keep their signatures; **components do not change.** If they would, the
  data seam was bypassed — fix that.
