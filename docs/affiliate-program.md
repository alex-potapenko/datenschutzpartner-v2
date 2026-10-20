# Affiliate Program — Product Requirements Document

**Version:** 1.0 (draft)  
**Status:** Draft for client and backend sign-off  
**Primary locale:** German (`de`); English (`en`) parity via next-intl  
**References:** Legacy AffiliateWP (WordPress), client screencast, prototype `api/affiliate.ts` + MSW

---

## 1. Purpose and context

### 1.1 Problem

Partners need transparent commission tracking for referred purchases. Operations need controlled onboarding, attribution, accruals, and a **quarterly payout cycle** without in-product bank transfers.

### 1.2 Goals

- **Partner dashboard:** links, statistics, accruals, payout history, vouchers, notification settings.
- **Admin operations:** partners, referrals (commissions), statuses, **payout creation as “you may send an invoice”**, payout history.
- **Correct attribution** (cookie, deep links) and **payable commission only after the customer order is paid**.
- **v2 design language** for all UI; legacy AffiliateWP screens define **behavior only**, not layout or visual design.

### 1.3 Non-goals (v2 unless explicitly scoped)

- Automated bank payouts or AffiliateWP Payouts Service integration.
- Pixel-perfect replication of WordPress admin navigation (e.g. Werbemittel, Auswertungen) unless added to scope.
- Legal review of partner-published content beyond program terms acceptance.

### 1.4 Success metrics

- Partner can create a deep link and see click → conversion → commission with correct status.
- Admin can run a quarterly (or scheduled) payout for an affiliate with correct amount and invoice-request email.
- No payable commissions on unpaid customer orders (post go-live rules).
- Reduced manual ops vs standalone AffiliateWP (unified account + admin in v2).

---

## 2. Personas

| Persona                 | Description                            | Primary jobs                                                             |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| **Affiliate (partner)** | Approved program member                | Links, vouchers, stats, referrals, settings, invoice after payout signal |
| **Applicant**           | Submitted application, not yet partner | Apply, view pending/rejected status                                      |
| **Admin (operations)**  | Datenschutzpartner staff               | Applications, partners, referrals, payouts                               |
| **Customer**            | Buyer via referral                     | No affiliate UI; cookie + checkout attribution                           |
| **System**              | Email, orders, billing                 | Payment events, emails, commission calculation                           |

---

## 3. Core business rules

### 3.1 Commission

- **Default rate:** 10% of qualifying **paid** purchases (globally configurable; per-affiliate override optional in phase 2).
- **Currency:** CHF (aligned with legacy).
- **Attribution window:** first-party cookie lifetime (e.g. 30 days — `cookieDays` in program settings).

### 3.2 Referral (commission) lifecycle

```
Order attributed to partner
  → Pending     (order not paid / under review)
  → Unpaid      (order paid; commission payable, not yet in a payout)
  → Rejected    (fraud, refund, admin reject)
  → Paid        (included in a completed admin payout run)
```

- **Payable:** transition to **Unpaid** only after confirmed customer order payment.
- **Refunds/chargebacks:** policy TBD (reject commission or adjustment); model must support **Rejected** and audit.

### 3.3 Payout cycle

- **Cadence:** payouts to program participants **every three months** (exact calendar — see open questions).
- **Threshold:** prototype uses minimum balance (e.g. CHF 50); align with legacy: payout run when unpaid balance ≥ threshold **or** admin override.
- **Admin “create payout” ≠ money sent:** creating a payout is a **marker** plus **email** to the affiliate: they may **send an invoice** for the stated amount. Actual transfer is **outside** the product (manual accounting).
- **On payout commit:** included referrals in the period → **Paid**; create payout record (amount, period, method: manual, `createdBy`, status).

### 3.4 Partner identification and URLs

