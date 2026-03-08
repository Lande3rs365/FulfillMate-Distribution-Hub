

## Plan: Tabbed Product Catalog with Parent/Variant Hierarchy

### Architecture Decision

The `products` table becomes the **source of truth** for the catalogue, seeded from the SKU Framework XLSX. When WooCommerce orders arrive, the `order_items.sku` is joined against `products.sku` to enrich display -- WC product names/descriptions are ignored for variable products.

### Database Migration

Add 3 columns to `products`:

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS parent_product_id uuid REFERENCES products(id),
  ADD COLUMN IF NOT EXISTS row_type text NOT NULL DEFAULT 'standalone';
```

No new RLS needed -- existing company-scoped policies already cover all columns.

### 7 Tabs (matching the spreadsheet sheets)

```text
[ Shafts | Playing Cues | Break & Jump | Cases | Accessories | Apparel | All ]
```

Each tab filters by `category`. The "All" tab shows everything with a global search.

### Per-Tab Layout

| Tab | Category filter | Hierarchy | Columns |
|-----|----------------|-----------|---------|
| **Shafts** | `shaft` | Flat (all standalone) | SKU, Model, Joint Type, Tip Size |
| **Playing Cues** | `playing_cue` | Collapsible parent/variant | SKU, Model, Tier, Wrap, Wrap Description |
| **Break & Jump** | `break_cue`, `jump_cue`, `break_jump` | Flat | SKU, Name, Cue Type, Wrap |
| **Cases** | `case` | Flat | SKU, Name, Type (HC/SC), Colour, Size |
| **Accessories** | `accessory` | Flat, grouped by sub-cat headers | SKU, Name, Sub-Cat, Variant |
| **Apparel** | `apparel` | Collapsible parent/variant | SKU, Design, Gender, Type, Colour, Size |
| **All** | none | Flat | SKU, Name, Category, Row Type |

Tab labels include count badges.

### Parent/Variant Detection

Uses the explicit `Row Type` column from the spreadsheet at import time (PARENT/VARIANT markers on Playing Cues and Apparel). For the segment-count fallback on manual "Add Product":

- Playing Cues: `PC-TIER-MODEL` = parent, `PC-TIER-MODEL-WRAP` = variant
- Apparel: size column = "PARENT" means parent; otherwise variant linked to nearest parent above
- All other categories: always `standalone`

### Collapsible Rows (Playing Cues + Apparel)

- Parent row: bold text, ChevronRight/Down toggle, variant count badge (e.g. "3 variants")
- Variant rows: indented with left padding, muted styling
- Click parent to expand/collapse
- Inline editing works on all rows

### Seed Import from XLSX

New `useImportSkuFramework` mutation in `useSupabaseData.ts`:

1. Parse sheets 2-7 via SheetJS (already installed)
2. Derive `category` from SKU prefix: `PC-` -> `playing_cue`, `SH-` -> `shaft`, `BK-` -> `break_cue`, `JP-` -> `jump_cue`, `BJ-` -> `break_jump`, `CS-` -> `case`, `ACC-` -> `accessory`, `APP-` -> `apparel`
3. Read `Row Type` column where present (Playing Cues, Apparel) for parent/variant
4. First pass: insert all parents (batches of 100)
5. Second pass: insert variants with `parent_product_id` resolved by matching the parent SKU prefix
6. Accessible via "Import SKU Framework" button on page header (replaces old "Sync from Orders")

### Add Product Modal

- Button per tab: "+ Add Product"
- Pre-fills `category` from active tab
- For Playing Cues / Apparel: "Parent" dropdown filtered to existing parents in that category; selecting parent sets `row_type = 'variant'`; leaving blank sets `row_type = 'parent'`
- For flat tabs: `row_type` auto-set to `standalone`
- Fields: SKU, Name, plus tab-specific metadata (stored in `description` as structured JSON or parsed from SKU)

### WooCommerce Order Enrichment

Update order display logic: when showing order line items, join `order_items.sku` against `products.sku` to pull the correct product name, category, and hierarchy info from the products table instead of relying on WC product data.

### Files to Change

| File | Change |
|------|--------|
| **DB Migration** | Add `category`, `parent_product_id`, `row_type` columns |
| `src/types/database.ts` | Add 3 fields to `Product` interface |
| `src/pages/ProductsPage.tsx` | Full rewrite: 7 tabs, collapsible rows, import button, add product dialog, no price columns |
| `src/hooks/useSupabaseData.ts` | Replace `useSyncProducts` with `useImportSkuFramework`; keep `useProducts` |
| `src/lib/csvParsers.ts` | Add `parseSkuFrameworkXlsx()` parser for the v4 spreadsheet format |

