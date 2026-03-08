

# Gaps and Additions for the Returns Flow

After reviewing the full codebase, here's what we've covered and what's still missing:

## Already Built
- Multi-step return form (order lookup, item select, reason, confirm)
- 8 reason categories with stock outcome mapping
- Return record insert + stock movement + inventory update
- Returns dashboard table

## Not Yet Implemented (from our discussion)
1. **Order status update on return** -- we agreed on this but haven't coded it yet
2. **Order event audit log** -- insert into `order_events` on return processing
3. **Orders cache invalidation** -- so dashboard reflects new status immediately

## Additional Gaps Worth Addressing

### 3. Duplicate return prevention
Currently nothing stops a user from logging a return for the same order item twice. We should check if a return already exists for that order + item before allowing submission, and show a warning.

### 4. Exception auto-creation for `on_hold` returns
The Exceptions page already has reason types like `returned_item` and `customs`. When a return sets an order to `on_hold`, we should auto-create an exception record so it appears on the Exceptions dashboard for follow-up. This connects the two workflows.

### 5. Partial vs full return indicator
The table doesn't show whether a return covers the full order or just some items. Adding a "Qty" column or a partial/full badge would help warehouse staff at a glance.

### 6. Form UX improvements
- Auto-select item if order has only one line item
- Show product name (not just SKU) in item buttons
- Auto-focus order number input on dialog open

## Proposed Implementation (single file change)

**`src/pages/ReturnsPage.tsx`** -- inside `handleConfirm`:

```text
Current flow:
  insert return → stock movement → inventory update → done

Proposed flow:
  insert return → stock movement → inventory update
  → update order status (processing / on_hold)
  → insert order_event audit record
  → if on_hold: insert exception record
  → invalidate orders + exceptions cache
  → done
```

**Status mapping:**

| Reason | Order Status | Exception Created? |
|---|---|---|
| Exchanged | `processing` | No |
| Missing Item | `processing` | No |
| Incorrect Item | `processing` | No |
| Warranty Replacement | `on_hold` | Yes |
| Damaged on Arrival | `on_hold` | Yes |
| Shipping | `on_hold` | Yes |
| Customs | `on_hold` | Yes |
| Other | `on_hold` | Yes |

**Duplicate check:** Before insert, query `returns` for matching `order_id` + `product_id` + `sku`. If found, show a warning toast and block submission.

**Table enhancement:** Add a "Qty" column showing `return_qty` to indicate partial vs full returns.

No database changes needed -- all tables and columns already exist.