- Public format: `https://{domain}/ref/{identifier}`.
- **Identifier:** numeric affiliate ID (exactly 3 digits) in `/ref/{id}`. **Prototype:** partner may change it in the Links tab (unique, validated); old `/ref/` URLs are **not** redirected (see §10). Production may restrict changes to the admin tool — sign off with client.
- One partner may have **multiple marketing links** (different landing paths).

### 3.5 Privacy (partner-facing)

- Referral lists **must not** expose customer PII (no buyer email/name). Allowed: internal reference (order/ref id), product description, amounts, status, timestamp.

---

## 4. Partner (affiliate) requirements

### 4.1 Onboarding and access

| ID   | Requirement                                                | Acceptance criteria                                     |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------- |
| A-01 | Submit application (email, website, message, accept terms) | Application created; duplicate handling defined         |
| A-02 | Statuses: pending / approved / rejected                    | UI reflects status; re-apply after reject — policy TBD  |
| A-03 | After approval, access partner dashboard                   | Transactional email with base referral URL (production) |
| A-04 | Leave program (if offered)                                 | Partner deactivated; links stop attributing             |

**Prototype:** application, approval (simulated from the pending card; review happens in the external admin tool) and leaving the program (A-04: `POST /affiliate/partner/me/leave` deactivates the partner, data retained) — implemented; emails are not simulated (see §6.3).

### 4.2 Affiliate ID and base link

| ID   | Requirement                                      | Acceptance criteria                                  |
| ---- | ------------------------------------------------ | ---------------------------------------------------- |
| A-10 | Show partner slug/ID and canonical `/ref/{slug}` | Copy affordance; slug editable with uniqueness rules |
| A-11 | Slug change with validation                      | Redirect policy for old URLs — TBD                   |

**Prototype:** Links tab shows the numeric ID and **base** referral URL with copy affordance. ID edit opens a modal (Save/Cancel); uniqueness via `PATCH /affiliate/partner/me/slug` (409 if taken). Blocked when partner is **inactive** (403). Marketing links embed the same ID after a page path (`/{page}/ref/{id}/`).

### 4.3 Marketing link generator

| ID   | Requirement                                           | Acceptance criteria                                     |
| ---- | ----------------------------------------------------- | ------------------------------------------------------- |
| A-20 | Enter **site page URL/path** → generate tracking link | Visit lands on target page with attribution preserved   |
| A-21 | Optional **campaign** name                            | Stored on the link; appended as `?campaign=` on the URL |
| A-22 | List created links: URL, creation date                | Create, delete; target URL not required to be editable  |
| A-23 | Click on marketing link                               | Visit logged; cookie set; redirect to target            |

**Prototype:** implemented (Phase 1). Links use `https://www.datenschutzpartner.ch/{marketing-page}/ref/{id}/` (base link: `/ref/{id}/`); optional campaign on create; the generator accepts an app path or a full .ch URL; a click records a visit, sets the cookie and redirects to the target route.

### 4.4 Financial overview (statistics)

| ID   | Requirement                                               | Acceptance criteria                         |
| ---- | --------------------------------------------------------- | ------------------------------------------- |
| A-30 | **Pending / unpaid earnings** (eligible for next payout)  | Sum of Unpaid referrals not yet in a payout |
| A-31 | **Total paid out to date**                                | Sum of completed payouts                    |
| A-32 | Counts: unpaid vs paid referrals; visits; conversion rate | Documented formulas                         |
| A-33 | Per-link metrics (clicks, conversions, balance)           | Per marketing link                          |

**Formulas (A-30–A-32):**

- **Pending earnings (Overview):** Σ `commissionChf` where referral status is **Pending** (order not paid yet).
- **Unpaid earnings (A-30):** Σ `commissionChf` where referral status is **Unpaid** (not yet included in a payout run; eligible for the next payout).
- **Total paid out to date (A-31):** Σ `amountChf` of payouts with status **transferred** (completed); `invoice_requested` does not count until marked transferred.
- **Visits (A-32):** count of recorded link visits for the partner.
- **Settlement counts (A-32, Overview):** referral counts in **Pending**, **Unpaid**, and **Paid** (Rejected omitted here; full list on Referrals tab).
- **Conversion rate (A-32):** (Pending + Unpaid + Paid referral count) ÷ visits, capped at 1.

