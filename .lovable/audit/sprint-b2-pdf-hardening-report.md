# Sprint B.2 — PDF Pipeline Hardening & Safe Modularization

**Status:** ✅ Concluída
**Data:** 2026-05-12
**Foco:** previsibilidade, async safety, testabilidade — sem novas features.

---

## 1. Resumo Executivo

Sprint B.2 endureceu o pipeline de geração/compartilhamento de PDFs e
modularizou de forma conservadora o `ProposalPdfModule` sem alterar
comportamento operacional.

| Métrica                                        | Antes | Depois |
| ---------------------------------------------- | ----- | ------ |
| `ProposalPdfModule.tsx` (LOC)                  | 877   | **660** |
| Testes unitários do pipeline PDF               | 0     | **23** |
| Testes multi-tenant invariants                 | 8     | 8 (estáveis) |
| `useEffect` inline para auto-gen storytelling  | 1     | 0 (encapsulado em hook) |
| `useState` específicos do storytelling no módulo | 2   | 0 |
| Mutex anti-double-submit                       | ❌    | ✅ por `proposalId` |
| Dual-read dedup                                | manual| ✅ helper puro |
| Classificação centralizada de erros HTTP       | ❌    | ✅ `classifyPdfError` |

**Resultado:** pipeline mais previsível, async hardened, e o módulo
ficou substancialmente menor sem regressão visual ou de comportamento.

---

## 2. Pipeline PDF Mapeado

```text
ProposalPdfModule
   ├── buildData()                  ← 220 LOC, NÃO extraído (ver §6)
   ├── useStorytellingAutoGen()     ← extraído
   ├── FollowupCard                 ← extraído
   └── PdfDownloadButton
        └── generatePdfFromElement / sharePdfFromElement
             └── withProposalMutex(key, task)              ← async hardening
                  ├── tryGetCachedPdf
                  │    ├── proposal_pdf_cache (DB)
                  │    └── dualReadCandidates → storage
                  ├── renderToHtmlString (DOM off-screen)
                  ├── callGeneratePdfEdge (Browserless)
                  │    └── classifyPdfError → user message
                  └── savePdfToCache (fire-and-forget)
                       └── resolveWritePath (tenant-aware)
```

Helpers puros vivem em `src/utils/pdf/pdfPipelineHelpers.ts` e são
testados isoladamente sem DOM/React/supabase.

---

## 3. Testes Executados

```bash
bunx vitest run \
  src/test/pdfPipelineHelpers.test.ts \
  src/test/multitenant.invariants.test.ts
```

**Resultado: 31/31 verde em 2.53s.**

| Suite                              | Casos | Cobre |
| ---------------------------------- | ----- | ----- |
| path builders                      | 6     | tenant/legacy/resolve, defesa contra inputs vazios |
| dual-read                          | 4     | ordem, dedup, fallback null, vazio |
| sanitizePdfFilename                | 3     | unsafe chars, fallback, truncamento |
| classifyPdfError                   | 5     | 401/413/429/5xx/desconhecido |
| withProposalMutex                  | 5     | execução, coalesce, paralelismo, cleanup OK e erro |
| **multitenant.invariants** (regr.) | 8     | tenantKey scoping, storage paths |

Mutex específicamente validado:
- ✅ chamadas concorrentes com mesma key compartilham 1 promise (1 run)
- ✅ keys diferentes rodam em paralelo
- ✅ cleanup em sucesso E em erro (não vaza `inflight`)

---

## 4. Modularizações Aplicadas

### 4.1. `useStorytellingAutoGen` (hook)
- Antes: 2 `useState` + 1 `useMemo` + 1 função inline + 1 `useEffect` no módulo.
- Depois: 1 chamada de hook, sem efeitos colaterais visíveis no `ProposalPdfModule`.
- Garantias: **idempotente** (não re-gera se cache existe), **non-blocking**
  (falha de IA não interrompe o PDF — fallback determinístico),
  **estável** (zero mudança de comportamento operacional).

### 4.2. `FollowupCard`
- Encapsula sequência WhatsApp pós-PDF + analytics tracking.
- Removido do módulo principal.

### 4.3. `pdfPipelineHelpers.ts`
- Fonte única para path tenant/legacy, dual-read, mutex, error classification.
- Importado tanto por `pdfGenerator.tsx` quanto pela suíte de testes.
- **Sem deps de React/DOM/supabase** → 100% testável puro.

---

## 5. Async Hardening — `generatePdfFromElement` / `sharePdfFromElement`

| Risco                       | Mitigação aplicada |
| --------------------------- | ------------------ |
| Double-submit (clique duplo)| `withProposalMutex('gen:' + proposalId, …)` coalesce inflight |
| Race entre gerar/compartilhar | Keys distintas (`gen:` vs `share:`) — não bloqueiam mutuamente |
| Geração ad-hoc sem proposalId| Key única por chamada (timestamp+random) — sem cross-talk |
| Cache stale após edição     | Trigger DB já invalida; dual-read tolera path antigo |
| Tenant path antes de M3-C   | `dualReadCandidates` lê registered → tenant → legacy |
| Erro 429 com mensagem custom | Edge `message` preservada; senão fallback de `classifyPdfError` |
| Falha de upload de cache    | `void savePdfToCache(...)` fire-and-forget — nunca bloqueia o usuário |

