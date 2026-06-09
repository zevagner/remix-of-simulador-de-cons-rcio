-- Onda 2 Comunidade: liberar criação/resposta/voto para qualquer usuário aprovado
-- e adicionar trigger server-side de PII strip em community_cases.

-- 1) community_cases: INSERT sem gate de nível (mantém is_approved)
DROP POLICY IF EXISTS "Users create community cases" ON public.community_cases;
CREATE POLICY "Users create community cases"
  ON public.community_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved(auth.uid())
  );

-- 2) community_replies: INSERT sem gate de nível 3
DROP POLICY IF EXISTS "Users create replies" ON public.community_replies;
CREATE POLICY "Users create replies"
  ON public.community_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.community_cases c
      WHERE c.id = community_replies.case_id
        AND (
          c.user_id = auth.uid()
          OR c.is_private = false
          OR public.community_user_level(auth.uid()) >= 3
        )
    )
  );

-- 3) community_reply_votes: INSERT sem gate de nível 2
DROP POLICY IF EXISTS "Users vote on replies" ON public.community_reply_votes;
CREATE POLICY "Users vote on replies"
  ON public.community_reply_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved(auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.community_replies r
      WHERE r.id = community_reply_votes.reply_id
        AND r.user_id = auth.uid()
    )
  );

-- 4) Trigger de PII strip em community_cases (defesa server-side)
CREATE OR REPLACE FUNCTION public.community_strip_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.title IS NOT NULL THEN
    -- CPF (000.000.000-00 ou 00000000000)
    NEW.title := regexp_replace(NEW.title, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '[CPF]', 'g');
    -- CNPJ
    NEW.title := regexp_replace(NEW.title, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '[CNPJ]', 'g');
    -- Telefone BR
    NEW.title := regexp_replace(NEW.title, '(\+55\s?)?\(?\d{2}\)?\s?9?\d{4}[-.\s]?\d{4}', '[TEL]', 'g');
    -- E-mail
    NEW.title := regexp_replace(NEW.title, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[EMAIL]', 'g');
  END IF;

  IF NEW.summary IS NOT NULL THEN
    NEW.summary := regexp_replace(NEW.summary, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '[CPF]', 'g');
    NEW.summary := regexp_replace(NEW.summary, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '[CNPJ]', 'g');
    NEW.summary := regexp_replace(NEW.summary, '(\+55\s?)?\(?\d{2}\)?\s?9?\d{4}[-.\s]?\d{4}', '[TEL]', 'g');
    NEW.summary := regexp_replace(NEW.summary, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[EMAIL]', 'g');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_strip_pii ON public.community_cases;
CREATE TRIGGER trg_community_strip_pii
  BEFORE INSERT OR UPDATE OF title, summary ON public.community_cases
  FOR EACH ROW EXECUTE FUNCTION public.community_strip_pii();