**Prototype:** implemented. Overview earnings: **Pending earnings** (order Pending), **Unpaid earnings** (A-30) with **next payout date** (from program cadence, 1st of Jan/Apr/Jul/Oct when cadence is 3 months), **Total paid out to date** (A-31); then Activity (A-32). Each marketing link (A-33): clicks, conversions, **balance** (= Unpaid commission on that link). Full referral rows (A-40) on the Referrals tab.

### 4.5 Referrals list (commissions)

| ID   | Requirement                                                                 | Acceptance criteria               |
| ---- | --------------------------------------------------------------------------- | --------------------------------- |
| A-40 | Table: reference, commission, **product description**, **status**, datetime | Paginated; optional status filter |
| A-41 | Statuses: Pending, Unpaid, Paid, Rejected                                   | Match admin/system                |
| A-42 | No customer PII                                                             | QA checklist                      |

**Prototype:** Referrals tab lists all referrals (reference, product, status, date, commission) with a status filter and 20 per page. Overview shows visits/referrals/conversion stats only (Activity block).

### 4.6 Visits log — should-have

| ID   | Requirement                                                           | Acceptance criteria |
| ---- | --------------------------------------------------------------------- | ------------------- |
| A-50 | Log: target URL, referring URL (or “direct”), converted Y/N, datetime | Paginated           |

**Prototype:** implemented — Visits tab, 20 per page (client-side).

### 4.7 Vouchers (discount codes)

| ID   | Requirement                                                | Acceptance criteria              |
| ---- | ---------------------------------------------------------- | -------------------------------- |
| A-60 | Partner creates voucher: code + discount % (within limits) | Unique code; applies at checkout |
| A-61 | List own vouchers                                          | Code and discount                |
| A-62 | Business rules (max %, expiry, count) — TBD                | Admin-configurable               |

**Prototype:** Vouchers tab — create code + discount % (capped by `maxVoucherDiscountPercent` on `GET /affiliate/settings`); list own vouchers. Checkout (EU Rep) accepts partner codes like promo codes; commission rule: 10% of net amount **after** discount (§10 Q5).

### 4.8 Settings and notifications

| ID   | Requirement                                                    | Acceptance criteria                   |
| ---- | -------------------------------------------------------------- | ------------------------------------- |
| A-70 | **Payment / notification email** (may differ from login email) | Used for commission and payout emails |
| A-71 | Toggle: notify on successful referral                          | Email when commission becomes Unpaid  |
| A-72 | Email when **payout initiated** (invoice request)              | Amount, period, instructions          |

**Prototype:** Settings tab with notification email and referral-notification toggle; emails themselves are backend-only.

### 4.9 Payouts (partner view)

| ID   | Requirement                                        | Acceptance criteria                 |
| ---- | -------------------------------------------------- | ----------------------------------- |
| A-80 | Payout history: date, amount, status               | Read-only                           |
| A-81 | Instructions to send invoice to Datenschutzpartner | Static + dynamic amount from payout |
| A-82 | No “instant withdraw” or implied auto-transfer     | UX matches manual process           |

**Prototype:** Payouts tab with inline invoice instructions (A-81: static steps + dynamic amount per open _Invoice requested_ payout), history table, and “How it works” modal for cadence/threshold copy (A-82: no instant withdraw).

---

## 5. Admin requirements

> **Scope:** the admin side runs in the **external admin tool**, not in this frontend. The requirements below describe what that tool and the backend must support; the v2 prototype only simulates the steps that affect the partner view (see _Prototype controls_ in §11).

### 5.1 Affiliate management

