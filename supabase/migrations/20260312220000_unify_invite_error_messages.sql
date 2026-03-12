-- Unify invite acceptance error messages to prevent invite code enumeration.
-- Previously, different messages revealed whether a code existed vs. belonged to
-- a different email. Both cases now return the same generic message.

CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv record;
  _user_email text;
BEGIN
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO _inv FROM public.invitations
    WHERE token = _token
      AND accepted_at IS NULL
      AND expires_at > now();

  -- Unified message: don't reveal whether token exists vs. wrong email
  IF NOT FOUND OR lower(_inv.invitee_email) != lower(_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found, expired, or already used.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_companies WHERE user_id = auth.uid() AND company_id = _inv.company_id) THEN
    UPDATE public.invitations SET accepted_at = now() WHERE id = _inv.id;
    RETURN jsonb_build_object('success', true, 'message', 'Already a member of this company.', 'company_id', _inv.company_id);
  END IF;

  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (auth.uid(), _inv.company_id, _inv.role);

  UPDATE public.invitations SET accepted_at = now() WHERE id = _inv.id;

  RETURN jsonb_build_object('success', true, 'message', 'Invitation accepted.', 'company_id', _inv.company_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv record;
  _user_email text;
BEGIN
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO _inv FROM public.invitations
    WHERE upper(invite_code) = upper(_code)
      AND accepted_at IS NULL
      AND expires_at > now();

  -- Unified message: don't reveal whether code exists vs. wrong email
  IF NOT FOUND OR lower(_inv.invitee_email) != lower(_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_companies WHERE user_id = auth.uid() AND company_id = _inv.company_id) THEN
    UPDATE public.invitations SET accepted_at = now() WHERE id = _inv.id;
    RETURN jsonb_build_object('success', true, 'message', 'Already a member of this company.', 'company_id', _inv.company_id);
  END IF;

  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (auth.uid(), _inv.company_id, _inv.role);

  UPDATE public.invitations SET accepted_at = now() WHERE id = _inv.id;

  RETURN jsonb_build_object('success', true, 'message', 'Invitation accepted.', 'company_id', _inv.company_id);
END;
$$;
