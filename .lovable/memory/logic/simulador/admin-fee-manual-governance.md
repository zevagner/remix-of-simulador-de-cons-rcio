---
name: Admin Fee Manual Governance
description: Taxa administrativa do simulador é 100% explícita — sem auto-suggest/apply/recompute, ESLint bloqueia getSuggestedAdminFee em UI/contexto
type: constraint
---
**Regra:** `adminFeePercent` é estado puro do formulário. Nenhum `useEffect`, `useMemo` derivado em mutação, ou setter automático pode alterá-lo. O único caminho legítimo é `updateInput('adminFeePercent', v)` por ação direta do usuário, ou `setInput(savedSession.input)` no restore (preserva o valor salvo), ou `defaultSimulatorInput` em `onReset`.

**O que está proibido:**
- Importar `getSuggestedAdminFee` de `@/config/consortiumRates` ou `@/config/businessRules` em qualquer arquivo de UI/contexto/hook (bloqueado por ESLint `no-restricted-imports`).
- Reintroduzir state `adminFeeManuallyEdited` ou similar (flag para controlar auto-apply).
- Adicionar effect `[input.consortiumType]` ou `[input.creditValue]` que toque em `adminFeePercent`.
- Exibir badge `"auto"`, botão `"Usar taxa sugerida"` ou qualquer UI sugerindo controle automático da taxa.

**Helper legado:** `getSuggestedAdminFee` permanece exportado em `consortiumRates.ts` + `BUSINESS_RULES.adminFee.suggested` apenas para compatibilidade de façade — sem consumidores ativos.

**Why:** "Continuar simulação" deve restaurar o estado exato. A arquitetura anterior misturava valor automático derivado com valor explícito, causando sobrescrita silenciosa pós-restore (effect `[consortiumType]` re-aplicava sugestão), drift visual (badge `auto` baseado em `===` de float) e ambiguidade de quem controlava a taxa.

**Onda:** Admin Fee Manual Governance Wave (2026-05-13).
**Auditoria:** `.lovable/audit/admin-fee-manual-governance-wave.md` (score 9.75/10).