| ID   | Requirement                                            | Acceptance criteria                         |
| ---- | ------------------------------------------------------ | ------------------------------------------- |
| M-01 | Master list: all affiliates (active/rejected/inactive) | Email, ID, rates, balances, activity counts |
| M-02 | Approve/reject applications                            | Creates partner on approve                  |
| M-03 | Deactivate affiliate                                   | Attribution stops; data retained            |
| M-04 | Partner detail view                                    | Links, stats, referrals, payouts            |

**Prototype:** not in this frontend. Partner-visible effects are simulated: approval (pending card link) and deactivate / reactivate (Prototype controls); a deactivated partner sees a notice on Overview, the account is read-only (no add/edit/delete for links, vouchers, slug, or settings), and clicks stop attributing.

### 5.2 Referrals (deal tracking)

| ID   | Requirement                                                                             | Acceptance criteria           |
| ---- | --------------------------------------------------------------------------------------- | ----------------------------- |
| M-10 | Global referrals with filters: All / Pending / Unpaid / Paid / Rejected                 |                               |
| M-11 | Actions: accept (pending→unpaid), reject, edit amount (restricted), delete (restricted) | Audit log recommended         |
| M-12 | Per-referral “mark paid” — optional if batch-only                                       | Align with legacy if required |
| M-13 | Referral linked to order; order payment drives Pending→Unpaid                           |                               |

**Prototype:** not in this frontend. "Customer pays an order" in Prototype controls stands in for the payment event (M-13).

### 5.3 Payout processing (critical)

| ID   | Requirement                                                                                     | Acceptance criteria                                                   |
| ---- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| M-20 | **Payout history:** ID, amount, affiliate, referral IDs, createdBy, method manual, status, date |                                                                       |
| M-21 | **Create payout:** select affiliate, date range, minimum earnings, preview                      | Preview lists unpaid referrals in range + total CHF                   |
| M-22 | **Commit payout**                                                                               | Record created; referrals marked Paid; **invoice-request email** sent |
| M-23 | CSV export (optional)                                                                           | Accounting export on commit                                           |
| M-24 | No in-ui bank transfer                                                                          | Copy states external payment                                          |

**Prototype:** not in this frontend. Prototype controls create a payout of all unpaid referrals (status _Invoice requested_) and mark it transferred; the partner sees both in the Payouts tab.

### 5.4 Program settings (admin)

| ID   | Requirement                                                              | Acceptance criteria           |
| ---- | ------------------------------------------------------------------------ | ----------------------------- |
| M-30 | Global: commission rate, cookie days, payout threshold, quarter schedule | API + admin or config service |
| M-31 | Per-affiliate commission override                                        | Phase 2                       |

**Prototype:** read-only `GET /affiliate/settings` (cookie window, payout threshold and cadence used in partner copy). Changing settings and per-affiliate rates belongs to the external admin tool.

---

## 6. System and integrations

### 6.1 Attribution

- First-party cookie (e.g. `dsp_affiliate_ref`) on visit via `/ref/...` or decorated marketing URL.
- Checkout reads cookie → attaches `partnerId`, `referralLinkId`, optional `campaign` to order.
- Post-payment event → create/update referral **Pending → Unpaid**.

### 6.2 Orders and payments

- Single source of truth: customer order **paid** state.
- Refunds: update referral status (Rejected or adjustment — TBD).

### 6.3 Transactional email

| Event                      | Recipient                  | Content                              |
| -------------------------- | -------------------------- | ------------------------------------ |
| Application received       | Applicant                  | Acknowledgment                       |
| Application approved       | Applicant                  | Welcome + referral link              |
| Commission earned (Unpaid) | Partner notification email | Amount, product, payout cycle hint   |
| Payout initiated           | Partner notification email | Amount, period, invoice instructions |
| Application rejected       | Applicant                  | Optional reason                      |

**Prototype:** emails are backend-only and not simulated. The mock API returns the recipient
(`commissionEmailSentTo`, `invoiceEmailSentTo`) and the Prototype controls confirm it in a toast.

