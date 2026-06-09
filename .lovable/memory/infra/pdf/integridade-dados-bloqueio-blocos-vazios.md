---
name: PDF integridade de dados
description: Proposta Completa — bloco selecionado sem dados reais NÃO renderiza; storytelling auto-gerado via centralAI; aviso UI lista blocos omitidos
type: feature
---
Pipeline de blocos da Proposta Completa (`PdfPropostaCompleta.buildProposalPages`):
- Predicado `blockHasRealData` por bloco. Se selecionado mas sem dados reais → página descartada (sem fallback genérico).
- Gates: cmp-financing/cmp-cash via `hasComparisonData`; strategy-* via `hasStrategyData`; bids-study e contemplation via `hasBidsStudyData` (mesmo gate); diagnostic/simulation via `creditValue>0`; storytelling sempre OK (cache OU `defaultStorytelling` determinístico); arguments/objections sempre OK (defaults consultivos).
- Capa, abertura, fechamento são "chrome" (sempre presentes).
- `getMissingDataBlocks(data)` exposto para a UI.

`ProposalPdfModule`:
- `ensureStorytelling()` chama `centralAI.generateInsight('summary')` quando bloco selecionado e cache vazio (idempotente, silencioso em falha — usa default).
- Disparado no `openPreview` e via `useEffect` ao marcar o checkbox "Storytelling".
- Aviso `<Alert>` lista blocos selecionados sem dados (com hint de onde preencher), antes do CTA "Gerar PDF Premium".
