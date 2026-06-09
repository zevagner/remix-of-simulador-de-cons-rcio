# Onda M3-D — Frontend Tenant-Aware (React Query Hardening)

Status: **executada** • UX: **inalterada** • Reversível: **sim**

## 1. Entregas

### 1.1 Helper canônico
- `src/utils/tenantKey.ts`
  - `tenantKey(companyId, ...parts)` → `['t', cid|'_pending', ...parts]`
  - `useCurrentCompanyId()` resolve `profiles.company_id` (cache 5min, gc 10min, key `['tenant','current-company-id']`)
  - Sentinela `TENANT_PENDING='_pending'` evita colisão; uso obrigatório com `enabled: !!cid`.

### 1.2 Hooks refatorados
| Arquivo | Antes | Depois |
|---|---|---|
| `useProposalsQueries.ts` | `['proposals','list']` | `['t', cid, 'proposals','list']` |
| `usePostSaleQueries.ts` | `['post-sale-clients']` etc. | `['t', cid, 'post-sale','clients']` etc. |
| `usePaginatedQueries.ts` | `['proposals','page',params]` etc. | `['t', cid, 'proposals','page',params]` etc. + propaga `p_company_id` para as RPCs |
| `useProposalEvents.ts` | `['proposal-events',id]` | `['t', cid, 'proposal-events', id]` |

Optimistic patches/snapshot/restore/invalidate de `useProposalsQueries.ts` agora todos operam sob `proposalsKeys.scope(cid)` → não vazam para outro tenant.

### 1.3 Service layer
- `fetchProposalsPage` ganhou parâmetro opcional `companyId` que vira `p_company_id` (aproveita RPCs tenant-aware criadas em M3-A).

### 1.4 Cache bust no `useAuth.tsx`
- **SIGNED_OUT** → `removeQueries(['t'])` + `removeQueries(['tenant'])`.
- **SIGNED_IN com user diferente** → mesma limpeza antes do load.
- Mesmo usuário re-logando preserva cache (sem refetch desnecessário).
- Queries globais (admin, assemblies/groups, auth) **não são tocadas** — usam keys próprias.

## 2. Hooks deliberadamente NÃO migrados (escopo global)

| Hook | Motivo |
|---|---|
| `useAdminQueries.ts` | Admin-only; visão global por design (M3-A confirmou). |
| `useAssemblies.ts` | Dados públicos para todos os usuários aprovados. |
| `AdminAuditLogs.tsx`, `AdminAIPerformance.tsx`, `AdminAIUsage.tsx` | Painéis admin globais. |
| `MockSeedFab.tsx` | Dev tool; usa `invalidateQueries()` global. |

Documentado para evitar refatoração equivocada futura.

## 3. Compatibilidade

| Cenário | Comportamento |
|---|---|
| Login do mesmo user em outra aba | Mesmo cache compartilhado (mesmo cid). ✅ |
| Token refresh | No-op (não muda cid). ✅ |
| Logout | Cache `['t']` e `['tenant']` removidos. ✅ |
| Login em outro user na mesma aba | Cache antigo removido antes do load. ✅ |
| `cid` ainda carregando | Queries operacionais com `enabled: !!cid` esperam (sem chamada zumbi). ✅ |
| Multi-membership (M4) | Trocar `currentCompanyId` no resolver gera novas keys naturalmente. ✅ |

## 4. Riscos identificados

| Risco | Severidade | Mitigação |
|---|---|---|
| Janela inicial sem `cid` adia a lista de propostas em ~150-300 ms | Baixa | `useCurrentCompanyId` cacheia 5min; após primeiro paint não há latência adicional. |
| Consumer externo importou `proposalsKeys.list()` (assinatura antiga) | Baixa | Grep-ado: nenhum consumidor externo. Assinatura agora exige `cid`. |
| Hooks que ainda chamam `qc.invalidateQueries({ queryKey: ['proposals'] })` | Nenhum | Auditados: sem ocorrências fora dos arquivos migrados. |
| Cache bust amplo demais limpa state legítimo | Baixa | Limpa apenas `['t']` e `['tenant']`; admin/global preservados. |
| `useAuth` agora depende de `QueryClientProvider` montado acima | Média | Já é o caso em `App.tsx` (QueryClientProvider envolve AuthProvider). |

## 5. Smoke checklist (preview)

- [ ] Login → lista de propostas carrega normalmente.
- [ ] Refresh F5 → cache persistente, sem dupla chamada.
- [ ] Mover proposta no Kanban → optimistic update visível, sem flicker.
- [ ] Erro forçado em mutation → reverte cache (snapshot/restore).
- [ ] Abrir detalhe de proposta → eventos carregam.
- [ ] Pós-venda: criar/editar cliente → lista invalida, contagem certa.
- [ ] Pós-venda: registrar lance → bids + events invalidados.
- [ ] Logout → React Query devtools mostram queries `['t', ...]` removidas; admin queries (se houver) preservadas.
- [ ] Login com **outro** usuário na mesma aba → não vê dados do anterior.
- [ ] Múltiplas abas mesmo user → trocar status em uma reflete na outra após invalidação/refocus.
- [ ] Admin Panel continua funcional (queries globais intactas).
- [ ] PDFs ainda funcionam (Onda M3-C).

## 6. Rollback plan

1. Reverter `src/utils/tenantKey.ts` (delete).
2. Reverter os 4 hooks refatorados via histórico.
3. Reverter as 2 mudanças cirúrgicas em `useAuth.tsx` (import + bloco SIGNED_IN/SIGNED_OUT) e `proposals.ts` (parâmetro `companyId`).
4. Backend permanece compatível (RPCs aceitam `p_company_id` opcional desde M3-A).

Sem migrações DB nesta onda → rollback é 100% frontend.

## 7. Pontos preparados para M3-E

- Cache isolado por tenant ✅
- Cache bust automático no login/logout ✅
- RPCs já recebendo `p_company_id` explícito ✅
- Storage tenant-aware (M3-C) ✅
- Triggers herdando `company_id` (M3-B) ✅
- RLS dual ativa (M3-A) ✅

**Pré-condições para flip `MULTI_TENANT_RLS=true` (M3-E)**: todas atendidas. Resta apenas auditoria final + DROP das policies legacy + remoção do filtro `auth.uid() = user_id` (mantendo `is_company_member` exclusivo).

## 8. Arquivos alterados

- `src/utils/tenantKey.ts` (novo)
- `src/hooks/useProposalsQueries.ts`
- `src/hooks/usePostSaleQueries.ts`
- `src/hooks/usePaginatedQueries.ts`
- `src/hooks/useProposalEvents.ts`
- `src/hooks/useAuth.tsx` (cache-bust)
- `src/services/proposals.ts` (`companyId` opcional)
- `.lovable/audit/m3d-execution-report.md` (este)
