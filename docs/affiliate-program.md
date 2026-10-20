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
- **Identifier:** custom slug (letters, digits, `.`, `_`, `-`; length per validation) — not numeric-only; internal ID may be shown read-only for support (optional).
- One partner may have **multiple marketing links** (different landing paths and optional campaigns).

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

**Prototype:** application + admin approve/reject — implemented; emails are not simulated (see §6.3).

### 4.2 Affiliate ID and base link

| ID   | Requirement                                      | Acceptance criteria                                  |
| ---- | ------------------------------------------------ | ---------------------------------------------------- |
| A-10 | Show partner slug/ID and canonical `/ref/{slug}` | Copy affordance; slug editable with uniqueness rules |
| A-11 | Slug change with validation                      | Redirect policy for old URLs — TBD                   |

**Prototype:** multiple links with editable `pathSegment`; dedicated “Affiliate ID” display — partial.

### 4.3 Marketing link generator

| ID   | Requirement                                           | Acceptance criteria                                       |
| ---- | ----------------------------------------------------- | --------------------------------------------------------- |
| A-20 | Enter **site page URL/path** → generate tracking link | Visit lands on target page with attribution preserved     |
| A-21 | Optional **campaign** name                            | Stored; usable in stats (campaign table optional phase 2) |
| A-22 | List created links: URL, creation date                | Create, delete; target URL not required to be editable    |
| A-23 | Click on marketing link                               | Visit logged; cookie set; redirect to target              |

**Prototype:** `/ref/[slug]` redirects to home only — **gap**.

### 4.4 Financial overview (statistics)

| ID   | Requirement                                               | Acceptance criteria                         |
| ---- | --------------------------------------------------------- | ------------------------------------------- |
| A-30 | **Pending / unpaid earnings** (eligible for next payout)  | Sum of Unpaid referrals not yet in a payout |
| A-31 | **Total paid out to date**                                | Sum of completed payouts                    |
| A-32 | Counts: unpaid vs paid referrals; visits; conversion rate | Documented formulas                         |
| A-33 | Per-link metrics (clicks, conversions, balance)           | Per marketing link                          |

**Prototype:** clicks, conversions, single balance — partial; lifetime paid and conversion rate — missing.

### 4.5 Referrals list (commissions)

| ID   | Requirement                                                                 | Acceptance criteria               |
| ---- | --------------------------------------------------------------------------- | --------------------------------- |
| A-40 | Table: reference, commission, **product description**, **status**, datetime | Paginated; optional status filter |
| A-41 | Statuses: Pending, Unpaid, Paid, Rejected                                   | Match admin/system                |
| A-42 | No customer PII                                                             | QA checklist                      |

**Prototype:** recent conversions without status/description — **gap**.

### 4.6 Visits log — should-have

| ID   | Requirement                                                           | Acceptance criteria |
| ---- | --------------------------------------------------------------------- | ------------------- |
| A-50 | Log: target URL, referring URL (or “direct”), converted Y/N, datetime | Paginated           |

**Prototype:** aggregate clicks only — **gap**.

### 4.7 Vouchers (discount codes)

| ID   | Requirement                                                | Acceptance criteria              |
| ---- | ---------------------------------------------------------- | -------------------------------- |
| A-60 | Partner creates voucher: code + discount % (within limits) | Unique code; applies at checkout |
| A-61 | List own vouchers                                          | Code and discount                |
| A-62 | Business rules (max %, expiry, count) — TBD                | Admin-configurable               |

**Prototype:** not implemented.

### 4.8 Settings and notifications

| ID   | Requirement                                                    | Acceptance criteria                   |
| ---- | -------------------------------------------------------------- | ------------------------------------- |
| A-70 | **Payment / notification email** (may differ from login email) | Used for commission and payout emails |
| A-71 | Toggle: notify on successful referral                          | Email when commission becomes Unpaid  |
| A-72 | Email when **payout initiated** (invoice request)              | Amount, period, instructions          |

**Prototype:** no settings UI; copy hints in i18n only — partial.

### 4.9 Payouts (partner view)

| ID   | Requirement                                        | Acceptance criteria                 |
| ---- | -------------------------------------------------- | ----------------------------------- |
| A-80 | Payout history: date, amount, status               | Read-only                           |
| A-81 | Instructions to send invoice to Datenschutzpartner | Static + dynamic amount from payout |
| A-82 | No “instant withdraw” or implied auto-transfer     | UX matches manual process           |

**Prototype:** payout data in dashboard schema; **UI missing**.

---

## 5. Admin requirements

### 5.1 Affiliate management

| ID   | Requirement                                            | Acceptance criteria                         |
| ---- | ------------------------------------------------------ | ------------------------------------------- |
| M-01 | Master list: all affiliates (active/rejected/inactive) | Email, ID, rates, balances, activity counts |
| M-02 | Approve/reject applications                            | Creates partner on approve                  |
| M-03 | Deactivate affiliate                                   | Attribution stops; data retained            |
| M-04 | Partner detail view                                    | Links, stats, referrals, payouts            |

**Prototype:** applications + flat conversions list — partial.

### 5.2 Referrals (deal tracking)