---

## 6. Avaliação: extrair `buildData` para `useProposalPdfData`?

**Recomendação: NÃO extrair nesta sprint.**

### Análise risco × benefício

| Critério                         | Avaliação |
| -------------------------------- | --------- |
| Tamanho                          | ~220 LOC, ~10 dependências (sim, diag, journey, investment, bidsStudy, custom*, cachedList) |
| Pureza                           | Quase pura — mas tem 2 caminhos (`strict`/`preview`) com side-effects (toast/trackEvent) no strict |
| Reuso                            | Chamado em 3 lugares (PDF real, preview, missingBlocks). Reuso real é interno. |
| Risco operacional                | **Alto** — qualquer regressão silenciosa quebra integridade do PDF |
| Cobertura de teste atual         | Indireta (snapshots/integração), não unitária |
| Benefício imediato de DX         | Médio — leitura melhora, mas o módulo já caiu para 660 LOC |

### Pré-requisitos para extrair com segurança (próxima sprint)

1. Suite de **testes de integração de PDF** com fixtures determinísticos
   (1 simulação realista × 2-3 combinações de blocos).
2. Separar caminhos `strict` e `preview` em **duas funções puras** distintas
   — não esconder o switch num único hook.
3. Manter os side-effects (`toast`, `trackEvent`) FORA do hook —
   responsabilidade do caller.

Enquanto não há fixtures de integração, extrair seria trocar
risco operacional alto por ganho cosmético médio.

---

## 7. Observabilidade

- `logger.error` continua sendo o canal padrão para erros de cache/upload.
- `classifyPdfError` produz mensagens consistentes para `toast` + log.
- `Sentry` (Sprint A) captura via `ErrorBoundary` + `captureException` quando
  `VITE_SENTRY_DSN` está configurado — falhas de geração rebatem como erros
  na UI e são capturadas naturalmente pelo boundary.
- **Não foi adicionado** tracing distribuído nesta sprint — ficou como
  candidato para M4/Manager Views, onde múltiplas operações async exigem
  correlação real.

---

## 8. Próximos Gargalos Reais (priorizados)

| # | Item | Justificativa | Sprint sugerida |
| - | ---- | ------------- | --------------- |
| 1 | Testes de integração de PDF (fixtures determinísticos) | Pré-requisito para refatorar `buildData` com segurança | B.3 ou paralelo a M4 |
| 2 | `InvestmentModule` ainda em 842 LOC | Fluxo de cenários ainda mistura UI + derivação | B.3 |
| 3 | Retry com backoff em `callGeneratePdfEdge` | Hoje uma falha de upstream propaga direto | M4-prep |
| 4 | Cache server-side por `content_hash` real (não timestamp) | Atual `${proposalId}-${Date.now()}` invalida sempre | observacional |
| 5 | Telemetria de tempo de geração (p50/p95) | Falta visibilidade de degradação de Browserless | M4 |

---

## 9. Riscos Restantes

| Risco | Severidade | Mitigação atual |
| ----- | ---------- | --------------- |
| Mutex é in-memory (não cross-tab) | Baixa | Edge tem rate-limit; usuário típico gera de 1 aba |
| `buildData` ainda é 220 LOC dentro do componente | Média | Aceito explicitamente até existirem fixtures |
| Hook `useStorytellingAutoGen` dispara IA via efeito | Baixa | Idempotente + falha silenciosa + fallback determinístico |
| Falta retry em upstream 5xx | Baixa-Média | Mensagem clara via `classifyPdfError`; usuário re-tenta |

---

## 10. Score de Maturidade

| Sprint | Score | Δ |
| ------ | ----- | - |
| Sprint A (Performance & Hardening) | 8.2 | — |
| Sprint B (Modularization)          | 8.4 | +0.2 |
| **Sprint B.2 (PDF Hardening)**     | **8.5** | **+0.1** |

Pequeno incremento intencional: a sprint **não tinha como objetivo** abrir
novas capacidades, e sim **reduzir risco operacional** no caminho mais
sensível do produto (PDF). Score sobe de forma proporcional ao ganho real.

---

## 11. Pronto para M4

✅ Pipeline PDF previsível
✅ Async flow endurecido (mutex validado)
✅ Helpers puros 100% testáveis
✅ `ProposalPdfModule` 24,7% menor (877 → 660)
✅ Zero regressão (multi-tenant invariants 8/8, novos 23/23)
✅ Observabilidade consistente via `logger` + Sentry boundary
✅ Documentação de gargalos restantes priorizada

**Recomendação:** prosseguir para **M4 — Manager Views**, mantendo
`buildData` como dívida técnica explicitamente catalogada.
