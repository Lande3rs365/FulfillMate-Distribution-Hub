
-- Create purchased_addons table
CREATE TABLE public.purchased_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  addon_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  stripe_payment_id text,
  purchased_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchased_addons ENABLE ROW LEVEL SECURITY;

-- RLS: company members can read their company's add-ons
CREATE POLICY "Company members can view purchased addons"
  ON public.purchased_addons
  FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- RLS: insert only via edge function (service role), but allow owners/admins as fallback
CREATE POLICY "Owners and admins can insert purchased addons"
  ON public.purchased_addons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids(auth.uid()))
    AND (user_has_role(company_id, 'owner') OR user_has_role(company_id, 'admin'))
    AND purchased_by = auth.uid()
  );
