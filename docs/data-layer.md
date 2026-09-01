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

Auth uses `api/auth.ts`: every account signs in with **email + password**
(`POST /auth/login/identify` → `POST /auth/login`). Admins must also pass
`twoFactorCode`. `GET /auth/session` returns `{ email, emailVerified, role? }`
where `role` is `member` or `admin`. Registration:
`POST /auth/register` then `POST /auth/verify-email` (double opt-in;
prototype also returns `verificationUrl`). Verified sign-ups are added to the
mock auth store with password `welcome`. Mock seed accounts:
`lucas.baumgartner@gmail.com` (member, password `dspmp`) and
`demo@datenschutzpartner.ch` (admin, password `demo`, 2FA code `123456`).

**Lucas seed (typical vs agency):** most policy subscriptions are **1 site = 1 abo**
(wizard purchases). One **agency prepaid** row (`#84729`, `siteCount: 5`) has three
client sites set up and **two empty slots** (buy-more flow). Separate single-site abos
cover `sutter-web.ch` and `alpenblick-hotel.ch` with their own renewal dates. One
expired single-site abo remains for history.

## Member area («Mein Konto»)

The authenticated hub at `/account` reads from three domain modules:

- `api/account.ts` — dashboard snapshot, profile, a single billing address
  (`GET/PUT /account/billing-address`, includes `billingEmail`), and password
  change. `GET /account/snapshot` returns `{ documentCount }` for the **Overview**
  dashboard. The **Account Details** section splits into **Profile**
  (inline name and email; password change for members, 2FA status for admins) and **Billing**
  (`PaymentDetailsSection`) — one inline billing form for the whole account.
- `api/billing.ts` — subscriptions (+ cancel) and orders. Orders use `orderKind`
  (`subscription` | `renewal` | `extraRequest`). Privacy Policy Generator orders are always one policy
  subscription per invoice. EU Representation is **one subscription per plan**
  (Basis CHF 149 / Plus CHF 229 / Plus 5 CHF 499 per year) that can cover **several
  legal-entity contracts**. Extra inquiries beyond the plan allowance are billed at
  CHF 99 (`orderKind: 'extraRequest'`, `POST /billing/eu-rep/extra-request`).
  Subscriptions expose `planId`, optional `includedRequests` / `usedRequests`, and an optional
  `billingAddressId` linking to the address used for that subscription
  (`PATCH /billing/subscriptions/:id/billing`).
  `GET /billing/subscriptions/:id` feeds the dedicated subscription detail page
  (`/account/subscriptions/[id]`). **There is no payment-method resource**: payments run through Payrexx (see below), so
  the member area never stores or displays card details.
- `api/documents.ts` — the generated-document inventory plus an optional generator snapshot
  (`useGeneratorPlan` → `GET /generator/plan`, `{ activeSubscriptionCount,
availableSiteSlots, slotSubscriptionId? }`). Each
  policy subscription can cover **prepaid capacity** for several websites (buy-more
  flow) or **one website** when created through the wizard. Each hosted policy maps
  to one site. The term/renewal live on that `policy` `Subscription` (`api/billing.ts`),
  alongside EU Rep. Generated policies are **hosted on Datenschutzpartner
  servers and embedded on the customer's site**, so legal updates are applied automatically
  — there is **no per-document status** to track and no "update available" action. Each
  document has a `site` (website domain), an optional `siteUrl` (hosted policy page path),
  and a `legalEntity` — the **Swiss controller** of that website, independent of EU
  Representation. The **Websites** section lists website, policy, cookie-banner stub,
  and optional linked representation; actions include rescan, edit, and add services.
  The policy text lives in the `Details` tab of the Privacy Policy section; there
  is no separate policy detail page. `DocumentsSection` lists hosted policies grouped by
  subscription; the subscription id links to `/account/subscriptions/[id]`
  (the same `MembershipPanel` billing screen as a legal-entity detail). Billing
  history and orders tables also link that id.

#### Generator purchases and renewals

Members buy policy coverage in two ways:

1. **Wizard (`/scan` → `/result`)** — always **one website = one new subscription**
   (`siteCount: 1`). The **Account** wizard step (email + T&C + newsletter,
   `POST /auth/register`) is **guest-only**. After double opt-in
   (`POST /auth/verify-email`) the guest lands on the same last wizard screen
   a logged-in member reaches after the questionnaire / EU-rep: confirmation
   with a centered **Show policy** button (wizard chrome, no stepper). Logged-in
   members skip Account entirely. Show policy starts the trial
   (`POST /checkout/trial`) when the document is not already published
   (verify-email already starts it for new accounts). The hosted document starts
   as a free trial (`trialEndsAt` on the policy subscription). **Payment is not
   in the wizard** — it lives at
   `/account/checkout`, reached from a banner under the account sidebar.
   `POST /checkout/pending/complete` converts the trial to a paid order.

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
selects a **plan** (`euRepPlanId`: `basis` | `plus` | `plus5`) and creates **one billing
subscription** plus one or more legal-entity contracts (`euRepEntities[]` with
`legalEntity`, `forwardingEmail`, and postal address fields). The generator wizard
always adds **Basis** only and shares the same 14-day trial as the policy
(`POLICY_TRIAL_DAYS`).

