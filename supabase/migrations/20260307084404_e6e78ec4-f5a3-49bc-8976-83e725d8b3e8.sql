
-- Remove the permissive INSERT policy that allows any user to self-join any company
DROP POLICY IF EXISTS "Users can insert own memberships as member only" ON public.user_companies;
