

# Fixing the Test ↔ Live Disconnect

## Root Cause

The editor preview and published site use **isolated databases**. Your profile, company, onboarding status, and all imported data exist only in the test database. When you open the published URL, the live database is empty — so CompanyGate redirects you to onboarding, pages show no data, and badges show zero counts.

This is by design for safety, but it creates a frustrating experience. Here is a plan to address each issue layer:

---

## 1. Re-onboard on the Published Site

You need to sign up / log in and complete onboarding on the published URL (`shipment-tally-hub.lovable.app`) once. This creates your profile, company, and membership in the live database. After that, authentication will persist normally.

**No code change needed** — just a one-time action on your part.

## 2. Re-import Data on Live

After onboarding on the published site, re-upload the SKU framework and trigger WooCommerce / ShipStation syncs from the Integrations page. This populates the live database with real operational data.

## 3. Code Improvements to Reduce Friction

### 3a. Graceful empty states instead of broken-looking pages
- Audit Dashboard, Orders, Inventory, Shipments pages to ensure they show helpful empty states (e.g., "No orders yet — connect WooCommerce to get started") instead of blank tables when queries return zero rows.
- The `EmptyState` component already exists — wire it into pages that lack it.

### 3b. CompanyGate resilience
- Currently, if the profile query fails (network blip), `onboardingCompleted` defaults to `false` and the user gets kicked to onboarding. Add a retry or distinguish "no profile" from "query failed".

### 3c. Badge hooks handle zero data gracefully
- `useMobileTabBadges` already returns `{ exceptions: 0, processing: 0, lowStock: 0 }` as default — this is fine. No change needed.

### 3d. Session persistence
- Auth sessions are already configured with `persistSession: true` and `autoRefreshToken: true`. If you're getting logged out, it may be due to switching between test/live URLs (different auth databases). This is expected.

---

## Summary of Code Changes

| Change | File(s) | Effort |
|--------|---------|--------|
| Add retry/error distinction in CompanyGate | `CompanyGate.tsx` | Small |
| Wire EmptyState into data pages missing it | `OrdersPage`, `ShipmentsPage`, `InventoryPage`, `Dashboard` | Medium |
| Add "getting started" guidance on empty dashboard | `Dashboard.tsx` | Small |

## Immediate Action Required From You

1. Open `https://shipment-tally-hub.lovable.app`
2. Sign up / log in with your real credentials
3. Complete the onboarding flow
4. Re-connect integrations and import data

Then I can implement the code resilience improvements above.

