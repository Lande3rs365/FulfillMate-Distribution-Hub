
-- Add contact fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add contact fields to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone text;

-- Add contact fields to stock_locations
ALTER TABLE public.stock_locations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.stock_locations ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.stock_locations ADD COLUMN IF NOT EXISTS phone text;
