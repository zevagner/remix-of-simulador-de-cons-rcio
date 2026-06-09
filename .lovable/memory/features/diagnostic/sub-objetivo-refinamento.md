---
name: SubObjetivo Refinamento
description: Campo opcional subObjetivo no Diagnóstico para refinar mensagens (IA/WhatsApp/Storytelling) sem afetar cálculos
type: feature
---
Adicionado `subObjetivo: SubObjetivo` em `DiagnosticContext` (opcional, default `''`). Agrupado por `objetivoPrincipal` em `SUB_OBJETIVO_OPTIONS` com pré-seleção via `DEFAULT_SUB_OBJETIVO`. Helper `getSubObjetivoLabel()` retorna label legível.

**Não impacta** cálculos, decisionEngine, simulator, comparator. Usado APENAS para enriquecer:
- `AIProposalCard` → payload IA via `ProposalModule` (lê do diag e converte para label)
- `supabase/functions/generate-proposal` → instrução adicional no prompt
- `createStorytelling` → linha de foco no fim da narrativa + highlight 🎯

UI: chips opcionais dentro do passo Objetivo (sub-seção), com pré-seleção automática + botão Limpar. Resumo mostra "Objetivo · SubLabel".

Para adicionar novos subobjetivos: estender union `SubObjetivo` + entrada em `SUB_OBJETIVO_OPTIONS` + opcionalmente em `DEFAULT_SUB_OBJETIVO`.
