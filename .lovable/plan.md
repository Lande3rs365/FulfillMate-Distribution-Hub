

## Plan: Consolidate to Single JFlowers Workspace

### What You're Asking

Use **JFlowers** as your only workspace — remove TH0.tech — and confirm JFlowers is production-ready and secure.

### Current Security Status

JFlowers is already production-grade:
- **Row Level Security (RLS)** on every table, scoped by `company_id`
- **Owner/Admin role enforcement** for settings, integrations, and team management
- **Integration credentials** protected by role-based RLS + Edge Function role checks + SSRF protection
- **Company creation** locked behind a `SECURITY DEFINER` RPC (no direct inserts)
- **Multi-tenant isolation** — all queries filter by your company membership

### Implementation Steps

1. **Delete TH0.tech data** — Remove the TH0.tech company and all its associated records (orders, exceptions, inventory, manifests, intake logs, user_companies membership) via a database migration. Foreign key cascades will handle most child records.

2. **Clean up localStorage** — Clear any cached `fulfillmate_company_id` pointing to the old TH0 company so the app defaults to JFlowers on next load.

3. **No code changes needed** — The company switcher will naturally hide when only one company exists (it already checks `companies.length > 0` before rendering).

### What This Means for You

- JFlowers becomes your single workspace in both the editor preview and the published site
- You upload real data (CSVs, SKU framework) and connect integrations (WooCommerce, ShipStation) directly against JFlowers
- All security layers remain active — your data is isolated and role-protected

