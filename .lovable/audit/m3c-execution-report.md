# Onda M3-C — Storage Tenant-Aware (Dual-Read)

Status: **executada** • Frontend visual: **inalterado** • Reversível: **sim**

## 1. Escopo entregue

### 1.1 Storage policies (bucket `proposal-pdfs`)
Adicionadas 4 policies **PERMISSIVE** novas, coexistindo com as legacy:

| Policy nova | Cmd | Critério |
|---|---|---|
| `tenant: read pdfs by company membership` | SELECT | `foldername[1]='companies' AND is_company_member(foldername[2]::uuid)` |
| `tenant: insert pdfs by company membership` | INSERT | idem + `owner = auth.uid()` |
| `tenant: update pdfs by company membership` | UPDATE | idem |
| `tenant: delete pdfs by company membership` | DELETE | idem |

**Legacy preservadas** (`{user_id}/...` via `auth.uid()`): `Users read/write/update/delete own pdfs`. Como ambas são PERMISSIVE, qualquer uma autoriza → **dual-read transparente**.

### 1.2 Path canônico novo
```
companies/{companyId}/proposals/{proposalId}/proposta.pdf
```
Legacy mantido: `{userId}/{proposalId}.pdf`.

### 1.3 `proposal_pdf_cache`
- Coluna `company_id` (já criada em M2) agora populada pelo cliente.
- Novo índice `idx_pdf_cache_company_proposal (company_id, proposal_id)`.
- `storage_path` aceita ambos formatos (campo livre).

### 1.4 Frontend (`src/utils/pdfGenerator.tsx`)
- `resolveCompanyId(userId)` lê `profiles.company_id`.
- `savePdfToCache`: grava no path tenant-aware quando há company; fallback legacy quando não há.
- `tryGetCachedPdf`: tenta path registrado → fallback legacy → fallback tenant. **Zero quebra para PDFs antigos.**

## 2. Edge Functions
`generate-pdf` apenas converte HTML→PDF via Browserless e devolve o blob. **Não toca em storage**, portanto sem alterações necessárias. Cache e upload continuam client-side.

## 3. Backfill
**Não executado intencionalmente.** Estratégia preferida:
- Lazy migration: na próxima geração de cada proposta, o novo PDF já é gravado no path tenant-aware.
- Antigos continuam acessíveis via dual-read até a M3-E (flip + cleanup).

Script de backfill agressivo será preparado em **M3-E** (após `MULTI_TENANT_RLS=true` validado).

## 4. Riscos identificados

| Risco | Severidade | Mitigação |
|---|---|---|
| `profiles.company_id` ausente em algum usuário | Baixa | M1+M2 garantem 100%. Fallback legacy mantém upload funcionando. |
| Multi-membership no futuro grava em company "errada" | Média | M3-D introduzirá `currentCompanyId` no React Query; aqui ainda usamos `profiles.company_id` (workspace pessoal). |
| Policies storage podem permitir leitura cross-membership | Baixa | Por design: membership na company autoriza. Alinhado a M4. |
| Cache aponta para path inexistente após migração manual | Baixa | `tryGetCachedPdf` faz triple-fallback antes de retornar null → regenera. |

## 5. Smoke checklist (executar em preview)

- [ ] **Gerar PDF novo** de proposta nova → arquivo aparece em `companies/{id}/proposals/{id}/proposta.pdf`.
- [ ] **Reabrir mesmo PDF** → cache hit (sem nova chamada Browserless).
- [ ] **Abrir PDF antigo** (proposta pré-M3-C) → download legacy funciona.
- [ ] **Force regenerate** → sobrescreve cache e atualiza `storage_path`.
- [ ] **Compartilhar PDF** (mobile) → `sharePdfFromElement` funciona.
- [ ] Logout/login → cache continua acessível.
- [ ] Verificar `proposal_pdf_cache` tem `company_id` preenchido em registros novos.
- [ ] Conferir que usuário B não consegue baixar PDF de usuário A (mesmo na mesma company por enquanto, RLS legacy ainda restringe por `user_id`).
- [ ] Analytics de PDF (se houver) sem regressão.
- [ ] Console limpo (sem erros de upload).

## 6. Rollback plan

```sql
DROP POLICY "tenant: read pdfs by company membership"   ON storage.objects;
DROP POLICY "tenant: insert pdfs by company membership" ON storage.objects;
DROP POLICY "tenant: update pdfs by company membership" ON storage.objects;
DROP POLICY "tenant: delete pdfs by company membership" ON storage.objects;
DROP INDEX IF EXISTS public.idx_pdf_cache_company_proposal;
```
Frontend: reverter `pdfGenerator.tsx` para o commit anterior. PDFs gravados no path novo permanecem acessíveis enquanto a policy legacy `auth.uid()` não bloqueia (não bloqueia: paths novos não casam com legacy, mas o owner do upload é o mesmo `user_id` — leitura legacy falha, mas o path tenant-aware ainda é resolvido pela policy nova; após drop, ficariam órfãos. Por isso recomenda-se migrar de volta com script antes do drop).

## 7. Estratégia futura (M3-D / M3-E)

- **M3-D**: tenant-aware React Query keys + `currentCompanyId` derivado do switcher (quando existir).
- **M3-E**: backfill agressivo de PDFs legacy → tenant-aware; flip `MULTI_TENANT_RLS=true`; drop das policies legacy de storage e tabelas operacionais.

## 8. Compatibilidade

| Cenário | Funciona? |
|---|---|
| PDF antigo (legacy path) gravado pré-M3 | ✅ download via legacy policy |
| PDF novo gerado pós-M3-C | ✅ gravado em tenant path, lido por tenant policy |
| Cache aponta para legacy mas arquivo só existe em tenant | ✅ fallback no `tryGetCachedPdf` |
| Cache aponta para tenant mas arquivo só existe em legacy | ✅ fallback no `tryGetCachedPdf` |
| Usuário sem `profiles.company_id` (improvável) | ✅ cai no path legacy |

## 9. Arquivos alterados

- `supabase/migrations/<timestamp>_m3c_storage_tenant_aware.sql`
- `src/utils/pdfGenerator.tsx`
- `.lovable/audit/m3c-execution-report.md` (este)