- `api/eu-rep.ts` — EU Representation **contracts** (`GET /eu-rep/contracts`,
  `GET /eu-rep/contracts/:id`, `PATCH /eu-rep/contracts/:id`,
  `POST /eu-rep/contracts`, `POST /eu-rep/contracts/:id/documents`). One
  contract = one **Swiss** legal entity under an EU Rep **plan subscription**. The EU
  representative is always the constant `EU_REP_REPRESENTATIVE` (VGS Datenschutzpartner GmbH,
  Hamburg) — there is no per-contract EU-side entity. A member may hold several
  contracts on the same subscription. Fields:
  `subscriptionId`, `legalEntity` (the represented Swiss company),
  `forwardingEmail` (internal inbox — **never** printed in the policy),
  postal address fields, `linkedDocumentIds`, `status`. Hosted generator documents carry their own Swiss
  `legalEntity` plus `euRepContractId` (and derived `euRepLinked`);
  linking inserts the Hamburg Art. 27 block. Cancelling an EU
  Rep subscription strips that block from **hosted** policies covered by that
  subscription. The **EU Representation** account section has tabs
  **Representations** / **Instructions** / **FAQ**: sortable legal-entity list,
  secondary linked-policies comfort block, and CHF 99 payment-request action.
  Opening an entity goes to `/account/eu-rep/contracts/[id]` with
  **Details** (legal entity / forwarding email / postal address) and **Subscriptions**
  (`MembershipPanel` for that contract) tabs.
- `api/checkout.ts` — Payrexx checkout sessions and post-payment side effects.
  `useCreateCheckoutSession` → `POST /checkout/sessions` returns `{ id, redirectUrl,
amount, siteCount, discountRate?, discountAmount? }`. The POC simulates Payrexx by calling
  `useCompleteCheckoutSession` → `POST /checkout/sessions/:id/complete`, which appends
  an `Order`, creates a **new** policy `Subscription` (or updates the named one on
  `generatorRenewal`), and (for `kind: 'generator'` with a domain) creates a hosted
  document. Additional policies are bought through the generator wizard (`/scan`).
  Bundling `euRepPlanId` / `euRepEntities` on a generator checkout creates a
  new EU Rep **plan subscription + contract(s)** and auto-links the new hosted document. Passing
  `euRepLinkContractId` instead links the new document to an **existing**
  contract with no extra charge. Kind `euRep` creates **one subscription for the
  selected plan** and one or more contracts under it. Plan prices live in
  `EU_REP_PLANS` (Basis / Plus / Plus 5); extra inquiries use
  `EU_REP_EXTRA_REQUEST_PRICE` (CHF 99). After a standalone purchase, leftover hosted policies
  can be linked (`needsPolicyLinking`, `euRepContractIds`). Changing a contract's
  legal entity regenerates linked hosted policies (`updatedDate`).
  Quote helpers live in `api/checkout.ts` (`calculateGeneratorPolicyQuote`,
  `calculateEuRepQuote`). Helpers:
  `openPayrexxPortal()` → `GET /checkout/payrexx-portal`; `downloadOrderInvoice(orderId)`
  → `GET /billing/orders/:id/invoice` (+ PDF blob).

### Account billing address

Each member has **one** billing address on the account (`GET/PUT
/account/billing-address`). Subscription sidebars in `MembershipPanel` show the full
address (including billing email and VAT ID) and link to Account Details → Billing to
edit. There is no per-subscription address picker.

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

Subscriptions/orders are gated on the bearer token in `mocks/handlers.ts`:
the member token (`lucas.baumgartner@gmail.com`) sees active policy and EU Rep
subscriptions; the `demo@` token sees the empty states. The billing address is
shared across mock accounts (not gated). The shell renders client-side; `AccountApp`
redirects unauthenticated visitors to `/login`, and the current password for the mock
change-password endpoint is `dspmp`.

**Datenschutz Academy** is a public marketing surface only (`/academy` landing and
article pages). It is not part of the member-area navigation or billing APIs.

## Future API replacement

Only `api/client.ts` and `mocks/` change at handover:

- Generate the client from the backend OpenAPI schema (`@hey-api/openapi-ts`).
- Replace `request()` internals; delete `mocks/`.
- Domain modules keep their signatures; **components do not change.** If they would, the
  data seam was bypassed — fix that.
