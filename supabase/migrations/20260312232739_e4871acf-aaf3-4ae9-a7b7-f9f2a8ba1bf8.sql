
-- ShipStation integrations table
CREATE TABLE public.shipstation_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key text NOT NULL,
  api_secret text NOT NULL,
  sync_interval_minutes integer NOT NULL DEFAULT 0,
  last_sync_at timestamptz,
  last_sync_order_count integer DEFAULT 0,
  last_sync_shipment_count integer DEFAULT 0,
  last_sync_status text DEFAULT 'never',
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipstation_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read shipstation integrations" ON public.shipstation_integrations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE POLICY "Admins can create shipstation integrations" ON public.shipstation_integrations
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE POLICY "Admins can update shipstation integrations" ON public.shipstation_integrations
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE POLICY "Admins can delete shipstation integrations" ON public.shipstation_integrations
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE TRIGGER update_shipstation_integrations_updated_at
  BEFORE UPDATE ON public.shipstation_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tawk.to settings table
CREATE TABLE public.tawk_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  property_id text NOT NULL,
  widget_id text NOT NULL DEFAULT 'default',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tawk_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read tawk settings" ON public.tawk_settings
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE POLICY "Admins can create tawk settings" ON public.tawk_settings
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE POLICY "Admins can update tawk settings" ON public.tawk_settings
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE POLICY "Admins can delete tawk settings" ON public.tawk_settings
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
  );

CREATE TRIGGER update_tawk_settings_updated_at
  BEFORE UPDATE ON public.tawk_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
