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

**Lucas seed (typical vs agency):** most policy subscriptions are **1 site = 1 abo**
(wizard purchases). One **agency prepaid** row (`#84729`, `siteCount: 5`) has three
client sites set up and **two empty slots** (buy-more flow). Separate single-site abos
cover `sutter-web.ch` and `alpenblick-hotel.ch` with their own renewal dates. One
expired single-site abo remains for history.

## Member area («Mein Konto»)

The authenticated hub at `/account` reads from three domain modules:

- `api/account.ts` — dashboard snapshot, profile, addresses (full CRUD), password
  change. `GET /account/snapshot` feeds the **Overview** dashboard: membership summary,
  next live session timestamp, document count, and EU Rep **legal-entity** count
  (from active EU Rep subscriptions). The **Account Details** section splits into **Profile** (name, email,
  password) and **Billing Addresses** (`PaymentDetailsSection`) — the member's saved
  billing addresses, laid out in the same section/column/divider style as the Academy
  membership screen. Addresses carry an optional `label` (e.g. "Head office") and an
  optional `vatId` shown on invoices; there is no more upsert-by-type — a member can
  save several `type: 'billing'` addresses and pick freely between them.
- `api/billing.ts` — subscriptions (+ cancel), memberships and orders. Orders use `orderKind`
  (`subscription` | `renewal`). Privacy Policy Generator orders are always one policy
  subscription per invoice. EU Representation is **one subscription per contract**
  (one legal entity / year, CHF 249) — buying N entities creates N subscriptions and
  N invoices. Subscriptions expose optional `planId` for
  plan-specific terms in the member UI, and an optional `billingAddressId` linking to
  the address used for that one subscription (`PATCH /billing/subscriptions/:id/billing`).
  `GET /billing/subscriptions/:id` feeds the dedicated subscription detail page
  (`/account/subscriptions/[id]`). **There is no payment-method resource**: payments run through Payrexx (see below), so
  the member area never stores or displays card details.
- `api/documents.ts` — the generated-document inventory plus an optional generator snapshot
  (`useGeneratorPlan` → `GET /generator/plan`, `{ activeSubscriptionCount,
availableSiteSlots, slotSubscriptionId? }`). Each
  policy subscription can cover **prepaid capacity** for several websites (buy-more
  flow) or **one website** when created through the wizard. Each hosted policy maps
  to one site. The term/renewal live on that `policy` `Subscription` (`api/billing.ts`),
  alongside Academy and EU Rep. Generated policies are **hosted on Datenschutzpartner
  servers and embedded on the customer's site**, so legal updates are applied automatically
  — there is **no per-document status** to track and no "update available" action. Each
  document has a `site` (website domain), an optional `siteUrl` (hosted policy page path),
  and a `legalEntity` — the **Swiss controller** of that website, independent of EU
  Representation. The member-area policy table shows **website first** (as a link),
  that Swiss legal entity, an **EU Rep** badge when the policy is linked to a
  representation contract, created date, and last updated date;
  the detail page is `/account/policies/[id]` (`Policy Text` and `Instruction`
  tabs). `DocumentsSection` lists hosted policies grouped by
  subscription; the subscription id links to `/account/subscriptions/[id]`
  (the same `MembershipPanel` billing screen as a legal-entity detail). Billing
  history and orders tables also link that id.

#### Generator purchases and renewals

Members buy policy coverage in two ways:

1. **Wizard (`/scan` → `/result`)** — always **one website = one new subscription**
   (`siteCount: 1`). The scan, questionnaire, and checkout all refer to that single
   site. Payment creates one hosted policy and one billing subscription.

2. **Buy more sites** (`/account/generator/checkout`) — **prepaid capacity** only:
   purchase `siteCount` > 1 with no scan and no hosted documents yet. The member area
   shows **empty rows** for unused slots; **Add Site** opens `/scan?fillSubscription=:id`
   and runs the wizard in fill-slot mode (no generator charge; optional EU Rep add-on
   still billable).

A subscription with `siteCount` > 1 is **prepaid multi-site capacity** on one renewal
calendar. Wizard-created subscriptions always have `siteCount: 1`. Volume discount
is based on **paid site capacity** on active policy subscriptions (`siteCount` sum).
A **new purchase** (wizard or buy-more) is priced on **active sites + sites in this
order** — if the cart crosses a higher tier, that rate applies to the whole current
order. **Renewal** re-evaluates against the live site count only, including the
subscription being renewed:

| Active sites | Discount |
| ------------ | -------- |
| 0–3          | none     |
| 4–5          | 5%       |
| 6–10         | 7.5%     |
| 11+          | 10%      |

