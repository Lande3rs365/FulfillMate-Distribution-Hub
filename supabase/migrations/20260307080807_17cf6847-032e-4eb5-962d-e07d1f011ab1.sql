
-- Add woo_status and customer_phone to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS woo_status text DEFAULT 'processing';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;

-- Add resolution, return_qty, product_id, sku to returns  
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS resolution text DEFAULT 'approved';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS return_qty integer DEFAULT 1;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id);
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS sku text;

-- Add tracking fields to manufacturer_manifests
ALTER TABLE public.manufacturer_manifests ADD COLUMN IF NOT EXISTS request_date timestamptz;
ALTER TABLE public.manufacturer_manifests ADD COLUMN IF NOT EXISTS shipment_date timestamptz;
ALTER TABLE public.manufacturer_manifests ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.manufacturer_manifests ADD COLUMN IF NOT EXISTS eta timestamptz;