| ID   | Requirement                                                                             | Acceptance criteria           |
| ---- | --------------------------------------------------------------------------------------- | ----------------------------- |
| M-10 | Global referrals with filters: All / Pending / Unpaid / Paid / Rejected                 |                               |
| M-11 | Actions: accept (pending→unpaid), reject, edit amount (restricted), delete (restricted) | Audit log recommended         |
| M-12 | Per-referral “mark paid” — optional if batch-only                                       | Align with legacy if required |
| M-13 | Referral linked to order; order payment drives Pending→Unpaid                           |                               |

**Prototype:** not implemented.

### 5.3 Payout processing (critical)

| ID   | Requirement                                                                                     | Acceptance criteria                                                   |
| ---- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| M-20 | **Payout history:** ID, amount, affiliate, referral IDs, createdBy, method manual, status, date |                                                                       |
| M-21 | **Create payout:** select affiliate, date range, minimum earnings, preview                      | Preview lists unpaid referrals in range + total CHF                   |
| M-22 | **Commit payout**                                                                               | Record created; referrals marked Paid; **invoice-request email** sent |
| M-23 | CSV export (optional)                                                                           | Accounting export on commit                                           |
| M-24 | No in-ui bank transfer                                                                          | Copy states external payment                                          |

**Prototype:** not implemented; business meaning confirmed by client (payout = invoice signal).

### 5.4 Program settings (admin)

| ID   | Requirement                                                              | Acceptance criteria           |
| ---- | ------------------------------------------------------------------------ | ----------------------------- |
| M-30 | Global: commission rate, cookie days, payout threshold, quarter schedule | API + admin or config service |
| M-31 | Per-affiliate commission override                                        | Phase 2                       |

**Prototype:** `GET /affiliate/settings` partial.

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
(`commissionEmailSentTo`, `invoiceEmailSentTo`) and the admin UI confirms it in a toast.

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

**Admin:**

- Applications
- Affiliates
- Referrals
- Payouts (including create flow)

**Prototype today:** partner tabs Overview, Links, Referrals, Payouts, Settings and How it works (`?section=affiliate&tab=…`); admin `/account/affiliate/admin` has tabs Applications, Affiliates, Referrals (status filter, mark order paid, reject) and Payouts (history + create dialog with period preview and threshold hint).

**Code entry points:**

- Public: `app/affiliate/`, `app/ref/[slug]/`
- Account: `app/account/` section `affiliate` (`AffiliateSection`, one panel per tab in `app/account/_components/sections/affiliate/`)
- Admin: `app/account/affiliate/admin/` (`AffiliateAdminApp`)

---

## 9. Phasing

### Phase 1 — MVP (task parity + payout semantics)

- Deep link generator + link list
- Referral statuses + order-paid gating
- Partner: pending vs paid earnings, referrals table, payout history
- Partner settings + core emails (commission + payout invoice; backend only, not in the prototype)
- Admin: affiliate list, referral workflow, create/commit payout

### Phase 2

- Visits log, campaign analytics
- Vouchers + checkout integration
- CSV export, audit log, per-affiliate rates

### Phase 3 / optional

- Creative assets (Werbemittel), advanced reports
- Third-party payout provider

---

## 10. Open questions (client / finance / legal)

1. Fixed **quarterly payout calendar** vs admin-triggered only.
2. **CHF 50 threshold** — hard rule or legacy artifact combined with quarterly runs.
3. **Slug change:** redirect old `/ref/` URLs (301) vs invalidate.
4. Show numeric **Affiliate ID** in UI or slug only.
5. **Vouchers:** discount cap, who sets limits, stacking with other promos.
6. **Order reference** in partner UI — masked id sufficient?
7. **Pending referrals:** auto-accept vs admin accept (legacy had Pending).
8. Production domain (`.ch` vs `.com`).
9. Re-application after reject.
10. Refund/chargeback commission policy.

---

## 11. Prototype traceability

| PRD area                            | Prototype today                                          |
| ----------------------------------- | -------------------------------------------------------- |
| Application + admin approve         | Yes                                                      |
| `/ref/` + cookie + visits           | Yes (`?to=` target page and `campaign`, visit recorded)  |
| Editable affiliate ID (slug)        | Yes (Links tab)                                          |
| Marketing URL generator + link list | Yes (Links tab)                                          |
| Dashboard stats                     | Yes (Overview: earnings by status, visits, conversion)   |
| Referrals with status               | Yes (Overview latest 5, Referrals tab)                   |
| Payout history (partner)            | Yes (Payouts tab)                                        |
| Partner settings                    | Yes (notification email, referral notifications)         |
| Admin affiliates + payout flow      | Yes (Affiliates, Referrals, Payouts tabs; create dialog) |
| Vouchers, visits log                | No (Phase 2)                                             |

---

## 12. Release acceptance checklist

- [ ] E2E: marketing link click → paid purchase → referral Unpaid → admin payout → referral Paid + email.
- [ ] Unpaid customer order does not create Unpaid commission.
- [ ] Partner referrals contain no customer email/name.
- [ ] Admin payout commit is idempotent (no double-settle referrals).
- [ ] DE/EN i18n for all user-facing strings.
- [ ] Accessibility: tables, forms, notifications.
- [ ] `pnpm verify`; MSW/handlers aligned with agreed OpenAPI draft.

---

**Document owner:** Product  
**Engineering:** Frontend (v2), Backend (orders, email, persistence)  
**Next step:** Sign off §10 → break Phase 1 into epics → extend `api/affiliate.ts` and MSW per [data-layer.md](data-layer.md).
