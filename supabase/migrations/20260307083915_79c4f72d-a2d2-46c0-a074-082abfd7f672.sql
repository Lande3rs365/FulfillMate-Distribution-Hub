
-- 1. Create a secure function for onboarding that atomically creates company + membership
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  _company_id uuid,
  _company_name text,
  _company_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create the company
  INSERT INTO public.companies (id, name, code)
  VALUES (_company_id, _company_name, _company_code);

  -- Link the calling user as owner
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (auth.uid(), _company_id, 'owner');
END;
$$;

-- 2. Drop the old permissive INSERT policy on user_companies
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.user_companies;

-- 3. Create a restrictive INSERT policy: users can only self-insert with 'member' role
-- This prevents privilege escalation (can't self-assign 'owner' or 'admin')
-- Onboarding uses the SECURITY DEFINER function above instead
CREATE POLICY "Users can insert own memberships as member only"
  ON public.user_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'member'
  );
