-- Auto-assign reasons for non-on-hold exception types
UPDATE public.exceptions SET reason = 'returned_item' WHERE reason IS NULL AND exception_type = 'damaged_in_transit';
UPDATE public.exceptions SET reason = 'need_shipping_dets' WHERE reason IS NULL AND exception_type = 'delivery_failure';
UPDATE public.exceptions SET reason = 'customs' WHERE reason IS NULL AND exception_type = 'carrier_delay';
UPDATE public.exceptions SET reason = 'oos' WHERE reason IS NULL AND exception_type IN ('short_shipment', 'stock_discrepancy', 'inventory_discrepancy');