### 6.4 API contract (conceptual domains)

Extend [`api/affiliate.ts`](../api/affiliate.ts) and MSW as the draft backend contract:

- **Partner:** profile, settings, links, vouchers, dashboard aggregates.
- **Referral:** admin workflow; partner list.
- **Visit:** create on click; partner/admin list.
- **Payout:** admin preview + commit; partner history.
- **Admin:** partners list, applications.

See also [data-layer.md — Affiliate program](data-layer.md#affiliate-program-apiaffiliatets) for current prototype endpoints.

---

## 7. Conceptual data model

| Entity                    | Key fields                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Partner**               | id, userId, email, slug, status, commissionRate, notificationEmail, flags, approvedAt                               |
| **ReferralLink**          | id, partnerId, pathSegment or targetPath, fullUrl, campaign?, createdAt, clickCount                                 |
| **Visit**                 | id, linkId, partnerId, targetUrl, referrer, converted, createdAt                                                    |
| **Referral (commission)** | id, partnerId, linkId?, orderRef, description, orderAmount, commissionAmount, status, createdAt, paidAt?, payoutId? |
| **Payout**                | id, partnerId, amountChf, periodStart, periodEnd, status, method, createdBy, createdAt, referralIds[]               |

---

## 8. Information architecture (v2 — content, not legacy chrome)

**Partner (Account → Affiliate):**

- Overview (stats + payout guidance)
- Links (generator + list)
- Referrals
- Payouts
- Vouchers
- Settings

_(Visits under Referrals or separate tab.)_

**Admin:** external admin tool (applications, affiliates, referrals, payouts, settings) — out of scope for this frontend.

**Prototype today:** partner sidebar tabs Overview, Links, Vouchers, Visits, Referrals, Payouts, Settings (`?section=affiliate&tab=…`); the page header shows the active tab label. On Overview, inactive partners see a warning banner (read-only account). **Dev controls** (MSW only): link _Show Dev Controls_ at the bottom of Overview opens a modal that simulates admin and webhook steps. Public program copy lives on `/affiliate` (optional partner vouchers + commission on paid net amount).

**Code entry points:**

- Public: `app/affiliate/`, `app/ref/[slug]/`
- Account: `app/account/` section `affiliate` (`AffiliateSection`, one panel per tab in `app/account/_components/sections/affiliate/`)

---

## 9. Phasing

### Phase 1 — MVP (task parity + payout semantics)

- Deep link generator + link list (optional campaign tag)
- Referral statuses + order-paid gating
- Partner: pending vs unpaid vs paid-out earnings (A-30–A-32), referrals table, visits log, payout history, vouchers (create/list, checkout discount)
- Partner settings + leave (deactivate, A-04) + core emails (commission + payout invoice; backend only, not in the prototype)
- Admin: affiliate list, referral workflow, create/commit payout (external tool; simulated in prototype)

### Phase 2

- Campaign analytics, CSV export, audit log, per-affiliate rates
- Voucher expiry / usage limits (see §10)

### Phase 3 / optional

- Creative assets (Werbemittel), advanced reports
- Third-party payout provider

---

## 10. Open questions (client / finance / legal)

**Decided during prototyping:**

- **Threshold (Q2):** CHF 50 is a hint in the payout preview only; the admin can create a payout below it.
- **Pending referrals (Q7):** Pending → Unpaid automatically once the order is paid; the admin can only reject.
- **Link format:** one numeric ID per partner; marketing links as `/{marketing-page}/ref/{id}/` (middleware rewrites to in-app attribution).
- **Vouchers (Q5, partly):** partners create codes themselves up to an admin-set maximum discount %; commission is 10% of the amount after the discount.
- **Emails:** sent by the backend only; the prototype does not simulate them.
- **Payout status:** Invoice requested (on creation) → Transferred (admin marks it after the manual transfer).
- **Affiliate ID (Q3):** 3-digit numeric ID in UI and `/ref/{id}`; prototype lets partners edit in Links (unique); old URLs are **not** redirected (301 policy still open for production).
- **Slug / ID change (Q2 redirect):** prototype **invalidates** old `/ref/` URLs (no 301).

**Still open:**

1. Fixed **quarterly payout calendar** vs admin-triggered only (decided in the external admin tool).
2. **Vouchers:** expiry, usage limits, stacking with other discounts (e.g. volume discount).
3. **Order reference** in partner UI — masked id sufficient?
4. Production domain (`.ch` vs `.com`).
5. Re-application after reject.
6. Refund/chargeback commission policy.
7. Whether **partner** or **admin-only** may change affiliate ID in production.

---

## 11. Prototype traceability

| PRD area                            | Prototype today                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Application + approval              | Yes (approval simulated from the pending card)                                                          |
| Leave program (A-04)                | Yes (`POST /affiliate/partner/me/leave` — deactivate, data retained)                                    |
| Deactivated partner (M-03 effect)   | Yes (Overview banner; no link/voucher/slug/settings edits; clicks not attributed; MSW 403 on mutations) |
| `/ref/` + cookie + visits           | Yes (visit recorded; lands on target page)                                                              |
| Affiliate ID + base URL (A-10)      | Yes (Links tab: modal edit ID, copy base URL)                                                           |
| Marketing URL generator + link list | Yes (Links tab; optional campaign A-21)                                                                 |
| Dashboard stats (A-30–A-32)         | Yes (Overview: pending/unpaid earnings, paid out, activity counts)                                      |
| Referrals with status               | Yes (Referrals tab: filter + pagination)                                                                |
| Payout history (A-80–A-82)          | Yes (Payouts tab + inline invoice instructions)                                                         |
| Partner settings (A-70–A-71)        | Yes (notification email, referral notifications)                                                        |
| Admin side                          | External admin tool; simulated via Dev controls modal (Overview, MSW only)                              |
| Visits log (A-50)                   | Yes (Visits tab, paginated client-side)                                                                 |
| Vouchers (A-60–A-62)                | Yes (Vouchers tab; checkout promo resolution in MSW)                                                    |
| Public `/affiliate`                 | Yes (landing + apply; legal/terms aligned with voucher commission rule)                                 |

---

## 12. Release acceptance checklist

**Prototype (MSW) status:**

- [x] Commission lifecycle covered by `api/affiliate.test.ts` (visit → mark order paid → payout → transferred); transactional email not simulated.
- [x] Inactive partner: attribution off, data retained, partner mutations 403 (`api/affiliate.test.ts`).
- [x] Unpaid order: only `Pending` referrals until prototype “Customer pays an order” / payment webhook (M-13).
- [x] Partner referrals contain no customer email/name (schema + test).
- [x] Second payout create returns 409 when nothing unpaid (idempotent guard in mock).
- [x] DE/EN i18n for affiliate partner UI and `/affiliate` public copy.
- [x] Playwright smoke: public `/affiliate`, partner Overview after MSW approval, partner voucher on EU Rep checkout (`e2e/affiliate.spec.ts`; full axe in `pnpm verify:full`).
- [ ] Production: `pnpm verify` on release branch; OpenAPI draft includes vouchers + leave endpoints.

**Production go-live (backend + admin tool):**

- [ ] E2E: marketing link click → paid purchase → referral Unpaid → admin payout → referral Paid + email.
- [ ] Unpaid customer order does not create Unpaid commission.
- [ ] Admin payout commit is idempotent (no double-settle referrals).
- [ ] Accessibility: tables, forms, notifications (CI axe).

---

**Document owner:** Product  
**Engineering:** Frontend (v2), Backend (orders, email, persistence)  
**Next step:** Phase 1 is in the prototype; Phase 2 next (campaign analytics, CSV, per-affiliate rates, vouchers). Sign off the open questions in §10.
