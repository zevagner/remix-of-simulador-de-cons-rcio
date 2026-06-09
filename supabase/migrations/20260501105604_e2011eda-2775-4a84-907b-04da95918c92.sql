-- Quick Win 2: simplifica RLS de assembly_results
-- Antes: EXISTS(SELECT FROM groups WHERE id = ... AND is_approved) → executado por linha
-- Depois: is_approved(auth.uid()) → executado 1x e usa cache do plano

DROP POLICY IF EXISTS "Approved users can read assembly_results" ON public.assembly_results;

CREATE POLICY "Approved users can read assembly_results"
ON public.assembly_results
FOR SELECT
TO authenticated
USING (public.is_approved(auth.uid()));