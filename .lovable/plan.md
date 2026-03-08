

## Plan: Safe Product Catalog Seed from Master Spreadsheet

### Problem
The returns form (and inventory/stock ledger next) depends on the `products` table having SKU, name, and pricing data. Currently, order items may reference SKUs that don't have matching product records, which means the returns form shows raw SKU codes instead of readable product names.

### Approach — Low Hallucination Risk

Rather than having AI interpret the line-item text strings (e.g. "1x BRKR Blue (Leather Sports Wrap)") which risks corruption, we take a **two-pass safe approach**:

**Pass 1: Import orders + shipments via existing parsers**
- The spreadsheet pages match your existing WooCommerce and Pirate Ship CSV formats
- Use the already-built `csvParsers.ts` auto-detection and `importHelpers.ts` upsert logic
- This is already tested and safe — no new code needed

**Pass 2: Extract unique products from imported order items**
- Add a "Sync Products from Orders" utility button on the Inventory or Uploads page
- Logic: query `order_items` that have a `sku` but no matching `products.sku` record
- For each unmatched SKU, create a **stub product** with just `sku` and `name = sku` (no guessing)
- Staff can then manually enrich product records (name, cost, weight) from a product management view

This means:
- **Zero hallucination risk** — we only create what's explicitly in the database
- **No corrupted records** — stub products are safe placeholders
- **Returns form immediately works** because `order_items.product_id` can now join to real product rows

### What to Cover Before Moving to Inventory

1. **Import this spreadsheet** through the existing Uploads page (already supported)
2. **Add a "Sync Products" action** that creates stub product records from unmatched order_items SKUs
3. **Add a simple Products management page** — table view with inline edit for name, unit_cost, sale_price, reorder_point — so staff can flesh out the stubs
4. **Verify returns form** pulls product names correctly after sync

### Files to Change
- `src/pages/UploadsPage.tsx` — no changes needed, existing import handles this format
- `src/hooks/useSupabaseData.ts` — add `useSyncProducts` mutation hook
- `src/pages/InventoryPage.tsx` — add "Sync Products from Orders" button
- New: `src/pages/ProductsPage.tsx` — simple CRUD table for product catalog
- `src/App.tsx` — register Products route
- `src/components/AppSidebar.tsx` — add Products nav item

### Technical Detail
The sync mutation:
```sql
-- Pseudocode for the client-side logic
SELECT DISTINCT oi.sku FROM order_items oi
LEFT JOIN products p ON p.sku = oi.sku AND p.company_id = ?
WHERE oi.sku IS NOT NULL AND p.id IS NULL
-- Then INSERT INTO products (company_id, sku, name) for each
```

