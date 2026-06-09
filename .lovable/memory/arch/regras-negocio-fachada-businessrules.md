---
name: Business Rules Facade
description: Onda 0 — businessRules.ts agrupa e re-exporta consortiumRates.ts como fachada única; novos módulos importam BUSINESS_RULES.* em vez de hardcodar números
type: constraint
---
**Single source of truth**: toda regra de negócio (limites, taxas, prazos, fatores) entra em `src/config/consortiumRates.ts` (fonte) e é re-exposta via `src/config/businessRules.ts` (fachada).

**Como adicionar uma nova regra**:
1. Defina o valor em `consortiumRates.ts` com docstring justificando.
2. Re-exponha em `BUSINESS_RULES` em `businessRules.ts`.
3. Importe via `BUSINESS_RULES.<grupo>.<chave>` nos módulos.

**Proibido**:
- Hardcodar 0.7, 0.3, 50, 18, 17, 12, 14.90, etc. em qualquer módulo financeiro/UI/PDF.
- Redefinir o mesmo valor em 2 lugares — sempre import.

**Exceções autorizadas** (parâmetros internos de motor, não regras de produto):
- `src/utils/bidsEngine.ts` — fatores de projeção (1.3, 0.7, 0.4, 0.3) são **parâmetros do modelo estatístico**, documentados em mem://logic/bids/market-projection-model e mem://logic/bids/adaptive-volatility-parameters. Não são regras de negócio comerciais.
- `src/components/modules/investment/InvestmentAssumptions.tsx` — presets Conservador/Realista/Otimista (10/3/0.4, 25/5/0.5, 40/7/0.7) são **assumptions ajustáveis pelo usuário**, não regras fixas.

**Política**: nunca modificar motores financeiros (`utils/calculations/*`, `bidsEngine.ts`) durante refatorações de regras — só leitura.
