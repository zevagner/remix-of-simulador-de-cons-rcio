ALTER TABLE public.assembly_imports
  ADD COLUMN IF NOT EXISTS parser_version text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS rolled_back_by uuid;

CREATE INDEX IF NOT EXISTS idx_assembly_imports_content_hash
  ON public.assembly_imports (content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assembly_imports_parser_version
  ON public.assembly_imports (parser_version);

CREATE INDEX IF NOT EXISTS idx_assembly_imports_status_created_at
  ON public.assembly_imports (status, created_at DESC);

COMMENT ON COLUMN public.assembly_imports.parser_version IS 'PARSER_VERSION do edge no momento do commit (ex: svr-parser-1.0.0). Vazio = legado.';
COMMENT ON COLUMN public.assembly_imports.content_hash IS 'SHA-256 do payload bruto enviado ao parser. Permite dedupe e replay.';
COMMENT ON COLUMN public.assembly_imports.duration_ms IS 'Duração total do commit no servidor (ms).';
COMMENT ON COLUMN public.assembly_imports.rolled_back_by IS 'Usuário que executou o rollback (auth.uid).';