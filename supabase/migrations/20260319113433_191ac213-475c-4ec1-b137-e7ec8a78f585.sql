-- Add approved column to profiles (default false = needs admin approval)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Auto-approve the existing admin user
UPDATE public.profiles SET approved = true WHERE user_id = '6c4693b2-3114-44b5-990a-80d9e64a424c';

-- Create a security definer function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND approved = true
  )
$$;