# Contact and Address Collection — Audit

Review of all places in `datenschutzpartner-v2` where users are asked for contact details or addresses.

---

## 1. Privacy Policy Generator — Questionnaire (wizard)

**Screen:** Questionnaire step after website scan  
**Code:** `app/result/steps/QuestionnaireStep.tsx`

| Field                           | Required?                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Company name (legal entity)     | Yes                                                                                                                      |
| Street                          | Yes                                                                                                                      |
| Postal code, City               | Yes                                                                                                                      |
| Address line 2                  | No                                                                                                                       |
| Email                           | Yes                                                                                                                      |
| Country (controller)            | Required in backend logic, but **no separate UI field** — defaults to Switzerland; can be filled via optional UID lookup |
| UID lookup (CHE / company name) | Optional — auto-fills name, street, postal code, city, country                                                           |

### If DPO = yes

| Field                                  | Required?                          |
| -------------------------------------- | ---------------------------------- |
| DPO company name                       | Yes                                |
| DPO designation                        | No                                 |
| DPO street, postal code, city, country | Yes                                |
| DPO email                              | In schema, but **not shown in UI** |

### If third-party EU representative = yes (GDPR applicable)

| Field                                           | Required? |
| ----------------------------------------------- | --------- |
| Name, street, postal code, city, country, email | All yes   |

---

## 2. Privacy Policy Generator — EU Rep step (wizard add-on)

**Screen:** EU Rep step at end of generator wizard  
**Code:** `app/result/steps/EuRepStep.tsx`, `EuRepWizardOffer.tsx`, `EuRepContractFields.tsx`

| Field             | Required?         |
| ----------------- | ----------------- |
| Legal entity name | Yes               |
| Forwarding email  | Yes               |
| Postal address    | **Not collected** |

---

## 3. Privacy Policy Generator — Summary (wizard)

**Screen:** Account creation before trial — **guests only** (signed-in users skip this step)  
**Code:** `app/result/steps/SummaryStep.tsx`

| Field             | Required? |
| ----------------- | --------- |
| Account email     | Yes       |
| Accept terms      | Yes       |
| Newsletter opt-in | No        |

---

## 4. EU Representation — standalone checkout

**Screen:** “Add a new legal entity” checkout  
**Code:** `app/account/eu-rep/checkout/_components/EuRepCheckoutApp.tsx`, `EuRepContractFields.tsx`

| Field                      | Required?                             |
| -------------------------- | ------------------------------------- |
| Legal entity name          | Yes                                   |
| Forwarding email           | Yes                                   |
| Street (postal line 1)     | Yes                                   |
| Address line 2             | No                                    |
| Postal code, City, Country | Yes (country defaults to Switzerland) |

> **This is the only place where we collect the full postal address for an EU Rep entity.**

---

## 5. Account — EU Rep contract (edit)

**Screen:** EU Rep contract detail in account  
**Code:** `app/account/_components/sections/EuRepLegalEntityPanel.tsx`

| Field             | Editable?                                            |
| ----------------- | ---------------------------------------------------- |
| Legal entity name | Yes                                                  |
| Forwarding email  | Yes                                                  |
| Postal address    | **Display only** — not editable in UI after creation |

---

## 6. Account — Profile

**Screen:** Account Details → Profile  
**Code:** `app/account/_components/sections/ProfileSection.tsx`

| Field                 | Required?                  |
| --------------------- | -------------------------- |
| First name, Last name | Yes                        |
| Email                 | Yes                        |
| Password change       | Optional (separate dialog) |

---

## 7. Account — Billing / Payment details

**Screen:** Account → Payment details  
**Code:** `app/account/_components/sections/PaymentDetailsSection.tsx`

| Field                      | Required? |
| -------------------------- | --------- |
| Billing email              | Yes       |
| First name, Last name      | Yes       |
| Company                    | No        |
| Street (line 1)            | Yes       |
| Address line 2             | No        |
| Postal code, City, Country | Yes       |
| VAT ID                     | No        |

**Note:** Checkout screens (policy trial, generator upgrade, EU Rep) do **not** ask for billing address.

---

## 8. Contact page

**Code:** `app/contact/_components/ContactForm.tsx`

| Field   | Required? |
| ------- | --------- |
| Name    | Yes       |
| Company | No        |
| Email   | Yes       |
| Subject | Yes       |
| Message | Yes       |

The company address shown on the page is static content, not a form field.

---

## 9. Auth & newsletter

| Location                                         | Fields          |
| ------------------------------------------------ | --------------- |
| Login                                            | Email, password |
| Forgot password                                  | Email           |
| Newsletter section (landing)                     | Email only      |
| EU Rep questionnaire outcome — newsletter signup | Email only      |

---

## 10. Display only (no user input)

- Footer — Datenschutzpartner AG address
- Contact page sidebar — address + email
- EU Rep representative block (Hamburg address) in policy / account
- Generated privacy policy document — EU rep section

---

## Gaps & inconsistencies worth reviewing

1. **EU Rep postal address** is only collected at standalone checkout; the wizard EU Rep step collects name + forwarding email only.
2. **Controller country** is required in the questionnaire schema but has no dedicated UI field.
3. **DPO email** exists in the questionnaire schema but is not shown in the UI.
4. **Signed-in users** skip the Summary step, so we don't re-ask for account email during the wizard.
5. **Academy membership** — no billing/contact form in the current prototype.

---

## Related code references

| Area                | Schema / types                                                       |
| ------------------- | -------------------------------------------------------------------- |
| Questionnaire       | `api/generator.ts` — `questionnaireFormSchema`                       |
| EU Rep contract     | `api/eu-rep.ts` — `euRepContractSchema`, `euRepContractUpdateSchema` |
| EU Rep checkout     | `api/checkout.ts` — `euRepCheckoutEntitySchema`                      |
| Billing             | `api/account.ts` — `billingAddressSchema`                            |
| Profile             | `api/account.ts` — `profileSchema`                                   |
| Contact form        | `api/contact-messages.ts` — `contactMessageCreateSchema`             |
| Auth / registration | `api/auth.ts` — `registerSchema`                                     |
| UID lookup          | `api/uid-registry.ts` — `uidCompanySchema`                           |
