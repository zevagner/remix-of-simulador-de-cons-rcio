---
name: governance-institutional-core
description: Governança Admin = núcleo institucional oficial. 14 seções, owner por seção, since? por bloco, deep-link ?section=, validação build-time de audit-links via scripts/validate-governance-audit-links.mjs. Não criar novos block kinds sem pressão real de conteúdo.
type: feature
---
Governança da Plataforma (`src/data/governance/`) é o **núcleo institucional oficial** do produto.

## Estrutura
- 14 seções tipadas em `sections/*.ts`, registradas em `index.ts` (ordem = ordem de exibição).
- 4 groups com ordem canônica em `groupOrder`.
- 6 block kinds: `paragraph`, `bullets`, `kv`, `callout`, `audit-link`, `code`. **Não adicionar novos kinds sem pressão real de conteúdo.**

## Campos institucionais
- `GovernanceSection.owner?` — área responsável (Plataforma, Segurança, IA, Compliance, Operações).
- `GovernanceBlock.since?` — versão/onda em que a garantia entrou em vigor; renderizado como chip discreto ao lado do título.

## Deep-link
- URL canônica: `/admin?section=<id>` via `URLSearchParams` puro.
- Sem novo router. Sincronização via `history.replaceState` + listener `popstate`.

## Audit-links
- Validados em build por `scripts/validate-governance-audit-links.mjs` (exit 1 se órfão).
- Toda nova referência a `.lovable/audit/*.md` deve apontar para arquivo existente.

## Regras de manutenção
- Subtitle ≤ 8 palavras, verbo no infinitivo.
- Máx. 1 callout por seção.
- Densidade preservada: `space-y-4` entre blocos.
- Zero cor hardcoded — apenas tokens.