Example: 8 active sites (5+3) → renewal of either subscription is **7.5%** off
list price. 3 active sites + buy 1 more → that order qualifies at **4 sites → 5%**.
3 active + buy 3 more → **6 sites → 7.5%** on this order. If cancellations drop
the member below a threshold, the lower (or zero) rate starts at the **next**
renewal.

**Unused slots:** fill-slot wizard passes `fillSubscriptionId` on checkout; the new
hosted policy attaches to that subscription without a generator charge.

**Renewal** is a new one-year order (`orderKind: 'renewal'`) priced at the tier the
member qualifies for **at that moment**. Each subscription has its own calendar. The
owner is notified 30 days before each renewal (price + current discount; a lost-tier
warning if the rate went up). Cancellation is allowed any time before the charge.

Checkout kinds: `generator` (new policy), `generatorTopUp` (same as a new policy in
this prototype — the dedicated checkout route redirects to `/scan`), `generatorRenewal`
(renew one existing subscription), and `euRep` (standalone EU Representation from
`/account/eu-rep/checkout`). Quote helpers live in `api/checkout.ts`
(`calculateGeneratorPolicyQuote`, `calculateEuRepQuote`). Standalone EU Rep checkout
buys **N legal-entity contracts** (`euRepEntityCount` + `euRepEntities[]` with
`legalEntity` and `forwardingEmail` per contract) and creates **one billing
subscription per contract**.

- `api/eu-rep.ts` — EU Representation **contracts** (`GET /eu-rep/contracts`,
  `GET /eu-rep/contracts/:id`, `PATCH /eu-rep/contracts/:id`,
  `POST /eu-rep/contracts/:id/documents`). One
  contract = one **Swiss** legal entity for one year. The EU representative is
  always the constant `EU_REP_REPRESENTATIVE` (VGS Datenschutzpartner GmbH,
  Hamburg) — there is no per-contract EU-side entity. A member may hold several
  contracts (an agency with two Swiss clients = two contracts). Fields:
  `subscriptionId`, `legalEntity` (the represented Swiss company),
  `forwardingEmail` (internal inbox — **never** printed in the policy; it may
  differ from emails in the policy because different people own policies vs EU
  Rep), `linkedDocumentIds`, `status`. Each contract points at its own billing
  `subscriptionId` (1:1). Hosted generator documents carry their own Swiss
  `legalEntity` plus `euRepContractId` (and derived `euRepLinked`);
  linking inserts the Hamburg Art. 27 block. Cancelling an EU
  Rep subscription strips that block from **hosted** policies covered by that
  contract only. The **EU Representation** section has no secondary tabs:
  `EuRepContractPanel` lists linked hosted policies grouped by Swiss legal
  entity. Opening an entity goes to `/account/eu-rep/contracts/[id]` with
  **Details** (legal entity / forwarding email) and **Subscriptions**
  (`MembershipPanel` for that contract) tabs.
- `api/checkout.ts` — Payrexx checkout sessions and post-payment side effects.
  `useCreateCheckoutSession` → `POST /checkout/sessions` returns `{ id, redirectUrl,
amount, siteCount, discountRate?, discountAmount? }`. The POC simulates Payrexx by calling
  `useCompleteCheckoutSession` → `POST /checkout/sessions/:id/complete`, which appends
  an `Order`, creates a **new** policy `Subscription` (or updates the named one on
  `generatorRenewal`), and (for `kind: 'generator'` with a domain) creates a hosted
  document. Additional policies are bought through the generator wizard (`/scan`).
  Bundling `euRepEntityCount` / `euRepEntities` on a generator checkout creates a
  new EU Rep **subscription + contract** and auto-links the new hosted document. Passing
  `euRepLinkContractId` instead links the new document to an **existing**
  contract with no extra charge. Kind `euRep` creates **one subscription per
  purchased contract**. Unit price is CHF 249 / legal entity / year
  (`EU_REP_UNIT_PRICE`). After a standalone purchase, leftover hosted policies
  can be linked (`needsPolicyLinking`, `euRepContractIds`). Changing a contract's
  legal entity regenerates linked hosted policies (`updatedDate`).
  Quote helpers live in `api/checkout.ts` (`calculateGeneratorPolicyQuote`,
  `calculateEuRepQuote`). Helpers:
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

The **Academy** tab (`AcademySection`) shows **Membership** only (sessions and
resources live on the public `/academy` landing). Session schedules remain in static
modules under `lib/academy-content/` for that landing. No dedicated Academy API yet.

## Future API replacement

Only `api/client.ts` and `mocks/` change at handover:

- Generate the client from the backend OpenAPI schema (`@hey-api/openapi-ts`).
- Replace `request()` internals; delete `mocks/`.
- Domain modules keep their signatures; **components do not change.** If they would, the
  data seam was bypassed — fix that.
