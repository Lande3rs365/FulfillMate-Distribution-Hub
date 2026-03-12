
-- WooCommerce integration credentials table (one row per company)
CREATE TABLE public.woocommerce_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  store_url text NOT NULL,
  consumer_key text NOT NULL,
  consumer_secret text NOT NULL,
  last_sync_at timestamptz,
  last_sync_order_count integer DEFAULT 0,
  last_sync_status text DEFAULT 'never',
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- RLS
ALTER TABLE public.woocommerce_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company read" ON public.woocommerce_integrations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Company write" ON public.woocommerce_integrations
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Company update" ON public.woocommerce_integrations
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Company delete" ON public.woocommerce_integrations
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Auto-update updated_at
CREATE TRIGGER update_woocommerce_integrations_updated_at
  BEFORE UPDATE ON public.woocommerce_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
