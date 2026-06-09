---
name: Prestamista Operacional FIXO
description: Onda OP — premium FIXO mensal = (Crédito + TA + FR) × 0,0765%, constante todo o grupo, não amortiza, não varia por idade. Engine única calculatePrestamistaPremium em src/core/finance/prestamista. Drift zero entre motor mensal e legado.
type: feature
---

**Regra oficial CAIXA Consórcio (operacional):**
- `premium_mensal = Categoria Inicial × percentual_fixo`
- `Categoria Inicial = Crédito + Taxa Adm + Fundo Reserva` (não varia mês a mês)
- 0,0765% (cota nova, default) / 0,0680% (cota antiga)
- Premium FIXO até o fim do grupo — NÃO amortiza, NÃO acompanha saldo
- Idade NÃO altera prêmio — apenas elegibilidade (idade + prazo ≤ 80a)
- PJ → 0

**Engine única:** `calculatePrestamistaPremium({ initialCategory })` em `src/core/finance/prestamista/index.ts`. Consumida pelo motor mensal (`monthlySchedule.ts`), legado (`calculations.ts`) e Structured Ops. Proibido recalcular `creditValue × MIP × prazo` localmente em qualquer módulo.

**Composição canônica:** `parcela = (Crédito + TA + FR + insuranceTotal) / N` onde `insuranceTotal = monthlyPremium × N`.

**Substitui:** modelo atuarial anterior (Ondas 1–3) que usava saldo devedor decrescente. Drift agora = 0 entre motor mensal e legado.
