-- 1) Add like_count column to community_cases
ALTER TABLE public.community_cases
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- 2) Likes table for cases (the "question" itself)
CREATE TABLE IF NOT EXISTS public.community_case_likes (
  case_id uuid NOT NULL REFERENCES public.community_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_case_likes_user ON public.community_case_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_case_likes_case ON public.community_case_likes(case_id);

ALTER TABLE public.community_case_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Case likes visible to authenticated" ON public.community_case_likes;
CREATE POLICY "Case likes visible to authenticated"
  ON public.community_case_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users insert own case like" ON public.community_case_likes;
CREATE POLICY "Users insert own case like"
  ON public.community_case_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own case like" ON public.community_case_likes;
CREATE POLICY "Users delete own case like"
  ON public.community_case_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) Toggle RPC
CREATE OR REPLACE FUNCTION public.toggle_case_like(p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing uuid;
  v_count integer;
  v_liked boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT user_id INTO v_existing
  FROM public.community_case_likes
  WHERE case_id = p_case_id AND user_id = v_user;

  IF v_existing IS NOT NULL THEN
    DELETE FROM public.community_case_likes
    WHERE case_id = p_case_id AND user_id = v_user;
    UPDATE public.community_cases
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = p_case_id
      RETURNING like_count INTO v_count;
    v_liked := false;
  ELSE
    INSERT INTO public.community_case_likes (case_id, user_id) VALUES (p_case_id, v_user);
    UPDATE public.community_cases
      SET like_count = like_count + 1
      WHERE id = p_case_id
      RETURNING like_count INTO v_count;
    v_liked := true;
  END IF;

  RETURN jsonb_build_object('liked', v_liked, 'like_count', COALESCE(v_count, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_case_like(uuid) TO authenticated;