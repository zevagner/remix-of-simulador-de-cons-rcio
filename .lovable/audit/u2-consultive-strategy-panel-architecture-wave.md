# Wave U2 — Consultive Strategy Panel Architecture

## Objetivo
Reconstruir o **Layer 2** (`ConsultiveStrategyPanel`) como **mini-playbook consultivo** modular, editorial e progressivo. Não é o "card gigante reciclado": é uma jornada de aprendizado.

## Arquitetura final

```
Sheet (right, max-w-xl, mobile-first)
├── Header sticky (hero editorial)
│   ├── Eyebrow "Mini playbook consultivo"
│   ├── Título + ícone + tese curta
│   ├── Tags (categoria, "Recomendada")
│   └── KPI snapshot (hero + 2 secundários)
└── Body editorial
    ├── A. Tese principal (sempre visível)
    ├── Accordion (section-level disclosure)
    │   ├── B. Como funciona               [aberto]
    │   ├── C. Quando faz sentido + timing [aberto]
    │   ├── D. Benefícios (chips)          [fechado]
    │   ├── E. Riscos & cuidados           [fechado]
    │   ├── F. Pitch consultivo            [aberto, highlight]
    │   ├── G. Objeções comuns             [fechado]
    │   ├── + Erros frequentes             [fechado]
    │   └── + Exemplos práticos            [fechado]
    └── Disclaimer institucional
```

## Princípios aplicados (20/20)

| # | Princípio | Implementação |
|---|---|---|
| 1 | Mini playbook | Header editorial com eyebrow "Mini playbook consultivo" |
| 2 | Arquitetura editorial | Eyebrows, micro-títulos, cadence respiração-insight-explicação |
| 3 | Seções modulares | 9 blocos independentes via `<Accordion type="multiple">` |
| 4 | Scanning consultivo | Ícones + uppercase eyebrows + bullets curtos |
| 5 | Hierarchy editorial | Tese → como → quando → benefícios → riscos → pitch → objeções |
| 6 | Progressive disclosure | `defaultOpen=[howItWorks, forWho, pitch]`; resto fechado |
| 7 | Consultive narrative | Pitch + objections coabitam |
| 8 | Pitch consultivo | Blockquote com citação + dica de uso |
| 9 | Objection handling | Lista de cards "objeção / resposta" |
| 10 | Learning flow | Ordem fixa: aprendi → entendi → sei explicar → sei defender |
| 11 | Visual silence | Bullets, chips, blockquotes — zero paredão |
| 12 | Editorial cadence | Alterna prosa / lista / chips / blockquote / cards |
| 13 | Mobile-first | `w-full sm:max-w-xl`, header sticky, padding generoso |
| 14 | Section-level disclosure | Cada bloco abre/fecha individualmente |
| 15 | Strategy blueprint preservado | 100% dos campos lidos de `ConsultiveContent` |
| 16 | Motor financeiro único | Zero cálculo; consumer puro |
| 17 | Performance | Sem state interno, sem efeitos, sem fetch |
| 18 | Coexistência | Continua atrás de `ENABLE_STRATEGY_PRESENTATION_V2` |
| 19 | Aprendizado consultivo | Pitch + objeções + erros + exemplos juntos |
| 20 | Premium feel | Tokens semânticos, tom institucional, tipografia editorial |

## Subcomponentes
- `<Section>` — bloco sempre visível com eyebrow + ícone.
- `<ModuleItem>` — item de Accordion editorial (tone: neutral/positive/caution; flag `highlight`).
- `<BulletList>` — lista densidade-baixa com dot semântico.
- `<ChipList>` — chips circulares para benefícios.

## O que NÃO foi feito (correto)
- Sem novos cálculos financeiros.
- Sem alteração de `blueprint.ts` / `contracts.ts` / `adapters.ts`.
- Sem montagem em produção (gating segue OFF).
- Sem alteração do Layer 1 (Executive Card).

## Próxima wave
**U3 — Compare Workspace (Layer 3)**: matriz comparativa, timeline overlay, drawer lateral, diferenças destacadas. Continua sob feature flag.

## Arquivos
- editado: `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` (rewrite completo)
- criado:  `.lovable/audit/u2-consultive-strategy-panel-architecture-wave.md`
