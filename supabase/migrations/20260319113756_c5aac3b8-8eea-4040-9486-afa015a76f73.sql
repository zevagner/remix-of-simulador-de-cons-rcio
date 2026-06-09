-- Change default to true: new users are approved automatically
ALTER TABLE public.profiles ALTER COLUMN approved SET DEFAULT true;

-- Approve all existing users
UPDATE public.profiles SET approved = true WHERE approved = false;