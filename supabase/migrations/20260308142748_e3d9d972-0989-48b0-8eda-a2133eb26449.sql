
-- Mark placeholder/shell orders (no customer data, no amount) from processing to pending
-- These are Pirate Ship import shells awaiting WooCommerce data reconciliation
UPDATE public.orders 
SET status = 'pending', woo_status = 'pending'
WHERE status = 'processing' 
  AND customer_name IS NULL 
  AND total_amount IS NULL
  AND woo_status = 'processing';
